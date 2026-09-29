import './PageHeader.css'

// The title at the top of every page. Each page has exactly one <h1>.
// children (optional): action buttons or links shown beside the title.
function PageHeader({ title, description, children }) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="page-header__actions">{children}</div>}
    </header>
  )
}

export default PageHeader
