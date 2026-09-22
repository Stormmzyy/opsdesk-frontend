import Sidebar from './Sidebar.jsx'
import './Layout.css'

// The frame around every page: navigation on one side, the page in <main>.
function Layout({ pages, currentPage, onNavigate, children }) {
  return (
    <div className="layout">
      <Sidebar pages={pages} currentPage={currentPage} onNavigate={onNavigate} />
      <main className="layout__main">{children}</main>
    </div>
  )
}

export default Layout
