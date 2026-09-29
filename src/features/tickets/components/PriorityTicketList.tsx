import StatusMessage from '../../../components/StatusMessage.tsx'
import type { Ticket } from '../types.ts'
import { getPriorityTickets } from '../utils/ticketHelpers.ts'
import { getStatusLabel } from '../utils/ticketStatus.ts'
import PriorityBadge from './PriorityBadge.tsx'
import './PriorityTicketList.css'

interface PriorityTicketListProps {
  tickets: Ticket[]
}

// The open tickets that need attention first: urgent, then high.
function PriorityTicketList({ tickets }: PriorityTicketListProps) {
  const priorityTickets = getPriorityTickets(tickets)

  if (priorityTickets.length === 0) {
    return (
      <StatusMessage type="empty">
        No urgent or high priority tickets are open. Nice work!
      </StatusMessage>
    )
  }

  return (
    <ul className="priority-list">
      {priorityTickets.map((ticket) => (
        <li key={ticket.id} className="priority-list__item">
          <span className="priority-list__title">{ticket.title}</span>
          <span className="priority-list__meta">
            <PriorityBadge priority={ticket.priority} />
            <span>{ticket.team}</span>
            <span>{getStatusLabel(ticket.status)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export default PriorityTicketList
