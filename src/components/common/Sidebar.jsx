import './Sidebar.css'

// The app title and the main navigation.
// A sidebar on wide screens, a bar across the top on narrow screens.
function Sidebar({ pages, currentPage, onNavigate }) {
  return (
    <header className="sidebar">
      <p className="sidebar__title">OpsDesk</p>

      <nav aria-label="Main">
        <ul className="sidebar__list">
          {pages.map((page) => {
            const isActive = page.id === currentPage

            return (
              <li key={page.id}>
                <button
                  type="button"
                  className={isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'}
                  // Tells screen readers which page is showing right now.
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onNavigate(page.id)}
                >
                  {page.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}

export default Sidebar
