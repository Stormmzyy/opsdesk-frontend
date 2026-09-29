import type { Priority, Ticket } from '../features/tickets/types.ts'
import { employees } from '../data/employees.ts'
import { getDepartments } from '../features/employees/utils/employeeHelpers.ts'
import { TICKET_STATUSES, getStatusLabel, isOpenTicket } from '../features/tickets/utils/ticketStatus.ts'
import PageHeader from '../components/PageHeader.tsx'
import StatCard from '../components/StatCard.tsx'
import StatusMessage from '../components/StatusMessage.tsx'
import PriorityBadge from '../features/tickets/components/PriorityBadge.tsx'
import './DashboardPage.css'

// The priorities that need attention first, most important first.
const TOP_PRIORITIES: Priority[] = ['URGENT', 'HIGH']

// Every number here is worked out from the data on each render,
// so it updates straight away when a ticket moves.
interface DashboardPageProps {
  tickets: Ticket[]
}

function DashboardPage({ tickets }: DashboardPageProps) {
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
