import { Fragment } from 'react'
import Skeleton from '../../../components/Skeleton.tsx'
import './ProjectList.css'

// The sample data has six projects, so six placeholder cards.
const CARD_COUNT = 6

// One bar per "word" of a typical project description (about 11 words).
// The spaces between them let the bars wrap onto new lines like real text.
const WORD_WIDTHS = [
  '1.25rem', '3rem', '4.5rem', '2.5rem', '1.5rem', '3.5rem', '2rem', '3rem', '1.5rem', '2.5rem',
  '3.5rem',
]

// The loading placeholder for ProjectList: cards with the same elements and
// CSS classes as the real ones (name, description, then status, team and
// lead), with skeletons in place of the text. Wrap it in a SkeletonGroup,
// whose aria-hidden keeps these placeholder headings away from screen readers.
function ProjectListSkeleton() {
  return (
    <ul className="project-list">
      {Array.from({ length: CARD_COUNT }, (_, index) => (
        <li key={index} className="project-card">
          <h2>
            <Skeleton width="11rem" />
          </h2>
          <p className="project-card__description">
            {WORD_WIDTHS.map((width, wordIndex) => (
              <Fragment key={wordIndex}>
                <Skeleton width={width} />{' '}
              </Fragment>
            ))}
          </p>
          <dl className="project-card__facts">
            {[0, 1, 2].map((fact) => (
              <div key={fact}>
                <dt>
                  <Skeleton width="2.5rem" />
                </dt>
                <dd>
                  <Skeleton width="5.5rem" />
                </dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  )
}

export default ProjectListSkeleton
