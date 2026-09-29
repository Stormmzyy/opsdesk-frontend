import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.tsx'
import type { NavPage } from '../../types.ts'
import './Layout.css'

interface LayoutProps {
  pages: NavPage[]
}

// The frame around every page: navigation on one side, the page in <main>.
// <Outlet /> is where React Router draws the page that matches the URL.
function Layout({ pages }: LayoutProps) {
  const { pathname } = useLocation()

  // Start each new page at the top, like a normal website would.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="layout">
      <Sidebar pages={pages} />
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
