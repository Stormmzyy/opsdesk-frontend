import type { Ticket } from '../features/tickets/types.ts'
import PageHeader from '../components/PageHeader.tsx'
import PeopleSummary from '../features/employees/components/PeopleSummary.tsx'
import PriorityTicketList from '../features/tickets/components/PriorityTicketList.tsx'
import TicketStatusSummary from '../features/tickets/components/TicketStatusSummary.tsx'
import './DashboardPage.css'

interface DashboardPageProps {
  tickets: Ticket[]
}

// The page only lays out the sections. Each feature component works out
// its own numbers from the data, so they update as soon as a ticket moves.
function DashboardPage({ tickets }: DashboardPageProps) {
  return (
    <>
      <PageHeader title="Dashboard" description="A quick overview of OpsDesk today." />

      <section className="dashboard-section" aria-labelledby="ticket-stats-heading">
        <h2 id="ticket-stats-heading">Tickets by status</h2>
        <TicketStatusSummary tickets={tickets} />
      </section>

      <section className="dashboard-section" aria-labelledby="people-stats-heading">
        <h2 id="people-stats-heading">People</h2>
        <PeopleSummary />
      </section>

      <section className="dashboard-section" aria-labelledby="priority-heading">
        <h2 id="priority-heading">Urgent and high priority open tickets</h2>
        <PriorityTicketList tickets={tickets} />
      </section>
    </>
  )
}

export default DashboardPage
