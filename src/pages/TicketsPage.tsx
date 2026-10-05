import { Link } from 'react-router-dom'
import type { MoveTicketHandler, Ticket } from '../features/tickets/types.ts'
import PageHeader from '../components/PageHeader.tsx'
import TicketBrowser from '../features/tickets/components/TicketBrowser.tsx'
import { useAppDispatch } from '../store/hooks.ts'
import { addNotification } from '../store/uiSlice.ts'

interface TicketsPageProps {
  tickets: Ticket[]
  onMoveTicket: MoveTicketHandler
  onResetTickets: () => void
}

function TicketsPage({ tickets, onMoveTicket, onResetTickets }: TicketsPageProps) {
  const dispatch = useAppDispatch()

  // Ask first, because this throws away every change.
  function handleReset() {
    if (window.confirm('Replace all tickets with the sample data? Your changes will be lost.')) {
      onResetTickets()
      dispatch(
        addNotification({ message: 'Tickets were reset to the sample data.', type: 'success' }),
      )
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
