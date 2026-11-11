import { NavLink } from 'react-router-dom'
import type { Role } from '../features/users/types.ts'
import type { NavPage } from '../routes/navPages.ts'
import { selectCurrentUser, signedOut } from '../store/authSlice.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import { selectSidebarCollapsed, toggleSidebar } from '../store/uiSlice.ts'
import './Sidebar.css'

interface SidebarProps {
  pages: NavPage[]
}

// The server's role names, as people read them.
const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  AGENT: 'Agent',
  USER: 'User',
}

// The id that links the toggle button to the navigation it shows and hides.
const NAV_ID = 'main-navigation'

// NavLink passes { isActive } to this function. isActive is true when the
// current URL matches the link, including nested URLs like /tickets/3.
function getLinkClassName({ isActive }: { isActive: boolean }): string {
  return isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
}

// The app title and the main navigation.
// A sidebar on wide screens, a bar across the top on narrow screens.
// The "Main menu" button collapses it: a thin strip on wide screens, and just the
// top bar (without the links) on narrow screens.
function Sidebar({ pages }: SidebarProps) {
  // Read from Redux, because Layout needs the same value to resize its grid.
  const collapsed = useAppSelector(selectSidebarCollapsed)
  const user = useAppSelector(selectCurrentUser)
  const dispatch = useAppDispatch()

  return (
    <header className={collapsed ? 'sidebar sidebar--collapsed' : 'sidebar'}>
      <div className="sidebar__top">
        <p className="sidebar__title">OpsDesk</p>

        {/* A "disclosure" button: aria-expanded tells screen readers whether
            the navigation is showing, and aria-controls says which element it
            shows and hides. The name stays "Main menu" either way, because
            aria-expanded already announces the open or closed state. The
            visible text IS the accessible name, so what you see matches
            what a screen reader (or voice control) calls it. */}
        <button
          type="button"
          className="sidebar__toggle"
          aria-expanded={!collapsed}
          aria-controls={NAV_ID}
          onClick={() => dispatch(toggleSidebar())}
        >
          {/* The arrow points the way the sidebar will move. It's decoration,
              so screen readers skip it. */}
          <span aria-hidden="true">{collapsed ? '»' : '«'}</span> Main menu
        </button>
      </div>

      {/* "hidden" removes the links from the page completely while collapsed,
          so keyboard users can't tab into links they can't see. */}
      <nav id={NAV_ID} aria-label="Main" hidden={collapsed}>
        <ul className="sidebar__list">
          {pages.map((page) => (
            <li key={page.path}>
              {/* NavLink also adds aria-current="page" to the active link,
                  which tells screen readers which page is showing. */}
              <NavLink to={page.path} className={getLinkClassName}>
                {page.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Who is signed in, and the way out. Outside the collapsible <nav>,
          so Log out is always reachable, even with the menu collapsed. */}
      {user && (
        <div className="sidebar__account">
          <p className="sidebar__user">
            {user.name}
            {/* The role as the server sees it (from /auth/me): the same
                one that decides what each request is allowed to do. */}
            <span className="sidebar__role">{ROLE_LABELS[user.role]}</span>
          </p>
          {/* Clears the session (the slice, localStorage and RTK Query's
              cache: see store.ts). ProtectedRoute then sees no token and
              moves to /login. There's no logout endpoint to call: the token
              simply stops being sent (API_CONTRACT.md). */}
          <button type="button" className="button" onClick={() => dispatch(signedOut())}>
            Log out
          </button>
        </div>
      )}
    </header>
  )
}

export default Sidebar
