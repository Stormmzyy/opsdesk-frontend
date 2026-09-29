import { Link } from 'react-router-dom'
import type { MoveTicketHandler, Ticket } from '../features/tickets/types.ts'
import PageHeader from '../components/PageHeader.tsx'
import TicketBrowser from '../features/tickets/components/TicketBrowser.tsx'

interface TicketsPageProps {
  tickets: Ticket[]
  onMoveTicket: MoveTicketHandler
}

function TicketsPage({ tickets, onMoveTicket }: TicketsPageProps) {
  return (
    <>
      <PageHeader
        title="Tickets"
        description="Search, filter and move tickets through their statuses."
      >
        {/* A link, not a button, because it takes you to another page. */}
        <Link to="/tickets/new" className="button button--primary">
          New ticket
        </Link>
      </PageHeader>
      <TicketBrowser tickets={tickets} onMoveTicket={onMoveTicket} />
    </>
  )
}

export default TicketsPage
