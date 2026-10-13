import Skeleton from '../../../components/Skeleton.tsx'
import { employees } from '../../../data/employees.ts'
import { getDepartments } from '../utils/employeeHelpers.ts'
import './TeamSummary.css'

// One placeholder card per team. The teams come from local data, so the
// number of cards is known before the tickets arrive and matches exactly.
const TEAM_COUNT = getDepartments(employees).length

// The loading placeholder for TeamSummary: its heading and one card per
// team, using the same elements and CSS classes with skeletons in place of
// the text. Wrap it in a SkeletonGroup, whose aria-hidden keeps these
// placeholder headings out of what screen readers see.
function TeamSummarySkeleton() {
  return (
    <div className="teams-section">
      <h2>
        <Skeleton width="8rem" />
      </h2>
      <ul className="team-list">
        {Array.from({ length: TEAM_COUNT }, (_, index) => (
          <li key={index} className="team-card">
            <h3>
              <Skeleton width="6rem" />
            </h3>
            <dl>
              {/* Members and Open tickets. */}
              {[0, 1].map((fact) => (
                <div key={fact}>
                  <dt>
                    <Skeleton width="3.5rem" />
                  </dt>
                  <dd>
                    <Skeleton width="1.5rem" />
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TeamSummarySkeleton
