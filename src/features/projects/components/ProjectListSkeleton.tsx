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

// Rough widths of the three real values (a status like "Active", a team like
// "Engineering", a lead's name), so the placeholders fit on one row in the
// same places the real ones do instead of wrapping onto a second row.
const FACT_WIDTHS = ['3.5rem', '5rem', '5.5rem']

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
            {FACT_WIDTHS.map((width, factIndex) => (
              <div key={factIndex}>
                <dt>
                  <Skeleton width="2.5rem" />
                </dt>
                <dd>
                  <Skeleton width={width} />
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
