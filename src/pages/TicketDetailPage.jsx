import { Link, useParams } from 'react-router-dom'
import { getStatusLabel } from '../utils/ticketStatus.ts'
import BackLink from '../components/common/BackLink.tsx'
import PageHeader from '../components/common/PageHeader.tsx'
import PriorityBadge from '../components/tickets/PriorityBadge.jsx'
import TicketNotFound from '../components/tickets/TicketNotFound.jsx'
import './TicketDetailPage.css'

// Shows one ticket, chosen by the :id part of the URL, e.g. /tickets/3.
function TicketDetailPage({ tickets }) {
  // useParams reads the named parts of the URL. For /tickets/3, id is "3".
  const { id } = useParams()

  // URL params are always strings, but ticket ids are numbers, so convert first.
  // find() returns undefined when nothing matches, e.g. /tickets/999.
  const ticket = tickets.find((item) => item.id === Number(id))

  if (!ticket) {
    return <TicketNotFound id={id} />
  }

  return (
    <>
      <BackLink to="/tickets">Back to tickets</BackLink>
      <PageHeader title={ticket.title} description={`Ticket #${ticket.id}`}>
        <Link to={`/tickets/${ticket.id}/edit`} className="button">
          Edit
        </Link>
      </PageHeader>

      <div className="ticket-detail">
        <h2>Description</h2>
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
      </div>
    </>
  )
}

export default TicketDetailPage
