import { Link } from 'react-router-dom'
import type { TicketStatus } from '../features/tickets/types.ts'
import PageHeader from '../components/PageHeader.tsx'
import StatusMessage from '../components/StatusMessage.tsx'
import TicketBrowser from '../features/tickets/components/TicketBrowser.tsx'
import { useAppDispatch } from '../store/hooks.ts'
import {
  useGetTicketsQuery,
  useResetTicketsMutation,
  useUpdateTicketMutation,
} from '../store/ticketsApi.ts'
import { addNotification } from '../store/uiSlice.ts'

function TicketsPage() {
  // Loads the tickets (or reuses the cached copy). isLoading is only true
  // for the very first load; isError is true if the request failed.
  const { data: tickets, isLoading, isError, refetch } = useGetTicketsQuery()
  // A mutation hook returns [the function that sends it, its status].
  // We only need the function here.
  const [updateTicket] = useUpdateTicketMutation()
  const [resetTickets, { isLoading: isResetting }] = useResetTicketsMutation()
  const dispatch = useAppDispatch()

  // Called by the cards on the board. Sends only the new status (PATCH).
  // When it succeeds, invalidatesTags makes the list refetch by itself.
  // unwrap() turns a failed request into a thrown error we can catch.
  async function handleMoveTicket(ticketId: number, newStatus: TicketStatus) {
    try {
      await updateTicket({ id: ticketId, status: newStatus }).unwrap()
    } catch {
      dispatch(
        addNotification({ message: `Ticket #${ticketId} couldn't be moved.`, type: 'error' }),
      )
    }
  }

  // Ask first, because this throws away every change.
  async function handleReset() {
    if (!window.confirm('Replace all tickets with the sample data? Your changes will be lost.')) {
      return
    }
    try {
      await resetTickets().unwrap()
      dispatch(
        addNotification({ message: 'Tickets were reset to the sample data.', type: 'success' }),
      )
    } catch {
      dispatch(addNotification({ message: "The tickets couldn't be reset.", type: 'error' }))
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
        {/* Disabled while a reset is on its way, so it can't be sent twice. */}
        <button type="button" className="button" onClick={handleReset} disabled={isResetting}>
          Reset to sample data
        </button>
      </PageHeader>

      {isLoading && <StatusMessage type="loading">Loading tickets…</StatusMessage>}

      {isError && (
        <StatusMessage type="error" onRetry={refetch}>
          Sorry, we couldn't load the tickets.
        </StatusMessage>
      )}

      {tickets && !isError && tickets.length === 0 && (
        <StatusMessage type="empty">
          There are no tickets yet. Create one, or reset to the sample data.
        </StatusMessage>
      )}

      {tickets && !isError && tickets.length > 0 && (
        <TicketBrowser tickets={tickets} onMoveTicket={handleMoveTicket} />
      )}
    </>
  )
}

export default TicketsPage
