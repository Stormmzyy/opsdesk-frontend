import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import StatusMessage from '../components/StatusMessage.tsx'
import Notifications from './Notifications.tsx'
import Sidebar from './Sidebar.tsx'
import type { NavPage } from '../routes/navPages.ts'
import { useAppSelector } from '../store/hooks.ts'
import { selectSidebarCollapsed } from '../store/uiSlice.ts'
import './Layout.css'

interface LayoutProps {
  pages: NavPage[]
}

// The frame around every page: navigation on one side, the page in <main>.
// <Outlet /> is where React Router draws the page that matches the URL.
function Layout({ pages }: LayoutProps) {
  const { pathname } = useLocation()
  // The same value the Sidebar reads. Layout needs it too, to make the
  // sidebar's grid column narrower, which is why it lives in Redux.
  const sidebarCollapsed = useAppSelector(selectSidebarCollapsed)

  // Start each new page at the top, like a normal website would.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className={sidebarCollapsed ? 'layout layout--sidebar-collapsed' : 'layout'}>
      {/* The first thing a keyboard user reaches. Without it, they would
          have to Tab past the Main menu button and every navigation link on
          every page before reaching the content. It's hidden until focused
          (see Layout.css). A plain <a>, not a router <Link>, because it jumps
          within the page rather than going to another URL. */}
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Sidebar pages={pages} />
      {/* tabIndex={-1} lets the skip link (and our code) move focus here,
          without adding <main> to the normal Tab order. */}
      <main id="main-content" className="layout__main" tabIndex={-1}>
        {/* Inside Layout, so notifications show on every page and stay put
            when you move between pages (e.g. after creating a ticket). */}
        <Notifications />
        {/* Suspense catches a lazy page that is still downloading and shows
            the fallback in its place. It sits INSIDE <main>, so the sidebar
            and notifications stay on screen; only the page area waits. */}
        <Suspense fallback={<StatusMessage type="loading">Loading page…</StatusMessage>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

export default Layout
