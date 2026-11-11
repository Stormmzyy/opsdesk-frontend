import { delay, http, HttpResponse } from 'msw'
import type { DefaultBodyType, PathParams } from 'msw'
import type { Project } from '../features/projects/types.ts'
import { employees } from '../data/employees.ts'
import { MOCK_CREATOR } from '../data/tickets.ts'
import { getDepartments } from '../features/employees/utils/employeeHelpers.ts'
import type { Ticket, TicketPage } from '../features/tickets/types.ts'
import { filterTickets, isRecord, isTicket } from '../features/tickets/utils/ticketHelpers.ts'
import { parsePriority, parseStatus } from '../features/tickets/utils/ticketStatus.ts'
import {
  validateDescription,
  validateTitle,
} from '../features/tickets/utils/ticketValidation.ts'
import { parseId } from '../utils/parseId.ts'
import type { User } from '../features/users/types.ts'
import { getAllProjects } from './projectDb.ts'
import { getAllTickets, resetToSampleTickets, saveAllTickets } from './ticketDb.ts'
import { addUser, getAllUsers } from './userDb.ts'

// Request handlers for the mock API: tickets, projects and users.
//
// MSW (Mock Service Worker) catches the app's fetch requests before they
// leave the browser. When a request matches one of these handlers, MSW calls
// it and sends back its response, as if a real server had answered. The app
// can't tell the difference, so when the real backend arrives, nothing in the
// app has to change: these handlers are simply switched off.
//
// Every path starts with /api/v1, the default VITE_API_URL (see .env.example).
// The "v1" is the API's version: if the API ever has to change in a way that
// breaks old clients, the new version can live at /api/v2 alongside it.
// If you change VITE_API_URL to another path, change these paths to match.

// Everything below follows API_CONTRACT.md. If the two ever disagree, the
// contract wins and this file is fixed (handlers.test.ts checks them).

// What every error response looks like, e.g.
// { error: 'NOT_FOUND', message: 'No ticket with id "99".' }
// - error: a fixed code the app can check in code. It never changes wording.
// - message: a sentence for people. It may be reworded at any time.
// - fields: only for VALIDATION_ERROR, one message per invalid field.
// The contract also lists UNAUTHORIZED and CONFLICT, but only the auth
// endpoints use those, and the mock doesn't serve them yet.
type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'UNAUTHORIZED'
  | 'CONFLICT'

// The ticket fields a client can send. (Never id: the server owns that.)
type TicketField = 'title' | 'description' | 'priority' | 'status' | 'team'

// One message per invalid field, e.g. { title: 'Title is required.' }.
// Partial: only the fields with a problem are in it.
type FieldProblems = Partial<Record<TicketField, string>>

interface ErrorBody {
  error: ErrorCode
  message: string
  // Keyed by body field, or by query parameter name for GET /tickets.
  fields?: Partial<Record<string, string>>
}

function errorResponse(status: number, error: ErrorCode, message: string) {
  return HttpResponse.json<ErrorBody>({ error, message }, { status })
}

// 400 VALIDATION_ERROR, listing every invalid field. The message joins the
// field messages into one sentence, for clients that don't read `fields`.
function validationErrorResponse(fields: Partial<Record<string, string>>) {
  return HttpResponse.json<ErrorBody>(
    { error: 'VALIDATION_ERROR', message: Object.values(fields).join(' '), fields },
    { status: 400 },
  )
}

// URL params can, in theory, be a list (for patterns like /:path*), so only
// accept a single string. Then turn it into a numeric id (of a ticket or a
// project), which is undefined for anything that isn't a whole number, like "abc".
function readId(param: string | readonly string[] | undefined): number | undefined {
  return typeof param === 'string' ? parseId(param) : undefined
}

// Reads the request body as JSON. Returns undefined if it isn't valid JSON.
// The result is unknown: anyone can send anything, so it must be checked.
async function readJsonBody(request: Request): Promise<unknown> {
  try {
    const body: unknown = await request.json()
    return body
  } catch {
    return undefined
  }
}

