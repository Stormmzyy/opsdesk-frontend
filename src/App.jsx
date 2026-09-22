import { useState } from 'react'
import { tickets as initialTickets } from './data/tickets.js'
import Layout from './components/common/Layout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import TeamsPage from './pages/TeamsPage.jsx'
import TicketsPage from './pages/TicketsPage.jsx'
import UsersPage from './pages/UsersPage.jsx'

// The pages in the navigation, in order.
// Next week each id can become a route path, e.g. 'tickets' -> '/tickets'.
const PAGES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'teams', label: 'Teams' },
  { id: 'users', label: 'Users' },
]

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  // Tickets live here, at the top, so every page sees the same up-to-date list
  // and moves aren't lost when you switch pages.
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

  function navigate(pageId) {
    setCurrentPage(pageId)
    // Start each new page at the top, like a normal website would.
    window.scrollTo(0, 0)
  }

  // The one place that decides which page to show.
  // React Router will replace this function next week.
  function renderCurrentPage() {
    switch (currentPage) {
      case 'tickets':
        return <TicketsPage tickets={tickets} onMoveTicket={moveTicket} />
      case 'teams':
        return <TeamsPage tickets={tickets} />
      case 'users':
        return <UsersPage />
      default:
        return <DashboardPage tickets={tickets} />
    }
  }

  return (
    <Layout pages={PAGES} currentPage={currentPage} onNavigate={navigate}>
      {renderCurrentPage()}
    </Layout>
  )
}

export default App
