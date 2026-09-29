import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { NavPage } from './routes/navPages.ts'
import type { Ticket, TicketFormValues, TicketStatus } from './features/tickets/types.ts'
import { tickets as initialTickets } from './data/tickets.ts'
import Layout from './layouts/Layout.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import EditTicketPage from './pages/EditTicketPage.tsx'
import NewTicketPage from './pages/NewTicketPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import ProjectsPage from './pages/ProjectsPage.tsx'
import TeamsPage from './pages/TeamsPage.tsx'
import TicketDetailPage from './pages/TicketDetailPage.tsx'
import TicketsPage from './pages/TicketsPage.tsx'
import UsersPage from './pages/UsersPage.tsx'

// The pages in the navigation, in order. The sidebar maps over this list.
const NAV_PAGES: NavPage[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/tickets', label: 'Tickets' },
  { path: '/projects', label: 'Projects' },
  { path: '/teams', label: 'Teams' },
  { path: '/users', label: 'Users' },
]

function App() {
  // Tickets live here, at the top, so every page sees the same up-to-date list
  // and moves aren't lost when you switch pages.
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)

  // Builds a NEW array where only the matching ticket is replaced by a copy
  // with the new status. We never change the old ticket object directly.
  function moveTicket(ticketId: number, newStatus: TicketStatus) {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket,
      ),
    )
  }

  // Adds a new ticket and returns its id, so the page can go to it next.
  // Every new ticket starts as OPEN.
  function createTicket(values: TicketFormValues): number {
    // One more than the biggest id so far, so the new id is always unique.
    const newId = Math.max(0, ...tickets.map((ticket) => ticket.id)) + 1
    setTickets((currentTickets) => [
      ...currentTickets,
      { ...values, id: newId, status: 'OPEN' },
    ])
    return newId
  }

  // Replaces a ticket's fields with the edited values. Like moveTicket,
  // it builds a new array instead of changing the old ticket.
  function updateTicket(ticketId: number, values: TicketFormValues) {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, ...values } : ticket,
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
        <Route
          path="/tickets/new"
          element={<NewTicketPage onCreateTicket={createTicket} />}
        />
        {/* ":id" is a URL parameter: /tickets/3 gives the page an id of "3". */}
        <Route path="/tickets/:id" element={<TicketDetailPage tickets={tickets} />} />
        <Route
          path="/tickets/:id/edit"
          element={<EditTicketPage tickets={tickets} onUpdateTicket={updateTicket} />}
        />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/teams" element={<TeamsPage tickets={tickets} />} />
        <Route path="/users" element={<UsersPage />} />
        {/* "*" matches any URL that no route above matched. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
