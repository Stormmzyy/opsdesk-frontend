import StatCard from '../../../components/StatCard.tsx'
import type { Ticket } from '../types.ts'
import { TICKET_STATUSES } from '../utils/ticketStatus.ts'

interface TicketStatusSummaryProps {
  tickets: Ticket[]
}

// One stat card per status, showing how many tickets have that status.
// Worked out on every render, so it updates as soon as a ticket moves.
function TicketStatusSummary({ tickets }: TicketStatusSummaryProps) {
  return (
    <div className="stat-grid">
      {TICKET_STATUSES.map((status) => (
        <StatCard
          key={status.value}
          label={status.label}
          value={tickets.filter((ticket) => ticket.status === status.value).length}
        />
      ))}
    </div>
  )
}

export default TicketStatusSummary
