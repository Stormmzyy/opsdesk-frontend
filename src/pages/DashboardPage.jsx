import { employees } from '../data/employees.js'
import { getDepartments } from '../utils/employeeHelpers.js'
import { TICKET_STATUSES, getStatusLabel, isOpenTicket } from '../utils/ticketStatus.js'
import PageHeader from '../components/common/PageHeader.jsx'
import StatCard from '../components/common/StatCard.jsx'
import StatusMessage from '../components/common/StatusMessage.jsx'
import PriorityBadge from '../components/tickets/PriorityBadge.jsx'
import './DashboardPage.css'

// The priorities that need attention first, most important first.
const TOP_PRIORITIES = ['URGENT', 'HIGH']

// Every number here is worked out from the data on each render,
// so it updates straight away when a ticket moves.
function DashboardPage({ tickets }) {
  const teamCount = getDepartments(employees).length

  // Open tickets that are urgent or high, with urgent ones listed first.
  // filter() makes a new array, so sorting it doesn't touch the original.
  const priorityTickets = tickets
    .filter((ticket) => isOpenTicket(ticket) && TOP_PRIORITIES.includes(ticket.priority))
    .sort(
      (a, b) => TOP_PRIORITIES.indexOf(a.priority) - TOP_PRIORITIES.indexOf(b.priority),
    )

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

      <section className="dashboard-section" aria-labelledby="priority-heading">
        <h2 id="priority-heading">Urgent and high priority open tickets</h2>
        {priorityTickets.length === 0 ? (
          <StatusMessage type="empty">
            No urgent or high priority tickets are open. Nice work!
          </StatusMessage>
        ) : (
          <ul className="priority-list">
            {priorityTickets.map((ticket) => (
              <li key={ticket.id} className="priority-list__item">
                <span className="priority-list__title">{ticket.title}</span>
                <span className="priority-list__meta">
                  <PriorityBadge priority={ticket.priority} />
                  <span>{ticket.team}</span>
                  <span>{getStatusLabel(ticket.status)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default DashboardPage
