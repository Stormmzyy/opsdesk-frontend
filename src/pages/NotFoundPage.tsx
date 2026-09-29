import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.tsx'

// Shown by the catch-all "*" route when no other route matches the URL.
function NotFoundPage() {
  return (
    <>
      <PageHeader
        title="Page not found"
        description="Sorry, there's no page at this address. It may have moved, or the link may be wrong."
      />
      <p>
        <Link to="/dashboard">Go back to the dashboard</Link>
      </p>
    </>
  )
}

export default NotFoundPage
