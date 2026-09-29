// Types for the tickets feature.

// A union type: a TicketStatus can only be one of these exact strings,
// so a typo like 'CLOSD' is caught before the app even runs.
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

// URGENT is the highest priority. The Dashboard lists urgent and high tickets.
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Ticket {
  id: number
  title: string
  description: string
  priority: Priority
  status: TicketStatus
  // One of the department names from the employee data, e.g. 'Engineering'.
  team: string
}

// The function a ticket card calls to change a ticket's status.
export type MoveTicketHandler = (ticketId: number, newStatus: TicketStatus) => void

// The fields the ticket form edits. status is optional ("?") because the
// create form doesn't show it: new tickets always start as OPEN.
export interface TicketFormValues {
  title: string
  description: string
  priority: Priority
  team: string
  status?: TicketStatus
}

// A status paired with the text we show for it, e.g. 'IN_PROGRESS' / 'In progress'.
export interface TicketStatusOption {
  value: TicketStatus
  label: string
}
