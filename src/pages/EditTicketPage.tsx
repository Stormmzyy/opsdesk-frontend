import { useNavigate, useParams } from 'react-router-dom'
import type { Ticket, TicketFormValues } from '../types.ts'
import { findTicketByParam } from '../utils/ticketHelpers.ts'
import BackLink from '../components/common/BackLink.tsx'
import PageHeader from '../components/common/PageHeader.tsx'
import TicketForm from '../components/tickets/TicketForm.tsx'
import TicketNotFound from '../components/tickets/TicketNotFound.tsx'

// Edits the ticket chosen by the :id part of the URL, e.g. /tickets/3/edit.
interface EditTicketPageProps {
  tickets: Ticket[]
  onUpdateTicket: (ticketId: number, values: TicketFormValues) => void
}

function EditTicketPage({ tickets, onUpdateTicket }: EditTicketPageProps) {
  const { id } = useParams()
  const navigate = useNavigate()

  // undefined when no ticket matches, e.g. /tickets/999/edit.
  const ticket = findTicketByParam(tickets, id)

  if (!ticket) {
    return <TicketNotFound id={id} />
  }

  // Past the check above, TypeScript knows ticket is defined here, but not
  // inside functions declared below (they could in theory run later).
  // Copying the id into a constant keeps it simple and safe.
  const ticketId = ticket.id
  const detailPath = `/tickets/${ticketId}`

  function handleSave(values: TicketFormValues) {
    onUpdateTicket(ticketId, values)
    navigate(detailPath)
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
      />
    </>
  )
}

export default EditTicketPage
