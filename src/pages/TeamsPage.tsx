import type { Ticket } from '../features/tickets/types.ts'
import { employees } from '../data/employees.ts'
import { getTeamSummaries } from '../features/employees/utils/teamHelpers.ts'
import PageHeader from '../components/PageHeader.tsx'
import EmployeeDirectory from '../features/employees/components/EmployeeDirectory.tsx'
import './TeamsPage.css'

interface TeamsPageProps {
  tickets: Ticket[]
}

function TeamsPage({ tickets }: TeamsPageProps) {
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
