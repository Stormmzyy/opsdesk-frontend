import BackLink from '../common/BackLink.jsx'
import PageHeader from '../common/PageHeader.jsx'

// Shown instead of a ticket page when no ticket matches the id in the URL.
function TicketNotFound({ id }) {
  return (
    <>
      <BackLink to="/tickets">Back to tickets</BackLink>
      <PageHeader
        title="Ticket not found"
        description={`There is no ticket with the id "${id}". It may have been removed, or the link may be wrong.`}
      />
    </>
  )
}

export default TicketNotFound
