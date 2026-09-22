import { useState } from 'react'
import { tickets as initialTickets } from '../../data/tickets.js'
import { TICKET_STATUSES } from '../../data/ticketStatuses.js'
import TicketColumn from './TicketColumn.jsx'
import './TicketBoard.css'

function TicketBoard() {
  const [tickets, setTickets] = useState(initialTickets)

  // Builds a NEW array where only the matching ticket is replaced by a copy
  // with the new status. We never change the old ticket object directly.
  function moveTicket(ticketId, newStatus) {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket,
      ),
    )
  }

  return (
    <section className="ticket-board">
      <h2>Ticket Board</h2>

      <div className="ticket-board__columns">
        {TICKET_STATUSES.map((status) => (
          <TicketColumn
            key={status.value}
            status={status}
            tickets={tickets.filter((ticket) => ticket.status === status.value)}
            onMoveTicket={moveTicket}
          />
        ))}
      </div>
    </section>
  )
}

export default TicketBoard
