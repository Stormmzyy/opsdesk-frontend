import { useNavigate, useParams } from 'react-router-dom'
import BackLink from '../components/common/BackLink.jsx'
import PageHeader from '../components/common/PageHeader.jsx'
import TicketForm from '../components/tickets/TicketForm.jsx'
import TicketNotFound from '../components/tickets/TicketNotFound.jsx'

// Edits the ticket chosen by the :id part of the URL, e.g. /tickets/3/edit.
function EditTicketPage({ tickets, onUpdateTicket }) {
  const { id } = useParams()
  const navigate = useNavigate()

  // URL params are strings and ticket ids are numbers, so convert first.
  const ticket = tickets.find((item) => item.id === Number(id))

  if (!ticket) {
    return <TicketNotFound id={id} />
  }

  const detailPath = `/tickets/${ticket.id}`

  function handleSave(values) {
    onUpdateTicket(ticket.id, values)
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
