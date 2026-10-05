import type { ReactNode } from 'react'
import './PageHeader.css'

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

// The title at the top of every page. Each page has exactly one <h1>.
// children (optional): action buttons or links shown beside the title.
function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        {/* tabIndex={-1}: code can move focus here after a page change (see
            utils/focus.ts), but it isn't added to the normal Tab order. */}
        <h1 tabIndex={-1}>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="page-header__actions">{children}</div>}
    </header>
  )
}

export default PageHeader
