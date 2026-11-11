import type { ChangeEvent } from 'react'
import type { PriorityFilter, StatusFilter, TicketSort } from '../types.ts'
import { SORT_OPTIONS, parseSort } from '../utils/ticketQuery.ts'
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUSES,
  parsePriority,
  parseStatusFilter,
} from '../utils/ticketStatus.ts'
import './TicketFilters.css'

// The controls that map onto one of GET /tickets' query parameters. A 400
// from the server names the parameter, and its message is shown under the
// control of the same name (TicketBrowser decides which keys have one).
export type FilterControl = 'search' | 'status' | 'priority' | 'sort'

interface TicketFiltersProps {
  searchText: string
  onSearchChange: (searchText: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (statusFilter: StatusFilter) => void
  priorityFilter: PriorityFilter
  onPriorityFilterChange: (priorityFilter: PriorityFilter) => void
  // Left out on the board: its columns aren't ordered by it.
  sort?: TicketSort
  onSortChange?: (sort: TicketSort) => void
  // The server's message for a control, from a 400 VALIDATION_ERROR.
  errors?: Partial<Record<FilterControl, string>>
}

// The search box and the dropdowns above the ticket list and board. Every
// value here becomes a query parameter: the server does the filtering.
function TicketFilters({
  searchText,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sort,
  onSortChange,
  errors = {},
}: TicketFiltersProps) {
  // The dropdowns give plain strings, so turn each back into its type.
  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextFilter = parseStatusFilter(event.target.value)
    if (nextFilter) {
      onStatusFilterChange(nextFilter)
    }
  }

  function handlePriorityChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value
    const nextFilter = value === 'ALL' ? 'ALL' : parsePriority(value)
    if (nextFilter) {
      onPriorityFilterChange(nextFilter)
    }
  }

  function handleSortChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextSort = parseSort(event.target.value)
    if (nextSort && onSortChange) {
      onSortChange(nextSort)
    }
  }

  // The attributes that tie a control to its server message, if it has one.
  function errorProps(control: FilterControl) {
    return errors[control]
      ? { 'aria-invalid': true, 'aria-describedby': `ticket-${control}-error` }
      : {}
  }

  function errorMessage(control: FilterControl) {
    return errors[control] ? (
      <p id={`ticket-${control}-error`} className="filter-field__error">
        {errors[control]}
      </p>
    ) : null
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
          {...errorProps('search')}
        />
        {errorMessage('search')}
      </div>

      <div className="filter-field">
        <label htmlFor="ticket-status-filter">Status</label>
        <select
          id="ticket-status-filter"
          value={statusFilter}
          onChange={handleStatusChange}
          {...errorProps('status')}
        >
          <option value="ALL">All statuses</option>
          {TICKET_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        {errorMessage('status')}
      </div>

      <div className="filter-field">
        <label htmlFor="ticket-priority-filter">Priority</label>
        <select
          id="ticket-priority-filter"
          value={priorityFilter}
          onChange={handlePriorityChange}
          {...errorProps('priority')}
        >
          <option value="ALL">All priorities</option>
          {TICKET_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {TICKET_PRIORITY_LABELS[priority]}
            </option>
          ))}
        </select>
        {errorMessage('priority')}
      </div>

      {sort !== undefined && (
        <div className="filter-field">
          <label htmlFor="ticket-sort">Sort by</label>
          <select id="ticket-sort" value={sort} onChange={handleSortChange} {...errorProps('sort')}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errorMessage('sort')}
        </div>
      )}
    </div>
  )
}

export default TicketFilters
