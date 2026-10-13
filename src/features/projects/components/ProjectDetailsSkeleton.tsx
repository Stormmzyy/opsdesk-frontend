import { Fragment } from 'react'
import Skeleton from '../../../components/Skeleton.tsx'
import './ProjectDetails.css'

// One bar per "word" of a typical project description (about 11 words).
const WORD_WIDTHS = [
  '1.25rem', '3rem', '4.5rem', '2.5rem', '1.5rem', '3.5rem', '2rem', '3rem', '1.5rem', '2.5rem',
  '3.5rem',
]

// The loading placeholder for ProjectDetails: the same elements and CSS
// classes, with skeletons in place of the text. Wrap it in a SkeletonGroup.
function ProjectDetailsSkeleton() {
  return (
    <div className="project-detail">
      <h2>
        <Skeleton width="7rem" />
      </h2>
      <p className="project-detail__description">
        {WORD_WIDTHS.map((width, index) => (
          <Fragment key={index}>
            <Skeleton width={width} />{' '}
          </Fragment>
        ))}
      </p>
      <h2>
        <Skeleton width="5rem" />
      </h2>
      <dl className="project-detail__facts">
        {[0, 1, 2].map((fact) => (
          <div key={fact}>
            <dt>
              <Skeleton width="3rem" />
            </dt>
            <dd>
              <Skeleton width="6rem" />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default ProjectDetailsSkeleton
