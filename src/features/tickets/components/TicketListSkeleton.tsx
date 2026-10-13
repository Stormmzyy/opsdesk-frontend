import Skeleton from '../../../components/Skeleton.tsx'
import './TicketList.css'

// Different title lengths, so the placeholder rows look like real tickets
// rather than a stack of identical bars. Fixed lengths (not random ones),
// so every render looks the same.
const TITLE_WIDTHS = ['18rem', '13rem', '21rem', '15rem', '19rem']

interface TicketListSkeletonProps {
  // How many placeholder rows to draw. Defaults to 10, one full page.
  rows?: number
}

// The loading placeholder for TicketList. It uses TicketList's own CSS
// classes, so each row is exactly as tall and as wide as a real one.
// Wrap it in a SkeletonGroup, which hides it from screen readers and
// announces "Loading" instead.
function TicketListSkeleton({ rows = 10 }: TicketListSkeletonProps) {
  // Array.from({ length: rows }) makes a list of `rows` empty slots, so we can
  // map over it. Only the index is needed, hence the _ for the unused value.
  return (
    <ul className="ticket-list">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="ticket-list__item">
          <span className="ticket-list__title">
            <Skeleton width={TITLE_WIDTHS[index % TITLE_WIDTHS.length]} />
          </span>
          {/* Placeholders for the id, priority badge, status and team. */}
          <span className="ticket-list__meta">
            <Skeleton width="1.5rem" />
            <Skeleton width="3.75rem" height="1.25rem" shape="pill" />
            <Skeleton width="3.5rem" />
            <Skeleton width="5.5rem" />
          </span>
        </li>
      ))}
    </ul>
  )
}

export default TicketListSkeleton
