import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
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
      <Sidebar pages={pages} />
      <main className="layout__main">
        {/* Inside Layout, so notifications show on every page and stay put
            when you move between pages (e.g. after creating a ticket). */}
        <Notifications />
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
