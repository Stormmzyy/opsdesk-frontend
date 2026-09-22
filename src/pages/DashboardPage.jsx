import { employees } from '../data/employees.js'
import { getDepartments } from '../utils/employeeHelpers.js'
import { TICKET_STATUSES } from '../utils/ticketStatus.js'
import PageHeader from '../components/common/PageHeader.jsx'
import StatCard from '../components/common/StatCard.jsx'
import './DashboardPage.css'

// Every number here is worked out from the data on each render,
// so it updates straight away when a ticket moves.
function DashboardPage({ tickets }) {
  const teamCount = getDepartments(employees).length

  return (
    <>
      <PageHeader title="Dashboard" description="A quick overview of OpsDesk today." />

      <section className="dashboard-section" aria-labelledby="ticket-stats-heading">
        <h2 id="ticket-stats-heading">Tickets by status</h2>
        <div className="stat-grid">
          {TICKET_STATUSES.map((status) => (
            <StatCard
              key={status.value}
              label={status.label}
              value={tickets.filter((ticket) => ticket.status === status.value).length}
            />
          ))}
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="people-stats-heading">
        <h2 id="people-stats-heading">People</h2>
        <div className="stat-grid">
          <StatCard label="Employees" value={employees.length} />
          <StatCard label="Teams" value={teamCount} />
        </div>
      </section>
    </>
  )
}

export default DashboardPage
