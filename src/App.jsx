import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { tickets as initialTickets } from './data/tickets.js'
import Layout from './components/common/Layout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import TeamsPage from './pages/TeamsPage.jsx'
import TicketsPage from './pages/TicketsPage.jsx'
import UsersPage from './pages/UsersPage.jsx'

// The pages in the navigation, in order. The sidebar maps over this list.
const NAV_PAGES = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/tickets', label: 'Tickets' },
  { path: '/teams', label: 'Teams' },
  { path: '/users', label: 'Users' },
]

function App() {
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

  // Every route in the app, in one place.
  // The Layout route has no path of its own: it wraps all the pages inside it
  // and shows the matching one through its <Outlet />.
  return (
    <Routes>
      <Route element={<Layout pages={NAV_PAGES} />}>
        {/* "replace" swaps / for /dashboard in the history, so Back still works. */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage tickets={tickets} />} />
        <Route
          path="/tickets"
          element={<TicketsPage tickets={tickets} onMoveTicket={moveTicket} />}
        />
        <Route path="/teams" element={<TeamsPage tickets={tickets} />} />
        <Route path="/users" element={<UsersPage />} />
        {/* "*" matches any URL that no route above matched. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
