import { Link } from 'react-router-dom'
import type { MoveTicketHandler, Ticket } from '../types.ts'
import PageHeader from '../components/PageHeader.tsx'
import TicketBoard from '../components/tickets/TicketBoard.tsx'

interface TicketsPageProps {
  tickets: Ticket[]
  onMoveTicket: MoveTicketHandler
}

function TicketsPage({ tickets, onMoveTicket }: TicketsPageProps) {
  return (
    <>
      <PageHeader
        title="Tickets"
        description="Move tickets through their statuses as work progresses."
      >
        {/* A link, not a button, because it takes you to another page. */}
        <Link to="/tickets/new" className="button button--primary">
          New ticket
        </Link>
      </PageHeader>
      <TicketBoard tickets={tickets} onMoveTicket={onMoveTicket} />
    </>
  )
}

export default TicketsPage
