import { NavLink } from 'react-router-dom'
import type { NavPage } from '../routes/navPages.ts'
import './Sidebar.css'

interface SidebarProps {
  pages: NavPage[]
}

// NavLink passes { isActive } to this function. isActive is true when the
// current URL matches the link, including nested URLs like /tickets/3.
function getLinkClassName({ isActive }: { isActive: boolean }): string {
  return isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
}

// The app title and the main navigation.
// A sidebar on wide screens, a bar across the top on narrow screens.
function Sidebar({ pages }: SidebarProps) {
  return (
    <header className="sidebar">
      <p className="sidebar__title">OpsDesk</p>

      <nav aria-label="Main">
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