// The five teams a ticket can belong to: the departments in the employee data.
const TEAMS = getDepartments(employees)

// The messages for fields that must be one of a fixed set of values. They're
// written out to match API_CONTRACT.md word for word.
const PRIORITY_MESSAGE = 'Priority must be one of LOW, MEDIUM, HIGH or URGENT.'
const STATUS_MESSAGE = 'Status must be one of OPEN, IN_PROGRESS, RESOLVED or CLOSED.'
const TEAM_MESSAGE = 'Team must be one of Engineering, Finance, HR, Operations or Support.'

// Checks one field of a request body. Returns its error message, or
// undefined when it's fine. A real server never trusts the client to have
// checked already: anyone can send anything, so `value` is unknown.
// The title and description use the SAME rules as the form (shared from
// ticketValidation.ts), so the messages match what the form shows.
function findFieldProblem(field: TicketField, value: unknown): string | undefined {
  switch (field) {
    case 'title':
      // Missing counts as empty: "Title is required."
      if (value === undefined || value === null) {
        return validateTitle('')
      }
      return typeof value === 'string' ? validateTitle(value) : 'Title must be text.'
    case 'description':
      if (value === undefined || value === null) {
        return validateDescription('')
      }
      return typeof value === 'string' ? validateDescription(value) : 'Description must be text.'
    case 'priority':
      return typeof value === 'string' && parsePriority(value) ? undefined : PRIORITY_MESSAGE
    case 'status':
      return typeof value === 'string' && parseStatus(value) ? undefined : STATUS_MESSAGE
    case 'team':
      return typeof value === 'string' && TEAMS.includes(value) ? undefined : TEAM_MESSAGE
  }
}

// Checks the listed fields of a request body, ALL of them, so the client
// hears about every problem at once rather than fixing one at a time.
// Returns {} when every field is fine.
function findFieldProblems(
  body: Record<string, unknown>,
  fieldsToCheck: readonly TicketField[],
): FieldProblems {
  const problems: FieldProblems = {}
  for (const field of fieldsToCheck) {
    const problem = findFieldProblem(field, body[field])
    if (problem) {
      problems[field] = problem
    }
  }
  return problems
}

// The contract says text is trimmed before it's saved, so " Hi " is saved
// as "Hi". Anything that isn't text is passed through for the checks above.
function trimIfText(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value
}

// Every field PATCH may change, and the fields POST needs (no status: new
// tickets always start as OPEN).
const PATCHABLE_FIELDS: readonly TicketField[] = ['title', 'description', 'priority', 'status', 'team']
const CREATE_FIELDS: readonly TicketField[] = ['title', 'description', 'priority', 'team']

// --- GET /tickets' query parameters -----------------------------------------
// The contract's seven parameters, its messages word for word, and its
// orders "by meaning". Every problem is reported, keyed by the parameter's
// NAME (or the unknown name that was sent), in the order they were sent.

const LIST_PARAMETERS = ['page', 'size', 'status', 'priority', 'team', 'search', 'sort']
const SORT_MESSAGE =
  'Sort must be id, title, status, priority or team, optionally followed by ,asc or ,desc.'
const STATUS_ORDER = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const PRIORITY_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

