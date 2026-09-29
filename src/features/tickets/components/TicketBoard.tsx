import { TICKET_STATUSES } from '../utils/ticketStatus.ts'
import TicketColumn from './TicketColumn.tsx'
import type { MoveTicketHandler, Ticket } from '../../../types.ts'
import './TicketBoard.css'

interface TicketBoardProps {
  tickets: Ticket[]
  onMoveTicket: MoveTicketHandler
}

// The tickets state lives in App.jsx. The board just displays it and passes
// onMoveTicket down to each card.
function TicketBoard({ tickets, onMoveTicket }: TicketBoardProps) {
  return (
    <section aria-label="Ticket board">
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
