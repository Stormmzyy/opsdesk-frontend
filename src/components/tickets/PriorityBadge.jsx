import { TICKET_PRIORITY_LABELS } from '../../utils/ticketStatus.js'
import './PriorityBadge.css'

// A coloured pill showing a ticket's priority, e.g. "Urgent" in red.
function PriorityBadge({ priority }) {
  return (
    <span className={`priority-badge priority-badge--${priority.toLowerCase()}`}>
      {TICKET_PRIORITY_LABELS[priority]}
    </span>
  )
}

export default PriorityBadge