function findListParameterProblems(params: URLSearchParams): Record<string, string> {
  const problems: Record<string, string> = {}
  for (const name of new Set(params.keys())) {
    if (!LIST_PARAMETERS.includes(name)) {
      problems[name] = `There is no query parameter called "${name}".`
      continue
    }
    const values = params.getAll(name)
    if (values.length > 1) {
      // "Status can only be sent once.", with the parameter's own name.
      problems[name] = `${name[0].toUpperCase()}${name.slice(1)} can only be sent once.`
      continue
    }
    const value = values[0]
    // Every parameter except search refuses an empty value.
    switch (name) {
      case 'page':
        if (!/^[0-9]+$/.test(value) || Number(value) < 1) {
          problems.page = 'Page must be a whole number, 1 or more.'
        }
        break
      case 'size':
        if (!/^[0-9]+$/.test(value) || Number(value) < 1 || Number(value) > 100) {
          problems.size = 'Size must be a whole number from 1 to 100.'
        }
        break
      case 'status':
        if (parseStatus(value) === undefined) problems.status = STATUS_MESSAGE
        break
      case 'priority':
        if (parsePriority(value) === undefined) problems.priority = PRIORITY_MESSAGE
        break
      case 'team':
        if (!TEAMS.includes(value)) problems.team = TEAM_MESSAGE
        break
      case 'sort':
        // Lowercase direction, one of five fields: "title,DESC" is a 400.
        if (!/^(id|title|status|priority|team)(,(asc|desc))?$/.test(value)) {
          problems.sort = SORT_MESSAGE
        }
        break
    }
  }
  return problems
}

// --- Signing in -------------------------------------------------------------

// The backend's development password for its seeded accounts, which its
// README publishes. The mock's sample users are the same six people, so they
// sign in the same way. It is not a secret, and it is never a real password.
const MOCK_PASSWORD = 'devpassword123'

// A mock token is just this prefix and the user's id: there's nothing to
// sign, because nothing in the mock checks a token except /auth/me.
const MOCK_TOKEN_PREFIX = 'mock-token-'

const NO_VALID_TOKEN_MESSAGE =
  'You need to log in first. Send your token as "Authorization: Bearer <token>".'

function userForToken(header: string | null): User | undefined {
  const prefix = `Bearer ${MOCK_TOKEN_PREFIX}`
  if (header === null || !header.startsWith(prefix)) {
    return undefined
  }
  const id = Number(header.slice(prefix.length))
  return getAllUsers().find((user) => user.id === id)
}

// The contract's register rules and messages (POST /auth/register).
function findRegisterProblems(body: Record<string, unknown>): Record<string, string> {
  const problems: Record<string, string> = {}
  if (typeof body.name !== 'string' || body.name.trim() === '') {
    problems.name = 'Name is required.'
  }
  if (typeof body.username !== 'string' || !/^[A-Za-z0-9_.]{3,30}$/.test(body.username)) {
    problems.username = 'Username must be 3 to 30 letters, numbers, dots or underscores.'
  }
  if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    problems.email = 'Enter a valid email address.'
  }
  if (typeof body.password !== 'string' || body.password.length < 8) {
    problems.password = 'Password must be at least 8 characters.'
  } else if (new TextEncoder().encode(body.password).length > 72) {
    // Counted in bytes, as BCrypt does on the server.
    problems.password = 'Password must be at most 72 bytes.'
  }
  return problems
}

// Orders by meaning, not spelling: priority LOW to URGENT, status OPEN to
// CLOSED, title ignoring case, team alphabetically, id numerically.
function compareBy(field: string, a: Ticket, b: Ticket): number {
  switch (field) {
    case 'title':
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase())
    case 'status':
      return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
    case 'priority':
      return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
    case 'team':
      return a.team.localeCompare(b.team)
    default:
      return a.id - b.id
  }
}

// Handlers that can answer with a ticket OR an error say so up front, in the
// third type parameter of http.get / http.post / http.patch. Otherwise MSW
// guesses the response type from the first `return` and rejects the other.
// The first two type parameters are the URL params and the request body.
type TicketOrError = Ticket | ErrorBody

