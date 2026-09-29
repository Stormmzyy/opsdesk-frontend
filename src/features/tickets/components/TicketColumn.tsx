import StatusMessage from '../../../components/StatusMessage.tsx'
import TicketCard from './TicketCard.tsx'
import type { MoveTicketHandler, Ticket, TicketStatusOption } from '../types.ts'
import './TicketColumn.css'

interface TicketColumnProps {
  status: TicketStatusOption
  tickets: Ticket[]
  onMoveTicket: MoveTicketHandler
}

function TicketColumn({ status, tickets, onMoveTicket }: TicketColumnProps) {
  const headingId = `ticket-column-${status.value}`

  return (
    <section className="ticket-column" aria-labelledby={headingId}>
      <header className="ticket-column__header">
        <h2 id={headingId}>{status.label}</h2>
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
