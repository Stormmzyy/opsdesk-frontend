import type { ChangeEvent } from 'react'
import type { StatusFilter } from '../types.ts'
import { TICKET_STATUSES, parseStatusFilter } from '../utils/ticketStatus.ts'
import './TicketFilters.css'

interface TicketFiltersProps {
  searchText: string
  onSearchChange: (searchText: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (statusFilter: StatusFilter) => void
}

// The search box and status dropdown above the ticket list and board.
function TicketFilters({
  searchText,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: TicketFiltersProps) {
  // The dropdown gives a plain string, so turn it back into a StatusFilter.
  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextFilter = parseStatusFilter(event.target.value)
    if (nextFilter) {
      onStatusFilterChange(nextFilter)
    }
  }

  return (
    <div className="ticket-filters">
      <div className="filter-field">
        <label htmlFor="ticket-search">Search tickets</label>
        <input
          id="ticket-search"
          type="search"
          placeholder="Search titles and descriptions"
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="ticket-status-filter">Status</label>
        <select id="ticket-status-filter" value={statusFilter} onChange={handleStatusChange}>
          <option value="ALL">All statuses</option>
          {TICKET_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default TicketFilters