export const handlers = [
  // GET /api/v1/tickets: every ticket as a plain array, or, as soon as any
  // query parameter is sent, one page of them in the contract's envelope
  // (API_CONTRACT.md, "Filtering, sorting and pagination").
  //
  // The mock has no signed-in user, so it lists every ticket; the real
  // server counts only the tickets the caller may see.
  http.get<PathParams, DefaultBodyType, Ticket[] | TicketPage | ErrorBody>(
    '/api/v1/tickets',
    async ({ request }) => {
      // delay() waits a realistic, random time (like a real network), so the
      // loading states actually show up. In tests (Node) it only waits 5ms.
      await delay()
      const params = new URL(request.url).searchParams
      if ([...params.keys()].length === 0) {
        return HttpResponse.json<Ticket[]>(getAllTickets())
      }

      const problems = findListParameterProblems(params)
      if (Object.keys(problems).length > 0) {
        return validationErrorResponse(problems)
      }

      const page = Number(params.get('page') ?? '1')
      const size = Number(params.get('size') ?? '10')
      const status = params.get('status')
      const priority = params.get('priority')
      const team = params.get('team')
      const [sortField, direction] = (params.get('sort') ?? 'id').split(',')

      // Search: the same "contains, ignoring case and surrounding spaces, in
      // title or description" rule as the server.
      const matching = filterTickets(getAllTickets(), params.get('search') ?? '', 'ALL').filter(
        (ticket) =>
          (status === null || ticket.status === status) &&
          (priority === null || ticket.priority === priority) &&
          (team === null || ticket.team === team),
      )
      const sorted = [...matching].sort((a, b) => {
        const byField = compareBy(sortField, a, b) * (direction === 'desc' ? -1 : 1)
        // Equal values stay in id order, so a page boundary falls in the same
        // place on every request.
        return byField !== 0 ? byField : a.id - b.id
      })

      // page counts from 1. A page past the end is not an error: no items,
      // and the real totals.
      const start = (page - 1) * size
      return HttpResponse.json<TicketPage>({
        items: sorted.slice(start, start + size),
        page,
        size,
        totalItems: sorted.length,
        totalPages: Math.ceil(sorted.length / size),
      })
    },
  ),

  // GET /api/v1/tickets/:id: one ticket, or 404.
  http.get<PathParams<'id'>, DefaultBodyType, TicketOrError>(
    '/api/v1/tickets/:id',
    async ({ params }) => {
      await delay()
      const id = readId(params.id)
      const ticket = getAllTickets().find((item) => item.id === id)
      if (!ticket) {
        // Covers both "abc" (not a number) and 999 (no such ticket).
        return errorResponse(404, 'NOT_FOUND', `No ticket with id "${String(params.id)}".`)
      }
      return HttpResponse.json<Ticket>(ticket)
    },
  ),

  // POST /api/v1/tickets: create a ticket. The server picks the id, and every
  // new ticket starts as OPEN, whatever the request says.
  http.post<PathParams, DefaultBodyType, TicketOrError>('/api/v1/tickets', async ({ request }) => {
    await delay()
    const body = await readJsonBody(request)
    if (!isRecord(body)) {
      return errorResponse(400, 'BAD_REQUEST', 'The request body must be a JSON object.')
    }

    const problems = findFieldProblems(body, CREATE_FIELDS)
    if (Object.keys(problems).length > 0) {
      return validationErrorResponse(problems)
    }

    const tickets = getAllTickets()
    // One more than the biggest id so far, so the new id is always unique.
    const newId = Math.max(0, ...tickets.map((ticket) => ticket.id)) + 1
    // Only copy the fields a client may set, so anything extra (an id, a
    // status, a field we don't know) is ignored.
    const candidate = {
      id: newId,
      status: 'OPEN',
      title: trimIfText(body.title),
      description: trimIfText(body.description),
      priority: body.priority,
      team: body.team,
      // Set by the server, never by the client. The mock has no signed-in
      // user to credit yet (Part 6), so it uses the sample tickets' creator.
      assigneeId: null,
      assigneeName: null,
      ...MOCK_CREATOR,
      version: 0,
    }

    // Every field was checked above, but TypeScript can't see that: to it,
    // they're all still "unknown". isTicket checks the types once more and,
    // when it passes, lets TypeScript treat candidate as a Ticket. It can't
    // fail after the checks above; if it ever did, that would be a bug in
    // this file, which is what 500 INTERNAL_ERROR means.
    if (!isTicket(candidate)) {
      return errorResponse(500, 'INTERNAL_ERROR', 'The ticket could not be saved.')
    }

    saveAllTickets([...tickets, candidate])
    // 201 Created: the standard status for "a new thing was made".
    return HttpResponse.json<Ticket>(candidate, { status: 201 })
  }),

  // POST /api/v1/tickets/reset: throw away every change and restore the sample
  // tickets. Used by the "Reset to sample data" button. A real backend
  // wouldn't have this; it only exists to make the mock easy to reset.
  http.post('/api/v1/tickets/reset', async () => {
    await delay()
    return HttpResponse.json<Ticket[]>(resetToSampleTickets())
  }),

  // PATCH /api/v1/tickets/:id: change some fields of a ticket. PATCH means
  // "update only what I send", e.g. { status: 'RESOLVED' } to move a ticket.
  http.patch<PathParams<'id'>, DefaultBodyType, TicketOrError>(
    '/api/v1/tickets/:id',
    async ({ params, request }) => {
      await delay()
      const id = readId(params.id)
      const tickets = getAllTickets()
      const existing = tickets.find((item) => item.id === id)
      if (!existing) {
        return errorResponse(404, 'NOT_FOUND', `No ticket with id "${String(params.id)}".`)
      }

      const body = await readJsonBody(request)
      if (!isRecord(body)) {
        return errorResponse(400, 'BAD_REQUEST', 'The request body must be a JSON object.')
      }

      // Only check the fields that were sent: the others keep their
      // current, already valid, values.
      const sentFields = PATCHABLE_FIELDS.filter((field) => field in body)
      const problems = findFieldProblems(body, sentFields)
      if (Object.keys(problems).length > 0) {
        return validationErrorResponse(problems)
      }

      // Start from the existing ticket and replace only the fields that were
      // sent. The id always stays the same, even if the body has one.
      const candidate = {
        id: existing.id,
        title: 'title' in body ? trimIfText(body.title) : existing.title,
        description: 'description' in body ? trimIfText(body.description) : existing.description,
        priority: 'priority' in body ? body.priority : existing.priority,
        status: 'status' in body ? body.status : existing.status,
        team: 'team' in body ? body.team : existing.team,
        // The people stay as they were.
        assigneeId: existing.assigneeId,
        assigneeName: existing.assigneeName,
        createdById: existing.createdById,
        createdByName: existing.createdByName,
        // Settled just below: it only goes up if something changed.
        version: existing.version,
      }
      // As on the server: a PATCH that changes nothing writes nothing, so
      // the version stays. (Hibernate's @DynamicUpdate skips the UPDATE when
      // no column differs, and @Version only moves on an UPDATE.)
      const changed = PATCHABLE_FIELDS.some((field) => candidate[field] !== existing[field])
      if (changed) {
        candidate.version += 1
      }

      // As in POST: the checks above already passed; this just lets
      // TypeScript treat candidate as a Ticket.
      if (!isTicket(candidate)) {
        return errorResponse(500, 'INTERNAL_ERROR', 'The ticket could not be saved.')
      }

      saveAllTickets(tickets.map((ticket) => (ticket.id === existing.id ? candidate : ticket)))
      return HttpResponse.json<Ticket>(candidate)
    },
  ),

  // DELETE /api/v1/tickets/:id: remove a ticket for good, or 404.
  // The response type is ErrorBody | null: null for the empty body of a
  // successful delete, an ErrorBody when it fails.
  http.delete<PathParams<'id'>, DefaultBodyType, ErrorBody | null>(
    '/api/v1/tickets/:id',
    async ({ params }) => {
      await delay()
      const id = readId(params.id)
      const tickets = getAllTickets()
      if (!tickets.some((ticket) => ticket.id === id)) {
        // Covers "abc" (not a number) and 999 (no such ticket), as GET does.
        return errorResponse(404, 'NOT_FOUND', `No ticket with id "${String(params.id)}".`)
      }

      // Keep every ticket except this one.
      saveAllTickets(tickets.filter((ticket) => ticket.id !== id))
      // 204 No Content: "it worked, and there's nothing to send back".
      // The ticket is gone, so there's no ticket to return.
      return new HttpResponse(null, { status: 204 })
    },
  ),

  // PATCH /api/v1/tickets/:id/assignee: give the ticket to someone.
  // The contract's checks in decision 22's order: a missing ticket (404)
  // before anything about the body. The mock has no signed-in user, so it
  // never answers the 403 the real server gives anyone but ADMIN and MANAGER.
  http.patch<PathParams<'id'>, DefaultBodyType, TicketOrError>(
    '/api/v1/tickets/:id/assignee',
    async ({ params, request }) => {
      await delay()
      const id = readId(params.id)
      const tickets = getAllTickets()
      const existing = tickets.find((item) => item.id === id)
      if (!existing) {
        return errorResponse(404, 'NOT_FOUND', `No ticket with id "${String(params.id)}".`)
      }

      const body = await readJsonBody(request)
      if (!isRecord(body)) {
        return errorResponse(400, 'BAD_REQUEST', 'The request body must be a JSON object.')
      }

      // The contract's messages, word for word, in its order: missing (null
      // counts as missing: {"assigneeId": null} is never "unassign"), not a
      // whole number of 1 or more, no such user, a USER.
      const assigneeId = body.assigneeId
      if (assigneeId === undefined || assigneeId === null) {
        return validationErrorResponse({ assigneeId: 'Assignee id is required.' })
      }
      if (typeof assigneeId !== 'number' || !Number.isInteger(assigneeId) || assigneeId < 1) {
        return validationErrorResponse({ assigneeId: 'Assignee id must be a positive whole number.' })
      }
      const assignee = getAllUsers().find((user) => user.id === assigneeId)
      if (!assignee) {
        return validationErrorResponse({ assigneeId: `No user with id ${assigneeId}.` })
      }
      if (assignee.role === 'USER') {
        return validationErrorResponse({ assigneeId: "A USER can't be assigned tickets." })
      }

      // Assigning the person who already has it is not an error: 200, and
      // nothing is written, so the version stays the same.
      if (existing.assigneeId === assignee.id) {
        return HttpResponse.json<Ticket>(existing)
      }
      const saved: Ticket = {
        ...existing,
        assigneeId: assignee.id,
        assigneeName: assignee.name,
        version: existing.version + 1,
      }
      saveAllTickets(tickets.map((ticket) => (ticket.id === existing.id ? saved : ticket)))
      return HttpResponse.json<Ticket>(saved)
    },
  ),

  // DELETE /api/v1/tickets/:id/assignee: nobody has it any more. Unassigning
  // a ticket nobody has is not an error: 200, and the version stays.
  http.delete<PathParams<'id'>, DefaultBodyType, TicketOrError>(
    '/api/v1/tickets/:id/assignee',
    async ({ params }) => {
      await delay()
      const id = readId(params.id)
      const tickets = getAllTickets()
      const existing = tickets.find((item) => item.id === id)
      if (!existing) {
        return errorResponse(404, 'NOT_FOUND', `No ticket with id "${String(params.id)}".`)
      }
      if (existing.assigneeId === null) {
        return HttpResponse.json<Ticket>(existing)
      }
      const saved: Ticket = {
        ...existing,
        assigneeId: null,
        assigneeName: null,
        version: existing.version + 1,
      }
      saveAllTickets(tickets.map((ticket) => (ticket.id === existing.id ? saved : ticket)))
      return HttpResponse.json<Ticket>(saved)
    },
  ),

  // --- Signing in (API_CONTRACT.md, "Auth") ---------------------------------
  //
  // Enough for the app's sign-in flow to work against the mock: the six
  // sample users sign in with the backend's development password, and
  // /auth/me answers for the mock's own tokens. The mock still doesn't CHECK
  // a token anywhere else: every other endpoint answers whoever asks, with
  // no 401 and no 403 (see API_CONTRACT.md's note on the mock).

  // POST /api/v1/auth/login
  http.post<PathParams, DefaultBodyType, { token: string; user: User } | ErrorBody>(
    '/api/v1/auth/login',
    async ({ request }) => {
      await delay()
      const body = await readJsonBody(request)
      if (!isRecord(body)) {
        return errorResponse(400, 'BAD_REQUEST', 'The request body must be a JSON object.')
      }
      const problems: Record<string, string> = {}
      if (typeof body.email !== 'string' || body.email === '') problems.email = 'Email is required.'
      if (typeof body.password !== 'string' || body.password === '') {
        problems.password = 'Password is required.'
      }
      if (Object.keys(problems).length > 0) {
        return validationErrorResponse(problems)
      }
      // Compared without regard to case, as the server does. A wrong password
      // and an unknown email get exactly the same answer.
      const email = String(body.email).toLowerCase()
      const user = getAllUsers().find((candidate) => candidate.email === email)
      if (!user || body.password !== MOCK_PASSWORD) {
        return errorResponse(401, 'UNAUTHORIZED', 'The email or password is incorrect.')
      }
      return HttpResponse.json({ token: `${MOCK_TOKEN_PREFIX}${user.id}`, user })
    },
  ),

  // GET /api/v1/auth/me: the user a mock token belongs to, or the contract's 401.
  http.get<PathParams, DefaultBodyType, User | ErrorBody>('/api/v1/auth/me', async ({ request }) => {
    await delay()
    const user = userForToken(request.headers.get('Authorization'))
    if (!user) {
      return errorResponse(401, 'UNAUTHORIZED', NO_VALID_TOKEN_MESSAGE)
    }
    return HttpResponse.json<User>(user)
  }),

  // POST /api/v1/auth/register: a new USER, with the contract's rules and
  // messages. The email is checked first for a 409, then the username.
  http.post<PathParams, DefaultBodyType, User | ErrorBody>(
    '/api/v1/auth/register',
    async ({ request }) => {
      await delay()
      const body = await readJsonBody(request)
      if (!isRecord(body)) {
        return errorResponse(400, 'BAD_REQUEST', 'The request body must be a JSON object.')
      }
      const problems = findRegisterProblems(body)
      if (Object.keys(problems).length > 0) {
        return validationErrorResponse(problems)
      }
      const email = String(body.email).toLowerCase()
      const username = String(body.username).toLowerCase()
      const existing = getAllUsers()
      if (existing.some((user) => user.email === email)) {
        return errorResponse(409, 'CONFLICT', 'An account with this email already exists.')
      }
      if (existing.some((user) => user.username === username)) {
        return errorResponse(409, 'CONFLICT', 'An account with this username already exists.')
      }
      const user: User = {
        id: Math.max(0, ...existing.map((candidate) => candidate.id)) + 1,
        name: String(body.name).trim(),
        username,
        email,
        role: 'USER',
        phone: '',
        address: { street: '', suite: '', city: '', zipcode: '' },
        company: { name: '' },
      }
      addUser(user)
      return HttpResponse.json<User>(user, { status: 201 })
    },
  ),

  // GET /api/v1/projects: every project. Read-only for now: there are no
  // endpoints to create, change or delete projects.
  http.get('/api/v1/projects', async () => {
    await delay()
    return HttpResponse.json<Project[]>(getAllProjects())
  }),

  // GET /api/v1/projects/:id: one project, or 404.
  http.get<PathParams<'id'>, DefaultBodyType, Project | ErrorBody>(
    '/api/v1/projects/:id',
    async ({ params }) => {
      await delay()
      const id = readId(params.id)
      const project = getAllProjects().find((item) => item.id === id)
      if (!project) {
        // Covers both "abc" (not a number) and 999 (no such project).
        return errorResponse(404, 'NOT_FOUND', `No project with id "${String(params.id)}".`)
      }
      return HttpResponse.json<Project>(project)
    },
  ),

  // GET /api/v1/users: every user, sorted by id. Read-only for now: registering
  // (POST /users) arrives in Week 8. The real backend serves the same six users.
  http.get('/api/v1/users', async () => {
    await delay()
    return HttpResponse.json<User[]>(getAllUsers())
  }),
]
