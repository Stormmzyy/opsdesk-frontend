import { Link } from 'react-router-dom'
import type { MoveTicketHandler, Ticket } from '../features/tickets/types.ts'
import PageHeader from '../components/PageHeader.tsx'
import TicketBrowser from '../features/tickets/components/TicketBrowser.tsx'

interface TicketsPageProps {
  tickets: Ticket[]
  onMoveTicket: MoveTicketHandler
  onResetTickets: () => void
}

function TicketsPage({ tickets, onMoveTicket, onResetTickets }: TicketsPageProps) {
  // Ask first, because this throws away every change.
  function handleReset() {
    if (window.confirm('Replace all tickets with the sample data? Your changes will be lost.')) {
      onResetTickets()
    }
  }

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
        <button type="button" className="button" onClick={handleReset}>
          Reset to sample data
        </button>
      </PageHeader>
      <TicketBrowser tickets={tickets} onMoveTicket={onMoveTicket} />
    </>
  )
}

export default TicketsPage
