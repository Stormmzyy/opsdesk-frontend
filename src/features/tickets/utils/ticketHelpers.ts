import { parseId } from '../../../utils/parseId.ts'
import type {
  EditableTicketField,
  Priority,
  StatusFilter,
  Ticket,
  TicketFormValues,
} from '../types.ts'
import { isOpenTicket, parsePriority, parseStatus } from './ticketStatus.ts'

// Turns the :id part of a ticket URL (e.g. "3" in /tickets/3) into a ticket
// id, or undefined if it isn't a whole number. Projects use the same rule,
// so the actual check lives in utils/parseId.ts.
export function parseTicketId(idParam: string | undefined): number | undefined {
  return parseId(idParam)
}

// The priorities that need attention first, most important first.
const TOP_PRIORITIES: Priority[] = ['URGENT', 'HIGH']

// Open tickets that are urgent or high, with urgent ones listed first.
// filter() makes a new array, so sorting it doesn't touch the original.
export function getPriorityTickets(tickets: Ticket[]): Ticket[] {
  return tickets
    .filter((ticket) => isOpenTicket(ticket) && TOP_PRIORITIES.includes(ticket.priority))
    .sort(
      (a, b) => TOP_PRIORITIES.indexOf(a.priority) - TOP_PRIORITIES.indexOf(b.priority),
    )
}

// Keeps tickets whose title or description contains searchText (ignoring
// upper and lower case) and whose status matches the filter.
// An empty search matches everything, and 'ALL' matches every status.
//
// Only the MOCK API uses this now, for GET /tickets?search=... (handlers.ts):
// the app itself asks the server to search. It's the contract's search rule
// (contains, ignoring case and surrounding spaces, in title or description),
// so the mock answers as the server does.
export function filterTickets(
  tickets: Ticket[],
  searchText: string,
  statusFilter: StatusFilter,
): Ticket[] {
  const search = searchText.trim().toLowerCase()

  return tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(search) ||
      ticket.description.toLowerCase().includes(search)
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter
    return matchesSearch && matchesStatus
  })
}

// The editable fields that differ between two versions of the form: what
// the Edit page sends in its PATCH (backend decision 71). Values the
// person didn't change are left out, so they can't overwrite anything.
// Empty when nothing changed.
//
// `before` is the snapshot taken when the form loaded, never the ticket as
// it is in the cache now (see EditTicketPage for why).
export function changedTicketFields(
  before: TicketFormValues,
  after: TicketFormValues,
): Partial<Pick<Ticket, EditableTicketField>> {
  const changes: Partial<Pick<Ticket, EditableTicketField>> = {}
  if (after.title !== before.title) changes.title = after.title
  if (after.description !== before.description) changes.description = after.description
  if (after.priority !== before.priority) changes.priority = after.priority
  if (after.team !== before.team) changes.team = after.team
  if (after.status !== undefined && after.status !== before.status) changes.status = after.status
  return changes
}

// True when value is a plain object we can read properties from, like
// { title: 'Hi' }. typeof says "object" for arrays and for null too, so both
// are ruled out: [] or null is never a valid request body or ticket.
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Checks that one saved item has every field a ticket needs, with the right
// type, and a priority and status we actually know about.
export function isTicket(value: unknown): value is Ticket {
  if (!isRecord(value)) {
    return false
  }
  return (
    typeof value.id === 'number' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    typeof value.team === 'string' &&
    typeof value.priority === 'string' &&
    parsePriority(value.priority) !== undefined &&
    typeof value.status === 'string' &&
    parseStatus(value.status) !== undefined &&
    // The output-only fields. Tickets saved by an older version of the app
    // don't have them, so they fail here and the mock starts again from the
    // sample tickets, rather than serving tickets with missing fields.
    (value.assigneeId === null || typeof value.assigneeId === 'number') &&
    (value.assigneeName === null || typeof value.assigneeName === 'string') &&
    typeof value.createdById === 'number' &&
    typeof value.createdByName === 'string' &&
    typeof value.version === 'number'
  )
}

// Used by the mock API (src/mocks/ticketDb.ts) when loading tickets from
// localStorage: anything saved there could have been changed by hand or by an
// older version of the app, so we check it before trusting it.
export function isTicketList(value: unknown): value is Ticket[] {
  return Array.isArray(value) && value.every(isTicket)
}
