import type { ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import type { MoveTicketHandler, Ticket } from '../../types.ts'
import { TICKET_STATUSES, getNextStatus, parseStatus } from '../../utils/ticketStatus.ts'
import PriorityBadge from './PriorityBadge.tsx'
import './TicketCard.css'

interface TicketCardProps {
  ticket: Ticket
  onMoveTicket: MoveTicketHandler
}

function TicketCard({ ticket, onMoveTicket }: TicketCardProps) {
  // null when the ticket is CLOSED, which hides the move button below.
  const nextStatus = getNextStatus(ticket.status)

  // The dropdown gives us a plain string, so turn it back into a TicketStatus
  // first. It is always one of our options, but TypeScript can't know that.
  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const newStatus = parseStatus(event.target.value)
    if (newStatus) {
      onMoveTicket(ticket.id, newStatus)
    }
  }

  return (
    <article className="ticket-card">
      {/* Only the title is a link. The move button and status dropdown sit
          outside it, so using them changes the status without navigating. */}
      <p className="ticket-card__title">
        <Link to={`/tickets/${ticket.id}`}>{ticket.title}</Link>
      </p>

      <div className="ticket-card__meta">
        <PriorityBadge priority={ticket.priority} />
        <span className="ticket-card__team">{ticket.team}</span>
      </div>

      <div className="ticket-card__actions">
        {nextStatus && (
          <button
            type="button"
            className="ticket-card__move"
            onClick={() => onMoveTicket(ticket.id, nextStatus.value)}
          >
            Move to {nextStatus.label}
          </button>
        )}

        {/* Wrapping the select in its label links them without needing an id. */}
        <label className="ticket-card__status">
          Status
          <select
            value={ticket.status}
            onChange={handleStatusChange}
          >
            {TICKET_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </article>
  )
}

export default TicketCard
