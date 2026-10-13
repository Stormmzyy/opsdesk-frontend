import { skipToken } from '@reduxjs/toolkit/query/react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { parseTicketId } from '../features/tickets/utils/ticketHelpers.ts'
import BackLink from '../components/BackLink.tsx'
import ConfirmDialog from '../components/ConfirmDialog.tsx'
import PageHeader from '../components/PageHeader.tsx'
import SkeletonGroup from '../components/SkeletonGroup.tsx'
import StatusMessage from '../components/StatusMessage.tsx'
import TicketDetails from '../features/tickets/components/TicketDetails.tsx'
import TicketDetailsSkeleton from '../features/tickets/components/TicketDetailsSkeleton.tsx'
import TicketNotFound from '../features/tickets/components/TicketNotFound.tsx'
import { useAppDispatch } from '../store/hooks.ts'
import {
  isNotFoundError,
  useDeleteTicketMutation,
  useGetTicketQuery,
} from '../store/ticketsApi.ts'
import { addNotification } from '../store/uiSlice.ts'
import './TicketDetailPage.css'

// Shows one ticket, chosen by the :id part of the URL, e.g. /tickets/3.
function TicketDetailPage() {
  // useParams reads the named parts of the URL. For /tickets/3, id is "3".
  const { id } = useParams()
  // A number, or undefined if the URL holds something like "abc".
  const ticketId = parseTicketId(id)

  // skipToken tells RTK Query not to send a request at all. There's no point
  // asking the server for ticket "abc", so we only fetch when the id is valid.
  const {
    data: ticket,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetTicketQuery(ticketId ?? skipToken)
  // Hooks must run on every render, so they all go above the early returns.
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [deleteTicket, { isLoading: isDeleting }] = useDeleteTicketMutation()
  // Whether the "Delete this ticket?" dialog is showing.
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // Not a number, or the server said 404: there's no such ticket.
  if (ticketId === undefined || isNotFoundError(error)) {
    return <TicketNotFound id={id} />
  }

  // While loading or after an error there's no title yet, so the heading
  // shows the ticket number instead. Every state has exactly one <h1>.
  if (isLoading) {
    return (
      <>
        <BackLink to="/tickets">Back to tickets</BackLink>
        {/* The real header has a description line under the title, so this
            one has one too, to keep the content below from jumping down. */}
        <PageHeader title={`Ticket #${ticketId}`} description="Loading the ticket…" />
        <SkeletonGroup label="Loading the ticket">
          <TicketDetailsSkeleton />
        </SkeletonGroup>
      </>
    )
  }

  if (isError || !ticket) {
    return (
      <>
        <BackLink to="/tickets">Back to tickets</BackLink>
        <PageHeader title={`Ticket #${ticketId}`} />
        <StatusMessage type="error" onRetry={refetch}>
          Sorry, we couldn't load this ticket.
        </StatusMessage>
      </>
    )
  }

  // Past the checks above, TypeScript knows ticket is defined, but not inside
  // the function declaration below (it's "hoisted", so in theory it could
  // run before the checks). Copying it into a constant keeps it simple.
  const shownTicket = ticket

  // Runs only when the user presses "Delete ticket" in the dialog.
  async function handleConfirmDelete() {
    // Close the dialog first. Focus goes back to the Delete button, which
    // is where it should be if the delete fails and we stay on this page.
    setIsConfirmOpen(false)
    try {
      await deleteTicket(shownTicket.id).unwrap()
      // Layout shows the notification, so it's still there on the next page.
      dispatch(
        addNotification({ message: `Ticket #${shownTicket.id} was deleted.`, type: 'success' }),
      )
      // There's nothing left to show here, so go back to the list.
      navigate('/tickets')
    } catch {
      dispatch(
        addNotification({
          message: `Ticket #${shownTicket.id} couldn't be deleted.`,
          type: 'error',
        }),
      )
    }
  }

  return (
    <>
      <BackLink to="/tickets">Back to tickets</BackLink>
      <PageHeader title={ticket.title} description={`Ticket #${ticket.id}`}>
        <Link to={`/tickets/${ticket.id}/edit`} className="button">
          Edit
        </Link>
      </PageHeader>
      <TicketDetails ticket={ticket} />

      {/* Deleting lives in its own section at the bottom of the page, far
          from the Edit link at the top, with a red border and its own
          heading, so it's hard to press by accident. And even then, it only
          opens the confirmation dialog. */}
      <section className="ticket-danger-zone" aria-labelledby="delete-ticket-heading">
        <h2 id="delete-ticket-heading">Delete this ticket</h2>
        <p>Deleting removes the ticket for everyone. This can't be undone.</p>
        <button
          type="button"
          className="button button--danger-outline"
          // While a delete is on its way, the button ignores presses so it
          // can't be sent twice. aria-disabled (rather than disabled) keeps
          // the button focusable, so the dialog can still return focus to it
          // when it closes. Screen readers still announce it as unavailable.
          aria-disabled={isDeleting}
          onClick={() => {
            if (!isDeleting) {
              setIsConfirmOpen(true)
            }
          }}
        >
          Delete ticket
        </button>
      </section>

      <ConfirmDialog
        open={isConfirmOpen}
        title={`Delete ticket #${ticket.id}?`}
        description={`"${ticket.title}" will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete ticket"
        onConfirm={handleConfirmDelete}
        onClose={() => setIsConfirmOpen(false)}
      />
    </>
  )
}

export default TicketDetailPage
