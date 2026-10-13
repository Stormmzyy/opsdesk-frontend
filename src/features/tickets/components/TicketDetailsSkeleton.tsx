import Skeleton from '../../../components/Skeleton.tsx'
import './TicketDetails.css'

// The loading placeholder for TicketDetails. It uses the same elements and
// CSS classes (h2, p, dl), with skeletons inside instead of text, so every
// part is exactly the size of the real thing. Wrap it in a SkeletonGroup:
// its aria-hidden removes all of this, headings included, from what screen
// readers see, so these placeholder <h2>s don't appear in the page outline.
function TicketDetailsSkeleton() {
  return (
    <div className="ticket-detail">
      <h2>
        <Skeleton width="7rem" />
      </h2>
      {/* Three lines of description, the last one shorter. */}
      <p className="ticket-detail__description">
        <Skeleton width="100%" />
        <Skeleton width="100%" />
        <Skeleton width="60%" />
      </p>

      <h2>
        <Skeleton width="5rem" />
      </h2>
      <dl className="ticket-detail__facts">
        {[0, 1, 2].map((fact) => (
          <div key={fact}>
            <dt>
              <Skeleton width="3.5rem" />
            </dt>
            <dd>
              <Skeleton width="5rem" />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default TicketDetailsSkeleton
