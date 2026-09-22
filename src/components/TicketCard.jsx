import { TICKET_PRIORITY_LABELS, getNextStatus } from '../data/ticketStatuses.js'
import './TicketCard.css'

function TicketCard({ ticket, onMoveTicket }) {
  // null when the ticket is CLOSED, which hides the move button below.
  const nextStatus = getNextStatus(ticket.status)

  return (
    <article className="ticket-card">
      <p className="ticket-card__title">{ticket.title}</p>

      <div className="ticket-card__meta">
        <span
          className={`priority-badge priority-badge--${ticket.priority.toLowerCase()}`}
        >
          {TICKET_PRIORITY_LABELS[ticket.priority]}
        </span>
        <span className="ticket-card__team">{ticket.team}</span>
      </div>

      {nextStatus && (
        <button
          type="button"
          className="ticket-card__move"
          onClick={() => onMoveTicket(ticket.id, nextStatus.value)}
        >
          Move to {nextStatus.label}
        </button>
      )}
    </article>
  )
}

export default TicketCard
