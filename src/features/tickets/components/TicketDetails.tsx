import type { Ticket } from '../types.ts'
import { getStatusLabel } from '../utils/ticketStatus.ts'
import PriorityBadge from './PriorityBadge.tsx'
import './TicketDetails.css'

interface TicketDetailsProps {
  ticket: Ticket
}

// A ticket's description, priority, status, team and people.
function TicketDetails({ ticket }: TicketDetailsProps) {
  return (
    <div className="ticket-detail">
      <h2>Description</h2>
      <p className="ticket-detail__description">{ticket.description}</p>

      <h2>Details</h2>
      <dl className="ticket-detail__facts">
        <div>
          <dt>Priority</dt>
          <dd>
            <PriorityBadge priority={ticket.priority} />
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{getStatusLabel(ticket.status)}</dd>
        </div>
        <div>
          <dt>Team</dt>
          <dd>{ticket.team}</dd>
        </div>
        {/* Shown to everyone who can see the ticket. Backend decision 50
            records this exposure: names only, of the people on tickets the
            caller can already see, never email or role. */}
        <div>
          <dt>Assigned to</dt>
          <dd>{ticket.assigneeName ?? 'Nobody yet'}</dd>
        </div>
        <div>
          <dt>Raised by</dt>
          <dd>{ticket.createdByName}</dd>
        </div>
      </dl>
    </div>
  )
}

export default TicketDetails
