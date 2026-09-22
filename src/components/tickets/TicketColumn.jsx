import StatusMessage from '../common/StatusMessage.jsx'
import TicketCard from './TicketCard.jsx'
import './TicketColumn.css'

function TicketColumn({ status, tickets, onMoveTicket }) {
  const headingId = `ticket-column-${status.value}`

  return (
    <section className="ticket-column" aria-labelledby={headingId}>
      <header className="ticket-column__header">
        <h3 id={headingId}>{status.label}</h3>
        <span className="ticket-column__count">{tickets.length}</span>
      </header>

      {tickets.length === 0 ? (
        <StatusMessage type="empty" compact>
          No tickets here right now.
        </StatusMessage>
      ) : (
        <ul className="ticket-column__list">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <TicketCard ticket={ticket} onMoveTicket={onMoveTicket} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default TicketColumn
