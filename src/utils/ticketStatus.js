// The single source of truth for ticket statuses.
// The array order is the order of the columns on the board,
// and the order a ticket moves through when you press "Move to ...".
export const TICKET_STATUSES = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
]

// Display labels for each priority, from least to most important.
export const TICKET_PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

// Returns the status after the given one, or null if it's the last (CLOSED)
// or not a known status.
export function getNextStatus(currentStatus) {
  const currentIndex = TICKET_STATUSES.findIndex(
    (status) => status.value === currentStatus,
  )
  if (currentIndex === -1) {
    return null
  }
  return TICKET_STATUSES[currentIndex + 1] ?? null
}
