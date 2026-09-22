import './PageHeader.css'

// The title at the top of every page. Each page has exactly one <h1>.
function PageHeader({ title, description }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  )
}

export default PageHeader
