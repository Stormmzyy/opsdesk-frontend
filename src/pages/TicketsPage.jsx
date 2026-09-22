import PageHeader from '../components/common/PageHeader.jsx'
import TicketBoard from '../components/tickets/TicketBoard.jsx'

function TicketsPage({ tickets, onMoveTicket }) {
  return (
    <>
      <PageHeader
        title="Tickets"
        description="Move tickets through their statuses as work progresses."
      />
      <TicketBoard tickets={tickets} onMoveTicket={onMoveTicket} />
    </>
  )
}

export default TicketsPage
