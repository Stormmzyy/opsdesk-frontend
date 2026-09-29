import BackLink from '../../../components/BackLink.tsx'
import PageHeader from '../../../components/PageHeader.tsx'

interface TicketNotFoundProps {
  // The id from the URL. useParams types it as string | undefined.
  id: string | undefined
}

// Shown instead of a ticket page when no ticket matches the id in the URL.
function TicketNotFound({ id }: TicketNotFoundProps) {
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
