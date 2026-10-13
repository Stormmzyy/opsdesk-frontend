import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { TicketStatus } from '../features/tickets/types.ts'
import ConfirmDialog from '../components/ConfirmDialog.tsx'
import PageHeader from '../components/PageHeader.tsx'
import SkeletonGroup from '../components/SkeletonGroup.tsx'
import StatusMessage from '../components/StatusMessage.tsx'
import TicketBrowser from '../features/tickets/components/TicketBrowser.tsx'
import TicketBrowserSkeleton from '../features/tickets/components/TicketBrowserSkeleton.tsx'
import { useTicketView } from '../features/tickets/hooks/useTicketView.ts'
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
  // Only read here to draw the right skeleton while the tickets load.
  const [view] = useTicketView()
  // Whether the "Reset to sample data?" dialog is showing.
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

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

  // Runs only when the user confirms in the dialog, because a reset throws
  // away every change. Closing the dialog first returns focus to the Reset
  // button.
  async function handleConfirmReset() {
    setIsResetConfirmOpen(false)
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
        {/* Ignores presses while a reset is on its way, so it can't be sent
            twice. aria-disabled (not disabled) keeps it focusable, so the
            dialog can return focus to it when it closes. */}
        <button
          type="button"
          className="button"
          aria-disabled={isResetting}
          onClick={() => {
            if (!isResetting) {
              setIsResetConfirmOpen(true)
            }
          }}
        >
          Reset to sample data
        </button>
      </PageHeader>

      <ConfirmDialog
        open={isResetConfirmOpen}
        title="Reset to sample data?"
        description="Every ticket will be replaced with the original sample tickets. Any tickets you created, edited or deleted will be lost."
        confirmLabel="Reset tickets"
        onConfirm={handleConfirmReset}
        onClose={() => setIsResetConfirmOpen(false)}
      />

      {/* A placeholder shaped like the list or board (whichever is
          selected) instead of plain text, so nothing jumps when the tickets
          arrive. Screen readers hear "Loading tickets" instead. */}
      {isLoading && (
        <SkeletonGroup label="Loading tickets">
          <TicketBrowserSkeleton view={view} />
        </SkeletonGroup>
      )}

      {isError && (
        <StatusMessage type="error" onRetry={refetch}>
          Sorry, we couldn't load the tickets.
        </StatusMessage>
      )}

      {tickets && !isError && tickets.length === 0 && (
        <StatusMessage
          type="empty"
          action={
            <Link to="/tickets/new" className="button button--primary">
              Create a ticket
            </Link>
          }
        >
          There are no tickets yet. Create the first one, or use "Reset to sample data" above to
          bring back the examples.
        </StatusMessage>
      )}

      {tickets && !isError && tickets.length > 0 && (
        <TicketBrowser tickets={tickets} onMoveTicket={handleMoveTicket} />
      )}
    </>
  )
}

export default TicketsPage
