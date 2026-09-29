import { Link } from 'react-router-dom'
import type { Ticket } from '../types.ts'
import { getStatusLabel } from '../utils/ticketStatus.ts'
import PriorityBadge from './PriorityBadge.tsx'
import './TicketList.css'

interface TicketListProps {
  tickets: Ticket[]
}

// Tickets as a simple list, one row each. The title links to the detail page.
function TicketList({ tickets }: TicketListProps) {
  return (
    <ul className="ticket-list">
      {tickets.map((ticket) => (
        <li key={ticket.id} className="ticket-list__item">
          <span className="ticket-list__title">
            <Link to={`/tickets/${ticket.id}`}>{ticket.title}</Link>
          </span>
          <span className="ticket-list__meta">
            <span className="ticket-list__id">#{ticket.id}</span>
            <PriorityBadge priority={ticket.priority} />
            <span>{getStatusLabel(ticket.status)}</span>
            <span>{ticket.team}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export default TicketList
