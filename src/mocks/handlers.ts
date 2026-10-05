import { delay, http, HttpResponse } from 'msw'
import type { DefaultBodyType, PathParams } from 'msw'
import type { Ticket } from '../features/tickets/types.ts'
import { isRecord, isTicket, parseTicketId } from '../features/tickets/utils/ticketHelpers.ts'
import { hasErrors, validateTicket } from '../features/tickets/utils/ticketValidation.ts'
import { getAllTickets, resetToSampleTickets, saveAllTickets } from './ticketDb.ts'

// Request handlers for the mock ticket API.
//
// MSW (Mock Service Worker) catches the app's fetch requests before they
// leave the browser. When a request matches one of these handlers, MSW calls
// it and sends back its response, as if a real server had answered. The app
// can't tell the difference, so when the real backend arrives, nothing in the
// app has to change: these handlers are simply switched off.

// What every error response looks like, e.g. { message: 'No ticket with id "99".' }.
interface ErrorBody {
  message: string
}

function errorResponse(status: number, message: string) {
  return HttpResponse.json<ErrorBody>({ message }, { status })
}

// URL params can, in theory, be a list (for patterns like /:path*), so only
// accept a single string. Then turn it into a numeric ticket id, which is
// undefined for anything that isn't a whole number, like "abc".
function readTicketId(param: string | readonly string[] | undefined): number | undefined {
  return typeof param === 'string' ? parseTicketId(param) : undefined
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

// The same rules as the form (e.g. "Title is required."), joined into one
// message. A real server never trusts the client to have checked already.
// Returns undefined when the ticket is fine.
function findRuleProblem(ticket: Ticket): string | undefined {
  const errors = validateTicket(ticket)
  return hasErrors(errors) ? Object.values(errors).join(' ') : undefined
}

// Handlers that can answer with a ticket OR an error say so up front, in the
// third type parameter of http.get / http.post / http.patch. Otherwise MSW
// guesses the response type from the first `return` and rejects the other.
// The first two type parameters are the URL params and the request body.
type TicketOrError = Ticket | ErrorBody

const WRONG_SHAPE_MESSAGE =
  'A ticket needs a title, description and team, and a known priority and status.'

export const handlers = [
  // GET /api/tickets: every ticket.
  http.get('/api/tickets', async () => {
    // delay() waits a realistic, random time (like a real network), so the
    // loading states actually show up. In tests (Node) it doesn't wait.
    await delay()
    return HttpResponse.json<Ticket[]>(getAllTickets())
  }),

  // GET /api/tickets/:id: one ticket, or 404.
  http.get<PathParams<'id'>, DefaultBodyType, TicketOrError>(
    '/api/tickets/:id',
    async ({ params }) => {
      await delay()
      const id = readTicketId(params.id)
      const ticket = getAllTickets().find((item) => item.id === id)
      if (!ticket) {
        // Covers both "abc" (not a number) and 999 (no such ticket).
        return errorResponse(404, `No ticket with id "${String(params.id)}".`)
      }
      return HttpResponse.json<Ticket>(ticket)
    },
  ),

  // POST /api/tickets: create a ticket. The server picks the id, and every
  // new ticket starts as OPEN, whatever the request says.
  http.post<PathParams, DefaultBodyType, TicketOrError>('/api/tickets', async ({ request }) => {
    await delay()
    const body = await readJsonBody(request)
    if (!isRecord(body)) {
      return errorResponse(400, 'The request body must be a JSON object.')
    }

    const tickets = getAllTickets()
    // One more than the biggest id so far, so the new id is always unique.
    const newId = Math.max(0, ...tickets.map((ticket) => ticket.id)) + 1
    // Only copy the fields a client may set, so anything extra is ignored.
    const candidate = {
      id: newId,
      status: 'OPEN',
      title: body.title,
      description: body.description,
      priority: body.priority,
      team: body.team,
    }

    // isTicket checks every field's type. Once it passes, TypeScript treats
    // candidate as a Ticket, so it can be validated and saved.
    if (!isTicket(candidate)) {
      return errorResponse(400, WRONG_SHAPE_MESSAGE)
    }
    const problem = findRuleProblem(candidate)
    if (problem) {
      return errorResponse(400, problem)
    }

    saveAllTickets([...tickets, candidate])
    // 201 Created: the standard status for "a new thing was made".
    return HttpResponse.json<Ticket>(candidate, { status: 201 })
  }),

  // POST /api/tickets/reset: throw away every change and restore the sample
  // tickets. Used by the "Reset to sample data" button. A real backend
  // wouldn't have this; it only exists to make the mock easy to reset.
  http.post('/api/tickets/reset', async () => {
    await delay()
    return HttpResponse.json<Ticket[]>(resetToSampleTickets())
  }),

  // PATCH /api/tickets/:id: change some fields of a ticket. PATCH means
  // "update only what I send", e.g. { status: 'RESOLVED' } to move a ticket.
  http.patch<PathParams<'id'>, DefaultBodyType, TicketOrError>(
    '/api/tickets/:id',
    async ({ params, request }) => {
      await delay()
      const id = readTicketId(params.id)
      const tickets = getAllTickets()
      const existing = tickets.find((item) => item.id === id)
      if (!existing) {
        return errorResponse(404, `No ticket with id "${String(params.id)}".`)
      }

      const body = await readJsonBody(request)
      if (!isRecord(body)) {
        return errorResponse(400, 'The request body must be a JSON object.')
      }

      // Start from the existing ticket and replace only the fields that were
      // sent. The id always stays the same.
      const candidate = {
        id: existing.id,
        title: 'title' in body ? body.title : existing.title,
        description: 'description' in body ? body.description : existing.description,
        priority: 'priority' in body ? body.priority : existing.priority,
        status: 'status' in body ? body.status : existing.status,
        team: 'team' in body ? body.team : existing.team,
      }

      if (!isTicket(candidate)) {
        return errorResponse(400, WRONG_SHAPE_MESSAGE)
      }
      const problem = findRuleProblem(candidate)
      if (problem) {
        return errorResponse(400, problem)
      }

      saveAllTickets(tickets.map((ticket) => (ticket.id === existing.id ? candidate : ticket)))
      return HttpResponse.json<Ticket>(candidate)
    },
  ),
]
