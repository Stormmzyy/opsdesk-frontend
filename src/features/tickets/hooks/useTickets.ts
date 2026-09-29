import { useState } from 'react'
import { tickets as sampleTickets } from '../../../data/tickets.ts'
import type { Ticket, TicketFormValues, TicketStatus } from '../types.ts'

export interface UseTicketsResult {
  tickets: Ticket[]
  moveTicket: (ticketId: number, newStatus: TicketStatus) => void
  // Returns the new ticket's id, so the page can go to it next.
  createTicket: (values: TicketFormValues) => number
  updateTicket: (ticketId: number, values: TicketFormValues) => void
}

// The list of tickets and every way to change it, kept together.
// App calls this once, so every page sees the same up-to-date list.
export function useTickets(): UseTicketsResult {
  const [tickets, setTickets] = useState<Ticket[]>(sampleTickets)

  // Builds a NEW array where only the matching ticket is replaced by a copy
  // with the new status. We never change the old ticket object directly.
  function moveTicket(ticketId: number, newStatus: TicketStatus) {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket,
      ),
    )
  }

  // Adds a new ticket and returns its id. Every new ticket starts as OPEN.
  function createTicket(values: TicketFormValues): number {
    // One more than the biggest id so far, so the new id is always unique.
    const newId = Math.max(0, ...tickets.map((ticket) => ticket.id)) + 1
    setTickets((currentTickets) => [
      ...currentTickets,
      { ...values, id: newId, status: 'OPEN' },
    ])
    return newId
  }

  // Replaces a ticket's fields with the edited values. Like moveTicket,
  // it builds a new array instead of changing the old ticket.
  function updateTicket(ticketId: number, values: TicketFormValues) {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, ...values } : ticket,
      ),
    )
  }

  return { tickets, moveTicket, createTicket, updateTicket }
}
