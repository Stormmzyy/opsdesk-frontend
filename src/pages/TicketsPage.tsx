import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { TicketStatus } from '../features/tickets/types.ts'
import ConfirmDialog from '../components/ConfirmDialog.tsx'
import PageHeader from '../components/PageHeader.tsx'
import TicketBrowser from '../features/tickets/components/TicketBrowser.tsx'
import { describeTicketChangeFailure } from '../store/apiError.ts'
import { useAppDispatch } from '../store/hooks.ts'
import {
  useResetTicketsMutation,
  useUpdateTicketMutation,
} from '../store/ticketsApi.ts'
import { addNotification } from '../store/uiSlice.ts'
import { isMockApiEnabled } from '../utils/mockApi.ts'

// "Reset to sample data" calls POST /tickets/reset, which only the mock API
// has. API_CONTRACT.md lists it as mock-only and says the backend must not
// build it (it would let anyone wipe every ticket), so against the real
// backend it can only ever answer 404. The control is hidden there instead of
// deleted, because it's still useful with the mock (VITE_USE_MOCK_API=true).
// Worked out once, when the module loads: the setting can't change while the
// app is running, because Vite reads .env only when it starts.
const CAN_RESET_SAMPLE_DATA = isMockApiEnabled()

function TicketsPage() {
  // The tickets themselves are fetched by TicketBrowser, a page at a time,
  // filtered and sorted by the server (GET /tickets with query parameters).
  // This page keeps what's around the list: the header, moving a ticket
  // on the board, and the mock's reset.
  //
  // A mutation hook returns [the function that sends it, its status].
  // We only need the function here.
  const [updateTicket] = useUpdateTicketMutation()
  const [resetTickets, { isLoading: isResetting }] = useResetTicketsMutation()
  const dispatch = useAppDispatch()
  // Whether the "Reset to sample data?" dialog is showing.
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

  // Called by the cards on the board. Sends only the new status (PATCH).
  // When it succeeds, invalidatesTags makes the list refetch by itself.
  // unwrap() turns a failed request into a thrown error we can catch.
  async function handleMoveTicket(ticketId: number, newStatus: TicketStatus) {
    try {
      await updateTicket({ id: ticketId, status: newStatus }).unwrap()
    } catch (error) {
      dispatch(
        addNotification({
          message: describeTicketChangeFailure(error, `Ticket #${ticketId} wasn't moved`),
          type: 'error',
        }),
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
            dialog can return focus to it when it closes. Only shown with the
            mock API: see CAN_RESET_SAMPLE_DATA above. */}
        {CAN_RESET_SAMPLE_DATA && (
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
        )}
      </PageHeader>

      {CAN_RESET_SAMPLE_DATA && (
        <ConfirmDialog
          open={isResetConfirmOpen}
          title="Reset to sample data?"
          description="Every ticket will be replaced with the original sample tickets. Any tickets you created, edited or deleted will be lost."
          confirmLabel="Reset tickets"
          onConfirm={handleConfirmReset}
          onClose={() => setIsResetConfirmOpen(false)}
        />
      )}

      <TicketBrowser onMoveTicket={handleMoveTicket} canResetSampleData={CAN_RESET_SAMPLE_DATA} />
    </>
  )
}

export default TicketsPage
