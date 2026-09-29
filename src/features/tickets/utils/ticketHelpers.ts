import type { Ticket } from '../types.ts'

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
