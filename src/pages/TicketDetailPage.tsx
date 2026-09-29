import { Link, useParams } from 'react-router-dom'
import type { Ticket } from '../features/tickets/types.ts'
import { findTicketByParam } from '../features/tickets/utils/ticketHelpers.ts'
import BackLink from '../components/BackLink.tsx'
import PageHeader from '../components/PageHeader.tsx'
import TicketDetails from '../features/tickets/components/TicketDetails.tsx'
import TicketNotFound from '../features/tickets/components/TicketNotFound.tsx'

interface TicketDetailPageProps {
  tickets: Ticket[]
}

// Shows one ticket, chosen by the :id part of the URL, e.g. /tickets/3.
function TicketDetailPage({ tickets }: TicketDetailPageProps) {
  // useParams reads the named parts of the URL. For /tickets/3, id is "3".
  const { id } = useParams()

  // undefined when no ticket matches, e.g. /tickets/999.
  const ticket = findTicketByParam(tickets, id)

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
      <TicketDetails ticket={ticket} />
    </>
  )
}

export default TicketDetailPage
