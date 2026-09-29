import type { Priority, Ticket } from '../types.ts'
import { isOpenTicket } from './ticketStatus.ts'

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
