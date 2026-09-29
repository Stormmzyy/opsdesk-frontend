import { employees } from '../../../data/employees.ts'
import type { Ticket } from '../../tickets/types.ts'
import { getTeamSummaries } from '../utils/teamHelpers.ts'
import './TeamSummary.css'

interface TeamSummaryProps {
  tickets: Ticket[]
}

// One card per team, with its member count and open ticket count.
function TeamSummary({ tickets }: TeamSummaryProps) {
  // Derived from the data on every render, so moving a ticket updates the counts.
  const teamSummaries = getTeamSummaries(employees, tickets)

  return (
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
  )
}

export default TeamSummary
