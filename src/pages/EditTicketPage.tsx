import { skipToken } from '@reduxjs/toolkit/query/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Ticket, TicketFormValues } from '../features/tickets/types.ts'
import { changedTicketFields, parseTicketId } from '../features/tickets/utils/ticketHelpers.ts'
import BackLink from '../components/BackLink.tsx'
import PageHeader from '../components/PageHeader.tsx'
import SkeletonGroup from '../components/SkeletonGroup.tsx'
import StatusMessage from '../components/StatusMessage.tsx'
import TicketForm from '../features/tickets/components/TicketForm.tsx'
import TicketFormSkeleton from '../features/tickets/components/TicketFormSkeleton.tsx'
import TicketNotFound from '../features/tickets/components/TicketNotFound.tsx'
import { describeTicketChangeFailure, readApiError } from '../store/apiError.ts'
import { useAppDispatch } from '../store/hooks.ts'
import { isNotFoundError } from '../store/api.ts'
import { useGetTicketQuery, useUpdateTicketMutation } from '../store/ticketsApi.ts'
import { addNotification } from '../store/uiSlice.ts'

// Edits the ticket chosen by the :id part of the URL, e.g. /tickets/3/edit.
// This part fetches the ticket and covers loading and errors; the form and
// its snapshot are in EditTicketForm below.
function EditTicketPage() {
  const { id } = useParams()
  // A number, or undefined if the URL holds something like "abc".
  const ticketId = parseTicketId(id)
  // skipToken: don't ask the server about an id that isn't a number.
  const {
    data: ticket,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetTicketQuery(ticketId ?? skipToken)

  if (ticketId === undefined || isNotFoundError(error)) {
    return <TicketNotFound id={id} />
  }

  const detailPath = `/tickets/${ticketId}`

  if (isLoading) {
    return (
      <>
        <BackLink to={detailPath}>Back to ticket</BackLink>
        <PageHeader title="Edit ticket" description={`Ticket #${ticketId}`} />
        <SkeletonGroup label="Loading the ticket">
          <TicketFormSkeleton />
        </SkeletonGroup>
      </>
    )
  }

  if (isError || !ticket) {
    return (
      <>
        <BackLink to={detailPath}>Back to ticket</BackLink>
        <PageHeader title="Edit ticket" description={`Ticket #${ticketId}`} />
        <StatusMessage type="error" onRetry={refetch}>
          Sorry, we couldn&apos;t load this ticket.
        </StatusMessage>
      </>
    )
  }

  // key: a different ticket is a different form, with its own snapshot.
  return <EditTicketForm key={ticket.id} ticket={ticket} />
}

// The five editable fields, as the form shows them.
function toFormValues(ticket: Ticket): TicketFormValues {
  return {
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    team: ticket.team,
    status: ticket.status,
  }
}

// The form, mounted once the ticket has loaded.
//
// SEND ONLY WHAT CHANGED (backend decision 71). When the form loads, it
// takes a SNAPSHOT of the ticket's five editable fields. On save, it sends
// only the fields whose value differs from that snapshot, so a field the
// person never touched is never in the request and can't overwrite anyone.
//
// The snapshot, not the ticket in RTK Query's cache. The cache can refetch
// while the form is open (after a failed save, after another tab's change,
// after any mutation that invalidates this ticket), and then "the ticket
// now" is no longer "the ticket this person started from". Compare a form
// that still shows status OPEN with a refetched ticket that someone else
// moved to IN_PROGRESS, and status looks changed: the save would send
// "status": "OPEN" and silently put the other person's change back. That's
// exactly decision 40's stale-form revert, which this exists to prevent.
// useState(() => ...) runs once, when the form mounts, so later refetches
// can't move the snapshot.
//
// The payoff people can see: decision 34 refuses a USER whose request
// carries a status, priority or team that differs from the stored one.
// With the whole form sent, Fatima fixing only her ticket's title, after
// someone else had moved it on, still sent the old status, and was refused
// with a 403 telling her she lacked permission for something she never
// touched. Sending only the title removes that case from the real UI.
//
// What it does NOT fix: decision 40 stays open. The hole was never in the
// server, which can't tell "I want this value" from "this was the value
// when my page loaded". Any client that sends the whole form reopens it,
// and Swagger's "Try it out" (Thursday) is one. This mitigates the hole
// for the OpsDesk frontend; it doesn't close it.
function EditTicketForm({ ticket }: { ticket: Ticket }) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [updateTicket, { isLoading: isSaving }] = useUpdateTicketMutation()
  // The server's per-field messages from a refused submit (a 400
  // VALIDATION_ERROR), shown by the form under the right fields.
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  // Taken once, when the form mounts. See above.
  const [snapshot] = useState(() => toFormValues(ticket))

  const detailPath = `/tickets/${ticket.id}`

  // Sends the changed fields (PATCH), or nothing at all. unwrap() throws if
  // the request fails, so the success message and the navigation only
  // happen when it worked.
  async function handleSave(values: TicketFormValues) {
    const changes = changedTicketFields(snapshot, values)

    // Nothing changed: no request. There's nothing to save, and a PATCH
    // with an empty body would only ask the server to write nothing.
    if (Object.keys(changes).length === 0) {
      dispatch(
        addNotification({ message: `Ticket #${ticket.id} had no changes to save.`, type: 'info' }),
      )
      navigate(detailPath)
      return
    }

    setServerErrors({})
    try {
      await updateTicket({ id: ticket.id, ...changes }).unwrap()
      dispatch(
        addNotification({ message: `Changes to ticket #${ticket.id} were saved.`, type: 'success' }),
      )
      navigate(detailPath)
    } catch (error) {
      // Stay on the form, so nothing the user typed is lost. Field problems
      // go under their fields (no toast: the form shows them). Anything else
      // is a toast that says what the server decided: a 403 here can be
      // nobody's fault, since the ticket may have been reassigned since
      // this form was opened.
      const apiError = readApiError(error)
      if (apiError?.error === 'VALIDATION_ERROR') {
        setServerErrors(apiError.fields)
        return
      }
      dispatch(
        addNotification({
          message: describeTicketChangeFailure(error, `Ticket #${ticket.id} wasn't saved`),
          type: 'error',
        }),
      )
    }
  }

  return (
    <>
      <BackLink to={detailPath}>Back to ticket</BackLink>
      <PageHeader title="Edit ticket" description={`Ticket #${ticket.id}`} />
      <TicketForm
        // Pre-filled from the snapshot, the same values the save compares
        // against.
        initialValues={snapshot}
        onSubmit={handleSave}
        submitLabel="Save changes"
        onCancel={() => navigate(detailPath)}
        showStatus
        isSubmitting={isSaving}
        serverErrors={serverErrors}
      />
    </>
  )
}

export default EditTicketPage
