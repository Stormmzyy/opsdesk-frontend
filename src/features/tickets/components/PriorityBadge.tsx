import { TICKET_PRIORITY_LABELS } from '../utils/ticketStatus.ts'
import type { Priority } from '../../../types.ts'
import './PriorityBadge.css'

interface PriorityBadgeProps {
  priority: Priority
}

// A coloured pill showing a ticket's priority, e.g. "Urgent" in red.
function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`priority-badge priority-badge--${priority.toLowerCase()}`}>
      {TICKET_PRIORITY_LABELS[priority]}
    </span>
  )
}

export default PriorityBadge
