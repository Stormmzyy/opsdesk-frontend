import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.tsx'
import SkeletonGroup from '../components/SkeletonGroup.tsx'
import StatGridSkeleton from '../components/StatGridSkeleton.tsx'
import StatusMessage from '../components/StatusMessage.tsx'
import PeopleSummary from '../features/employees/components/PeopleSummary.tsx'
import PriorityTicketList from '../features/tickets/components/PriorityTicketList.tsx'
import TicketListSkeleton from '../features/tickets/components/TicketListSkeleton.tsx'
import TicketStatusSummary from '../features/tickets/components/TicketStatusSummary.tsx'
import { TICKET_STATUSES } from '../features/tickets/utils/ticketStatus.ts'
import { useGetTicketsQuery } from '../store/ticketsApi.ts'
import './DashboardPage.css'

// The page only lays out the sections. Each feature component works out
// its own numbers from the data, so they update as soon as a ticket moves.
function DashboardPage() {
  // The same query the Tickets page uses, so they share one cached copy:
  // coming here from the Tickets page doesn't load the tickets again.
  const { data: tickets, isLoading, isError, refetch } = useGetTicketsQuery()

  // What the two ticket sections show, worked out once for each state.
  let statusContent: ReactNode = null
  let priorityContent: ReactNode = null
  if (isLoading) {
    // Placeholders shaped like the stat cards and the priority list. Only
    // the first group announces "Loading tickets", so screen readers don't
    // hear it twice.
    statusContent = (
      <SkeletonGroup label="Loading tickets">
        <StatGridSkeleton count={TICKET_STATUSES.length} />
      </SkeletonGroup>
    )
    priorityContent = (
      <SkeletonGroup>
        {/* The sample data has four urgent or high priority open tickets. */}
        <TicketListSkeleton rows={4} />
      </SkeletonGroup>
    )
  } else if (isError) {
    const errorMessage = (
      <StatusMessage type="error" onRetry={refetch}>
        Sorry, we couldn't load the tickets.
      </StatusMessage>
    )
    statusContent = errorMessage
    priorityContent = errorMessage
  } else if (tickets && tickets.length === 0) {
    // No tickets at all: four cards saying "0" would tell the user nothing,
    // so say so plainly and offer the next step.
    statusContent = (
      <StatusMessage
        type="empty"
        action={
          <Link to="/tickets/new" className="button button--primary">
            Create a ticket
          </Link>
        }
      >
        There are no tickets yet. Once there are, you'll see how many have each status here.
      </StatusMessage>
    )
    priorityContent = (
      <StatusMessage type="empty">
        Nothing needs attention: there are no tickets at all.
      </StatusMessage>
    )
  } else if (tickets) {
    statusContent = <TicketStatusSummary tickets={tickets} />
    priorityContent = <PriorityTicketList tickets={tickets} />
  }

  return (
    <>
      <PageHeader title="Dashboard" description="A quick overview of OpsDesk today." />

      <section className="dashboard-section" aria-labelledby="ticket-stats-heading">
        <h2 id="ticket-stats-heading">Tickets by status</h2>
        {statusContent}
      </section>

      {/* People come from local data, so this section never waits for tickets. */}
      <section className="dashboard-section" aria-labelledby="people-stats-heading">
        <h2 id="people-stats-heading">People</h2>
        <PeopleSummary />
      </section>

      <section className="dashboard-section" aria-labelledby="priority-heading">
        <h2 id="priority-heading">Urgent and high priority open tickets</h2>
        {priorityContent}
      </section>
    </>
  )
}

export default DashboardPage
