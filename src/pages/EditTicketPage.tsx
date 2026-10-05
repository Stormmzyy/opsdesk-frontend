import { skipToken } from '@reduxjs/toolkit/query/react'
import { useNavigate, useParams } from 'react-router-dom'
import type { TicketFormValues } from '../features/tickets/types.ts'
import { parseTicketId } from '../features/tickets/utils/ticketHelpers.ts'
import BackLink from '../components/BackLink.tsx'
import PageHeader from '../components/PageHeader.tsx'
import StatusMessage from '../components/StatusMessage.tsx'
import TicketForm from '../features/tickets/components/TicketForm.tsx'
import TicketNotFound from '../features/tickets/components/TicketNotFound.tsx'
import { useAppDispatch } from '../store/hooks.ts'
import {
  isNotFoundError,
  useGetTicketQuery,
  useUpdateTicketMutation,
} from '../store/ticketsApi.ts'
import { addNotification } from '../store/uiSlice.ts'

// Edits the ticket chosen by the :id part of the URL, e.g. /tickets/3/edit.
function EditTicketPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  // Hooks must run on every render, so they all go above the early returns.
  const dispatch = useAppDispatch()
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
  // isLoading here is true while the save request is on its way.
  const [updateTicket, { isLoading: isSaving }] = useUpdateTicketMutation()

  if (ticketId === undefined || isNotFoundError(error)) {
    return <TicketNotFound id={id} />
  }

  const detailPath = `/tickets/${ticketId}`

  if (isLoading) {
    return (
      <>
        <BackLink to={detailPath}>Back to ticket</BackLink>
        <PageHeader title="Edit ticket" description={`Ticket #${ticketId}`} />
        <StatusMessage type="loading">Loading the ticket…</StatusMessage>
      </>
    )
  }

  if (isError || !ticket) {
    return (
      <>
        <BackLink to={detailPath}>Back to ticket</BackLink>
        <PageHeader title="Edit ticket" description={`Ticket #${ticketId}`} />
        <StatusMessage type="error" onRetry={refetch}>
          Sorry, we couldn't load this ticket.
        </StatusMessage>
      </>
    )
  }

  // Past the checks above, TypeScript knows ticketId is a number, but not
  // inside function declarations below: those are "hoisted", so in theory
  // they could run before the checks. Copying it into a constant keeps it
  // simple and safe.
  const savedId = ticketId

  // Sends the edited fields (PATCH). unwrap() throws if the request fails,
  // so the success message and the navigation only happen when it worked.
  async function handleSave(values: TicketFormValues) {
    try {
      await updateTicket({ id: savedId, ...values }).unwrap()
      dispatch(
        addNotification({ message: `Changes to ticket #${savedId} were saved.`, type: 'success' }),
      )
      navigate(detailPath)
    } catch {
      // Stay on the form, so nothing the user typed is lost.
      dispatch(
        addNotification({
          message: `Changes to ticket #${savedId} couldn't be saved.`,
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
        // Pre-fill the form with the ticket's current values.
        initialValues={{
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          team: ticket.team,
          status: ticket.status,
        }}
        onSubmit={handleSave}
        submitLabel="Save changes"
        onCancel={() => navigate(detailPath)}
        showStatus
        isSubmitting={isSaving}
      />
    </>
  )
}

export default EditTicketPage
