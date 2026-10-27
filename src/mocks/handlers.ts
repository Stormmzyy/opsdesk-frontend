import { delay, http, HttpResponse } from 'msw'
import type { DefaultBodyType, PathParams } from 'msw'
import type { Project } from '../features/projects/types.ts'
import { employees } from '../data/employees.ts'
import { getDepartments } from '../features/employees/utils/employeeHelpers.ts'
import type { Ticket } from '../features/tickets/types.ts'
import { isRecord, isTicket } from '../features/tickets/utils/ticketHelpers.ts'
import { parsePriority, parseStatus } from '../features/tickets/utils/ticketStatus.ts'
import {
  validateDescription,
  validateTitle,
} from '../features/tickets/utils/ticketValidation.ts'
import { parseId } from '../utils/parseId.ts'
import type { User } from '../features/users/types.ts'
import { getAllProjects } from './projectDb.ts'
import { getAllTickets, resetToSampleTickets, saveAllTickets } from './ticketDb.ts'
import { getAllUsers } from './userDb.ts'

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
type ErrorCode = 'BAD_REQUEST' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR'

// The ticket fields a client can send. (Never id: the server owns that.)
type TicketField = 'title' | 'description' | 'priority' | 'status' | 'team'

// One message per invalid field, e.g. { title: 'Title is required.' }.
// Partial: only the fields with a problem are in it.
type FieldProblems = Partial<Record<TicketField, string>>

interface ErrorBody {
  error: ErrorCode
  message: string
  fields?: FieldProblems
}

function errorResponse(status: number, error: ErrorCode, message: string) {
  return HttpResponse.json<ErrorBody>({ error, message }, { status })
}

// 400 VALIDATION_ERROR, listing every invalid field. The message joins the
// field messages into one sentence, for clients that don't read `fields`.
function validationErrorResponse(fields: FieldProblems) {
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

// Handlers that can answer with a ticket OR an error say so up front, in the
// third type parameter of http.get / http.post / http.patch. Otherwise MSW
// guesses the response type from the first `return` and rejects the other.
// The first two type parameters are the URL params and the request body.
type TicketOrError = Ticket | ErrorBody

export const handlers = [
  // GET /api/v1/tickets: every ticket.
  http.get('/api/v1/tickets', async () => {
    // delay() waits a realistic, random time (like a real network), so the
    // loading states actually show up. In tests (Node) it only waits 5ms.
    await delay()
    return HttpResponse.json<Ticket[]>(getAllTickets())
  }),

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
