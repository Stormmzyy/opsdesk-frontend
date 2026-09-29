import { useState } from 'react'
import Pagination from '../../../components/Pagination.tsx'
import StatusMessage from '../../../components/StatusMessage.tsx'
import { paginate } from '../../../utils/pagination.ts'
import type { MoveTicketHandler, StatusFilter, Ticket } from '../types.ts'
import { filterTickets } from '../utils/ticketHelpers.ts'
import TicketBoard from './TicketBoard.tsx'
import TicketFilters from './TicketFilters.tsx'
import TicketList from './TicketList.tsx'
import './TicketBrowser.css'

const PAGE_SIZE = 10

type TicketView = 'list' | 'board'

// "1 ticket" but "2 tickets".
function countTickets(count: number): string {
  return `${count} ${count === 1 ? 'ticket' : 'tickets'}`
}

interface TicketBrowserProps {
  tickets: Ticket[]
  onMoveTicket: MoveTicketHandler
}

// Search, filter and page through tickets, as a list or as a board.
// The search and status filter apply to BOTH views, so they always show the
// same tickets. Pagination only applies to the list: the board groups every
// matching ticket into its status column instead.
function TicketBrowser({ tickets, onMoveTicket }: TicketBrowserProps) {
  // Only what the user chose is kept in state...
  const [view, setView] = useState<TicketView>('list')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [page, setPage] = useState(1)

  // ...everything else is worked out from it on every render, so it can never
  // get out of sync with the tickets.
  const matchingTickets = filterTickets(tickets, searchText, statusFilter)
  const ticketPage = paginate(matchingTickets, page, PAGE_SIZE)

  // A new search or filter can change how many pages there are,
  // so go back to the first page.
  function handleSearchChange(nextSearchText: string) {
    setSearchText(nextSearchText)
    setPage(1)
  }

  function handleStatusFilterChange(nextStatusFilter: StatusFilter) {
    setStatusFilter(nextStatusFilter)
    setPage(1)
  }

  let summary = 'No tickets match your search.'
  if (matchingTickets.length > 0) {
    summary =
      view === 'list'
        ? `Showing ${ticketPage.firstItemNumber} to ${ticketPage.lastItemNumber} of ${countTickets(ticketPage.totalItems)}`
        : `Showing ${countTickets(matchingTickets.length)} on the board`
  }

  return (
    <>
      <div className="ticket-browser__toolbar">
        <TicketFilters
          searchText={searchText}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
        />

        {/* aria-pressed tells screen readers which view button is switched on. */}
        <div className="ticket-browser__views" role="group" aria-label="View">
          <button
            type="button"
            className="button"
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            List
          </button>
          <button
            type="button"
            className="button"
            aria-pressed={view === 'board'}
            onClick={() => setView('board')}
          >
            Board
          </button>
        </div>
      </div>

      {/* role="status" makes screen readers announce the new count as it changes. */}
      <p className="ticket-browser__summary" role="status">
        {summary}
      </p>

      {matchingTickets.length === 0 && (
        <StatusMessage type="empty">
          Try a different search, or choose "All statuses".
        </StatusMessage>
      )}

      {matchingTickets.length > 0 && view === 'list' && (
        <>
          <TicketList tickets={ticketPage.items} />
          <Pagination
            currentPage={ticketPage.currentPage}
            totalPages={ticketPage.totalPages}
            onPageChange={setPage}
            label="Ticket list pages"
          />
        </>
      )}

      {matchingTickets.length > 0 && view === 'board' && (
        <TicketBoard tickets={matchingTickets} onMoveTicket={onMoveTicket} />
      )}
    </>
  )
}

export default TicketBrowser
