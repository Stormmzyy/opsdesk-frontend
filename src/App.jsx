import { useState } from 'react'
import { tickets as initialTickets } from './data/tickets.js'
import DashboardPage from './pages/DashboardPage.jsx'
import EmployeesPage from './pages/EmployeesPage.jsx'
import TicketsPage from './pages/TicketsPage.jsx'
import UsersPage from './pages/UsersPage.jsx'

function App() {
  // Tickets live here, at the top, so every page sees the same up-to-date list.
  const [tickets, setTickets] = useState(initialTickets)

  // Builds a NEW array where only the matching ticket is replaced by a copy
  // with the new status. We never change the old ticket object directly.
  function moveTicket(ticketId, newStatus) {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket,
      ),
    )
  }

  // Temporary stacked layout; a proper page layout comes later.
  return (
    <>
      <DashboardPage tickets={tickets} />
      <EmployeesPage />
      <TicketsPage tickets={tickets} onMoveTicket={moveTicket} />
      <UsersPage />
    </>
  )
}

export default App
