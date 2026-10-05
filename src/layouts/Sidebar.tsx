import { NavLink } from 'react-router-dom'
import type { NavPage } from '../routes/navPages.ts'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import { selectSidebarCollapsed, toggleSidebar } from '../store/uiSlice.ts'
import './Sidebar.css'

interface SidebarProps {
  pages: NavPage[]
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
    </header>
  )
}

export default Sidebar
