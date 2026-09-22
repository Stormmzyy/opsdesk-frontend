import { employees } from '../data/employees.js'
import { getTeamSummaries } from '../utils/teamHelpers.js'
import PageHeader from '../components/common/PageHeader.jsx'
import EmployeeDirectory from '../components/employees/EmployeeDirectory.jsx'
import './TeamsPage.css'

function TeamsPage({ tickets }) {
  // Derived from the data on every render, so moving a ticket updates the counts.
  const teamSummaries = getTeamSummaries(employees, tickets)

  return (
    <>
      <PageHeader title="Teams" description="Every team, its people, and its open work." />

      <section className="teams-section" aria-labelledby="team-summary-heading">
        <h2 id="team-summary-heading">Team summary</h2>
        <ul className="team-list">
          {teamSummaries.map((team) => (
            <li key={team.name} className="team-card">
              <h3>{team.name}</h3>
              <dl>
                <div>
                  <dt>Members</dt>
                  <dd>{team.memberCount}</dd>
                </div>
                <div>
                  <dt>Open tickets</dt>
                  <dd>{team.openTicketCount}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      <EmployeeDirectory />
    </>
  )
}

export default TeamsPage
