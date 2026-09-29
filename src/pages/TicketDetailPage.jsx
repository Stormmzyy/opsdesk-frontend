import { Link, useParams } from 'react-router-dom'
import { getStatusLabel } from '../utils/ticketStatus.js'
import PageHeader from '../components/common/PageHeader.jsx'
import PriorityBadge from '../components/tickets/PriorityBadge.jsx'
import './TicketDetailPage.css'

function BackToTicketsLink() {
  return (
    <p className="ticket-detail__back">
      <Link to="/tickets">
        <span aria-hidden="true">←</span> Back to tickets
      </Link>
    </p>
  )
}

// Shows one ticket, chosen by the :id part of the URL, e.g. /tickets/3.
function TicketDetailPage({ tickets }) {
  // useParams reads the named parts of the URL. For /tickets/3, id is "3".
  const { id } = useParams()

  // URL params are always strings, but ticket ids are numbers, so convert first.
  // find() returns undefined when nothing matches, e.g. /tickets/999.
  const ticket = tickets.find((item) => item.id === Number(id))

  if (!ticket) {
    return (
      <>
        <BackToTicketsLink />
        <PageHeader
          title="Ticket not found"
          description={`There is no ticket with the id "${id}". It may have been removed, or the link may be wrong.`}
        />
      </>
    )
  }

  return (
    <>
      <BackToTicketsLink />
      <PageHeader title={ticket.title} description={`Ticket #${ticket.id}`} />

      <section className="ticket-detail" aria-labelledby="ticket-description-heading">
        <h2 id="ticket-description-heading">Description</h2>
        <p className="ticket-detail__description">{ticket.description}</p>

        <h2>Details</h2>
        <dl className="ticket-detail__facts">
          <div>
            <dt>Priority</dt>
            <dd>
              <PriorityBadge priority={ticket.priority} />
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{getStatusLabel(ticket.status)}</dd>
          </div>
          <div>
            <dt>Team</dt>
            <dd>{ticket.team}</dd>
          </div>
        </dl>
      </section>
    </>
  )
}

export default TicketDetailPage
