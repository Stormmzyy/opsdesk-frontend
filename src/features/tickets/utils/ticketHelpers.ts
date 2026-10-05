import type { Priority, StatusFilter, Ticket } from '../types.ts'
import { isOpenTicket, parsePriority, parseStatus } from './ticketStatus.ts'

// Turns the :id part of a URL (e.g. "3" in /tickets/3) into a ticket id.
// URL params are always strings, but our ticket ids are numbers.
// Returns undefined for anything that isn't a whole number made only of
// digits, e.g. "abc", "3.5", "-1", "" or a missing param, because
// Number() alone would happily turn "" into 0 and " 3 " into 3.
// Used by the pages (to read the URL) and by the mock API (to read the
// request URL), so both agree on what a valid id looks like.
export function parseTicketId(idParam: string | undefined): number | undefined {
  if (idParam === undefined || !/^\d+$/.test(idParam)) {
    return undefined
  }
  return Number(idParam)
}

// Finds the ticket for the :id part of the URL, e.g. "3" in /tickets/3.
// - useParams types the id as string | undefined, so we handle undefined.
// - URL params are strings, but ticket ids are numbers, so we convert.
// - The URL could hold anything (e.g. /tickets/abc), and find() returns
//   undefined when nothing matches, so the result can be undefined too.
//   The page shows "Ticket not found" in that case.
export function findTicketByParam(
  tickets: Ticket[],
  idParam: string | undefined,
): Ticket | undefined {
  if (idParam === undefined) {
    return undefined
  }
  const id = Number(idParam)
  return tickets.find((ticket) => ticket.id === id)
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

// True when value is an object we can read properties from.
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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
    parseStatus(value.status) !== undefined
  )
}

// Used when loading tickets from localStorage: anything saved there could have
// been changed by hand or by an older version of the app, so we check it
// before trusting it.
export function isTicketList(value: unknown): value is Ticket[] {
  return Array.isArray(value) && value.every(isTicket)
}
