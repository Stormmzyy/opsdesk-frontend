import {
  TICKET_STATUSES,
  TICKET_PRIORITY_LABELS,
  getNextStatus,
} from '../data/ticketStatuses.js'
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
            onChange={(event) => onMoveTicket(ticket.id, event.target.value)}
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
