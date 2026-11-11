import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../features/auth/ProtectedRoute.tsx'
import Layout from '../layouts/Layout.tsx'
import LoginPage from '../pages/LoginPage.tsx'
import RegisterPage from '../pages/RegisterPage.tsx'
import DashboardPage from '../pages/DashboardPage.tsx'
import EditTicketPage from '../pages/EditTicketPage.tsx'
import NewTicketPage from '../pages/NewTicketPage.tsx'
import NotFoundPage from '../pages/NotFoundPage.tsx'
import TeamsPage from '../pages/TeamsPage.tsx'
import TicketDetailPage from '../pages/TicketDetailPage.tsx'
import TicketsPage from '../pages/TicketsPage.tsx'
import { NAV_PAGES } from './navPages.ts'

// These pages are "lazy": their code is split into separate files that
// the browser only downloads the first time someone opens the page. Most
// visits start on the dashboard or tickets, so this keeps the first download
// smaller. The project pages and Users were picked because nothing else imports them
// (Users also brings its own hook and components), and they're visited less.
// While a lazy page downloads, the <Suspense> in Layout shows a fallback.
const ProjectsPage = lazy(() => import('../pages/ProjectsPage.tsx'))
const ProjectDetailPage = lazy(() => import('../pages/ProjectDetailPage.tsx'))
const UsersPage = lazy(() => import('../pages/UsersPage.tsx'))

// Every route in the app, in one place.
// The Layout route has no path of its own: it wraps all the pages inside it
// and shows the matching one through its <Outlet />.
// No props: each page gets its tickets from RTK Query by itself.
function AppRoutes() {
  return (
    <Routes>
      {/* Outside the Layout (no sidebar before signing in) and outside
          ProtectedRoute, which sends anyone without a token to /login:
          inside it, /login would redirect to itself, forever. */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Every other page sits behind ProtectedRoute: with no token it sends
          the person to /login, and with a stored token it asks /auth/me
          first, so the pages never render for an account the server no
          longer accepts. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout pages={NAV_PAGES} />}>
          {/* "replace" swaps / for /dashboard in the history, so Back still works. */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/new" element={<NewTicketPage />} />
          {/* ":id" is a URL parameter: /tickets/3 gives the page an id of "3". */}
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/tickets/:id/edit" element={<EditTicketPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/users" element={<UsersPage />} />
          {/* "*" matches any URL that no route above matched. */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
