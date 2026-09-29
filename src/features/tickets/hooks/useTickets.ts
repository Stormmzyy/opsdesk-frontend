import { tickets as sampleTickets } from '../../../data/tickets.ts'
import { useLocalStorage } from '../../../hooks/useLocalStorage.ts'
import type { Ticket, TicketFormValues, TicketStatus } from '../types.ts'
import { isTicketList } from '../utils/ticketHelpers.ts'

// The name the tickets are saved under in the browser's localStorage.
const TICKETS_STORAGE_KEY = 'opsdesk.tickets'

export interface UseTicketsResult {
  tickets: Ticket[]
  moveTicket: (ticketId: number, newStatus: TicketStatus) => void
  // Returns the new ticket's id, so the page can go to it next.
  createTicket: (values: TicketFormValues) => number
  updateTicket: (ticketId: number, values: TicketFormValues) => void
  // Throws away every change and goes back to the sample tickets.
  resetTickets: () => void
}

// The list of tickets and every way to change it, kept together.
// App calls this once, so every page sees the same up-to-date list.
// The tickets are saved in localStorage, so they survive a page refresh.
export function useTickets(): UseTicketsResult {
  // Starts from the saved tickets, or the sample tickets if nothing valid is
  // saved. After that, every change is saved automatically.
  const [tickets, setTickets] = useLocalStorage<Ticket[]>(
    TICKETS_STORAGE_KEY,
    sampleTickets,
    isTicketList,
  )

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

  // Replacing the state also saves it, so the sample tickets are stored too.
  function resetTickets() {
    setTickets(sampleTickets)
  }

  return { tickets, moveTicket, createTicket, updateTicket, resetTickets }
}
