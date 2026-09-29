import type { Ticket } from '../features/tickets/types.ts'
import PageHeader from '../components/PageHeader.tsx'
import EmployeeDirectory from '../features/employees/components/EmployeeDirectory.tsx'
import TeamSummary from '../features/employees/components/TeamSummary.tsx'

interface TeamsPageProps {
  tickets: Ticket[]
}

function TeamsPage({ tickets }: TeamsPageProps) {
  return (
    <>
      <PageHeader title="Teams" description="Every team, its people, and its open work." />
      <TeamSummary tickets={tickets} />
      <EmployeeDirectory />
    </>
  )
}

export default TeamsPage
