import Skeleton from './Skeleton.tsx'
import './StatCard.css'

interface StatGridSkeletonProps {
  // How many stat cards to draw.
  count: number
}

// The loading placeholder for a grid of StatCards (the number and label
// boxes on the Dashboard). Same elements and CSS classes as the real cards,
// with skeletons in place of the text. Wrap it in a SkeletonGroup.
function StatGridSkeleton({ count }: StatGridSkeletonProps) {
  return (
    <div className="stat-grid">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="stat-card">
          <p className="stat-card__value">
            <Skeleton width="2.5rem" />
          </p>
          <p className="stat-card__label">
            <Skeleton width="5rem" />
          </p>
        </div>
      ))}
    </div>
  )
}

export default StatGridSkeleton
