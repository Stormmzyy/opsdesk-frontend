import { skipToken } from '@reduxjs/toolkit/query/react'
import { Link, useParams } from 'react-router-dom'
import { parseTicketId } from '../features/tickets/utils/ticketHelpers.ts'
import BackLink from '../components/BackLink.tsx'
import PageHeader from '../components/PageHeader.tsx'
import StatusMessage from '../components/StatusMessage.tsx'
import TicketDetails from '../features/tickets/components/TicketDetails.tsx'
import TicketNotFound from '../features/tickets/components/TicketNotFound.tsx'
import { isNotFoundError, useGetTicketQuery } from '../store/ticketsApi.ts'

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
        <PageHeader title={`Ticket #${ticketId}`} />
        <StatusMessage type="loading">Loading the ticket…</StatusMessage>
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
