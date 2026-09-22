import { TICKET_STATUSES } from '../../utils/ticketStatus.js'
import TicketColumn from './TicketColumn.jsx'
import './TicketBoard.css'

// The tickets state lives in App.jsx. The board just displays it and passes
// onMoveTicket down to each card.
function TicketBoard({ tickets, onMoveTicket }) {
  return (
    <section className="ticket-board" aria-label="Ticket board">
      <div className="ticket-board__columns">
        {TICKET_STATUSES.map((status) => (
          <TicketColumn
            key={status.value}
            status={status}
            tickets={tickets.filter((ticket) => ticket.status === status.value)}
            onMoveTicket={onMoveTicket}
          />
        ))}
      </div>
    </section>
  )
}

export default TicketBoard
