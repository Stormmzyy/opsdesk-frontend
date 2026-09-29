import { Link } from 'react-router-dom'
import './BackLink.css'

// A small "← Back to ..." link shown above a page title.
function BackLink({ to, children }) {
  return (
    <p className="back-link">
      <Link to={to}>
        {/* The arrow is decoration, so screen readers skip it. */}
        <span aria-hidden="true">←</span> {children}
      </Link>
    </p>
  )
}

export default BackLink
