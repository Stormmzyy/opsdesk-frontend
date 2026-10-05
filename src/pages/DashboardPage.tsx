import type { ReactNode } from 'react'
import PageHeader from '../components/PageHeader.tsx'
import StatusMessage from '../components/StatusMessage.tsx'
import PeopleSummary from '../features/employees/components/PeopleSummary.tsx'
import PriorityTicketList from '../features/tickets/components/PriorityTicketList.tsx'
import TicketStatusSummary from '../features/tickets/components/TicketStatusSummary.tsx'
import { useGetTicketsQuery } from '../store/ticketsApi.ts'
import './DashboardPage.css'

// The page only lays out the sections. Each feature component works out
// its own numbers from the data, so they update as soon as a ticket moves.
function DashboardPage() {
  // The same query the Tickets page uses, so they share one cached copy:
  // coming here from the Tickets page doesn't load the tickets again.
  const { data: tickets, isLoading, isError, refetch } = useGetTicketsQuery()

  // What the two ticket sections show until the tickets are ready.
  // null means "nothing to report": show the real content instead.
  let ticketMessage: ReactNode = null
  if (isLoading) {
    ticketMessage = <StatusMessage type="loading">Loading tickets…</StatusMessage>
  } else if (isError) {
    ticketMessage = (
      <StatusMessage type="error" onRetry={refetch}>
        Sorry, we couldn't load the tickets.
      </StatusMessage>
    )
  }

  return (
    <>
      <PageHeader title="Dashboard" description="A quick overview of OpsDesk today." />

      <section className="dashboard-section" aria-labelledby="ticket-stats-heading">
        <h2 id="ticket-stats-heading">Tickets by status</h2>
        {/* "??" uses the right-hand side only when ticketMessage is null. */}
        {ticketMessage ?? (tickets && <TicketStatusSummary tickets={tickets} />)}
      </section>

      {/* People come from local data, so this section never waits for tickets. */}
      <section className="dashboard-section" aria-labelledby="people-stats-heading">
        <h2 id="people-stats-heading">People</h2>
        <PeopleSummary />
      </section>

      <section className="dashboard-section" aria-labelledby="priority-heading">
        <h2 id="priority-heading">Urgent and high priority open tickets</h2>
        {ticketMessage ?? (tickets && <PriorityTicketList tickets={tickets} />)}
      </section>
    </>
  )
}

export default DashboardPage
