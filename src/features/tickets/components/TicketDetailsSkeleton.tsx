import { Fragment } from 'react'
import Skeleton from '../../../components/Skeleton.tsx'
import './TicketDetails.css'

// One bar per "word" of a typical description (the sample tickets average
// about 22 words). Spaces between them let the bars wrap onto new lines like
// real text, so the placeholder is about as many lines tall as the real
// description at ANY screen width, instead of a fixed number of lines.
const WORD_WIDTHS = [
  '2.5rem', '1.75rem', '3.5rem', '2rem', '1.25rem', '3rem', '1.75rem', '2.5rem', '2rem', '4rem',
  '1.25rem', '2.75rem', '1.5rem', '3rem', '2rem', '1.25rem', '3.5rem', '2.25rem', '1.5rem',
  '2.75rem', '2rem', '3rem',
]

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
      <p className="ticket-detail__description">
        {WORD_WIDTHS.map((width, index) => (
          // The index is a fine key: this list never changes order.
          <Fragment key={index}>
            <Skeleton width={width} />{' '}
          </Fragment>
        ))}
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
