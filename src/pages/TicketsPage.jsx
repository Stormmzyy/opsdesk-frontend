import TicketBoard from '../components/tickets/TicketBoard.jsx'

// A page is a full screen. For now it just shows the Ticket Board.
function TicketsPage({ tickets, onMoveTicket }) {
  return <TicketBoard tickets={tickets} onMoveTicket={onMoveTicket} />
}

export default TicketsPage
