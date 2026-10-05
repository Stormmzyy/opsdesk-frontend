import { Navigate, Route, Routes } from 'react-router-dom'
import type { UseTicketsResult } from '../features/tickets/hooks/useTickets.ts'
import Layout from '../layouts/Layout.tsx'
import DashboardPage from '../pages/DashboardPage.tsx'
import EditTicketPage from '../pages/EditTicketPage.tsx'
import NewTicketPage from '../pages/NewTicketPage.tsx'
import NotFoundPage from '../pages/NotFoundPage.tsx'
import ProjectsPage from '../pages/ProjectsPage.tsx'
import TeamsPage from '../pages/TeamsPage.tsx'
import TicketDetailPage from '../pages/TicketDetailPage.tsx'
import TicketsPage from '../pages/TicketsPage.tsx'
import UsersPage from '../pages/UsersPage.tsx'
import { NAV_PAGES } from './navPages.ts'

interface AppRoutesProps {
  // The tickets and the functions that change them, from useTickets().
  ticketStore: UseTicketsResult
}

// Every route in the app, in one place.
// The Layout route has no path of its own: it wraps all the pages inside it
// and shows the matching one through its <Outlet />.
function AppRoutes({ ticketStore }: AppRoutesProps) {
  const { tickets, createTicket } = ticketStore

  return (
    <Routes>
      <Route element={<Layout pages={NAV_PAGES} />}>
        {/* "replace" swaps / for /dashboard in the history, so Back still works. */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage tickets={tickets} />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route
          path="/tickets/new"
          element={<NewTicketPage onCreateTicket={createTicket} />}
        />
        {/* ":id" is a URL parameter: /tickets/3 gives the page an id of "3". */}
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/tickets/:id/edit" element={<EditTicketPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/teams" element={<TeamsPage tickets={tickets} />} />
        <Route path="/users" element={<UsersPage />} />
        {/* "*" matches any URL that no route above matched. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
