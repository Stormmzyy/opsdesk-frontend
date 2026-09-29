import type {
  Priority,
  StatusFilter,
  Ticket,
  TicketStatus,
  TicketStatusOption,
} from '../types.ts'

// The single source of truth for ticket statuses.
// The array order is the order of the columns on the board,
// and the order a ticket moves through when you press "Move to ...".
export const TICKET_STATUSES: TicketStatusOption[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
]

// Every priority, from least to most important. Used for dropdown options.
export const TICKET_PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

// Display labels for each priority.
// Record<Priority, string> means: one string for EVERY priority, so
// TypeScript complains if we ever add a priority and forget its label.
export const TICKET_PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

// Returns the status after the given one, or null if it's the last (CLOSED).
export function getNextStatus(currentStatus: TicketStatus): TicketStatusOption | null {
  const currentIndex = TICKET_STATUSES.findIndex(
    (status) => status.value === currentStatus,
  )
  if (currentIndex === -1) {
    return null
  }
  return TICKET_STATUSES[currentIndex + 1] ?? null
}

// Statuses that mean the work is finished.
const DONE_STATUSES: TicketStatus[] = ['RESOLVED', 'CLOSED']

// "Open" means the ticket still needs work: it's Open or In progress.
export function isOpenTicket(ticket: Ticket): boolean {
  return !DONE_STATUSES.includes(ticket.status)
}

// Turns a status value like 'IN_PROGRESS' into its label, 'In progress'.
export function getStatusLabel(statusValue: TicketStatus): string {
  const status = TICKET_STATUSES.find((item) => item.value === statusValue)
  return status ? status.label : statusValue
}

// A <select> always gives us a plain string. These turn that string back into
// a Priority or TicketStatus by finding the matching known value, and return
// undefined if it isn't one. This way we never have to tell TypeScript
// "trust me" with a type cast.
export function parsePriority(value: string): Priority | undefined {
  return TICKET_PRIORITIES.find((priority) => priority === value)
}

export function parseStatus(value: string): TicketStatus | undefined {
  return TICKET_STATUSES.find((status) => status.value === value)?.value
}

// Same idea for the status filter dropdown, which also has 'ALL'.
export function parseStatusFilter(value: string): StatusFilter | undefined {
  return value === 'ALL' ? 'ALL' : parseStatus(value)
}
