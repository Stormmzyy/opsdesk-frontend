import PageHeader from '../components/PageHeader.tsx'
import StatusMessage from '../components/StatusMessage.tsx'
import EmployeeDirectory from '../features/employees/components/EmployeeDirectory.tsx'
import TeamSummary from '../features/employees/components/TeamSummary.tsx'
import { useGetTicketsQuery } from '../store/ticketsApi.ts'

function TeamsPage() {
  // Only the team summary needs tickets (to count each team's open ones).
  const { data: tickets, isLoading, isError, refetch } = useGetTicketsQuery()

  return (
    <>
      <PageHeader title="Teams" description="Every team, its people, and its open work." />

      {isLoading && <StatusMessage type="loading">Loading team summaries…</StatusMessage>}

      {isError && (
        <StatusMessage type="error" onRetry={refetch}>
          Sorry, we couldn't load the tickets for the team summaries.
        </StatusMessage>
      )}

      {tickets && !isError && <TeamSummary tickets={tickets} />}

      {/* Employees come from local data, so the directory never waits. */}
      <EmployeeDirectory />
    </>
  )
}

export default TeamsPage
