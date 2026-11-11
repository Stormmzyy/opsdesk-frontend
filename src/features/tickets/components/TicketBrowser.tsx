import { useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../../../components/Pagination.tsx'
import SkeletonGroup from '../../../components/SkeletonGroup.tsx'
import StatusMessage from '../../../components/StatusMessage.tsx'
import { readApiError } from '../../../store/apiError.ts'
import { useGetTicketPageQuery } from '../../../store/ticketsApi.ts'
import { useDebouncedValue } from '../../../utils/useDebouncedValue.ts'
import { useTicketView } from '../hooks/useTicketView.ts'
import type {
  MoveTicketHandler,
  PriorityFilter,
  StatusFilter,
  TicketQuery,
  TicketSort,
} from '../types.ts'
import { BOARD_PAGE_SIZE, LIST_PAGE_SIZE } from '../utils/ticketQuery.ts'
import { TICKET_PRIORITY_LABELS, getStatusLabel } from '../utils/ticketStatus.ts'
import TicketBoard from './TicketBoard.tsx'
import TicketBrowserSkeleton from './TicketBrowserSkeleton.tsx'
import TicketFilters from './TicketFilters.tsx'
import type { FilterControl } from './TicketFilters.tsx'
import TicketList from './TicketList.tsx'
import './TicketBrowser.css'

// The query parameters that have a control on screen. A 400 naming one of
// these is shown under that control; any other name (size, page, or one the
// server doesn't know) has nowhere to go, so it's listed in the error box.
const FILTER_CONTROLS: readonly string[] = ['search', 'status', 'priority', 'sort'] satisfies FilterControl[]

// How long the search box waits for typing to pause before asking.
const SEARCH_DELAY_MS = 300

// "1 ticket" but "2 tickets".
function countTickets(count: number): string {
  return `${count} ${count === 1 ? 'ticket' : 'tickets'}`
}

interface TicketBrowserProps {
  onMoveTicket: MoveTicketHandler
  // Whether "Reset to sample data" is on the page (mock API only), so the
  // empty state only points at it when it's there.
  canResetSampleData: boolean
}

// Search, filter, sort and page through tickets, as a list or as a board.
//
// The SERVER does all of it now (GET /tickets with query parameters): this
// component only keeps what the person chose, turns it into a query, and
// shows the page that comes back. Nothing is filtered or counted in the
// browser, so the totals are the server's, and for a USER they count only
// her own tickets.
//
// - The list asks for one page of LIST_PAGE_SIZE, in the chosen order.
// - The board can't be paged (a column showing only some of its cards would
//   mislead), so it asks for the first BOARD_PAGE_SIZE matching tickets, the
//   most the contract allows, and says so if more match than fit.
// Both use the same search and filters, so switching view shows the same
// tickets.
function TicketBrowser({ onMoveTicket, canResetSampleData }: TicketBrowserProps) {
  // The view is kept in the URL (see useTicketView); the rest in state.
  const [view, setView] = useTicketView()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL')
  // The server's own default order, written out.
  const [sort, setSort] = useState<TicketSort>('id,asc')
  // Counting from 1, as the contract does (page=1 is the first page). With
  // 0, the first request would be a 400, and an off-by-one in the pager
  // would show an empty last page or repeat a page's rows.
  const [page, setPage] = useState(1)

  const search = useDebouncedValue(searchText, SEARCH_DELAY_MS)
  const filters = {
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
    search,
  }
  const query: TicketQuery =
    view === 'list'
      ? { page, size: LIST_PAGE_SIZE, sort, ...filters }
      : { page: 1, size: BOARD_PAGE_SIZE, sort: 'id,asc', ...filters }

  const { data, isLoading, isFetching, isError, error, refetch } = useGetTicketPageQuery(query)

  // A page past the end isn't an error (the contract answers 200 with no
  // items and the real totals). It happens when tickets go away while
  // someone is on the last page. Step back to the new last page rather
  // than showing an empty one.
  //
  // Set during render, not in an effect: React's pattern for adjusting state
  // from what was just received. React re-renders straight away with the
  // new page, before anything is painted, so the empty page never shows;
  // an effect would paint it first and then render again.
  const lastPage = data?.totalPages ?? 0
  const pastTheEnd =
    view === 'list' && data !== undefined && data.items.length === 0 && lastPage > 0 && page > lastPage
  if (pastTheEnd) {
    setPage(lastPage)
  }

  // Any change to what's asked for starts again from page 1: the old page
  // number may not exist in the new results.
  function handleSearchChange(nextSearchText: string) {
    setSearchText(nextSearchText)
    setPage(1)
  }
  function handleStatusFilterChange(nextStatusFilter: StatusFilter) {
    setStatusFilter(nextStatusFilter)
    setPage(1)
  }
  function handlePriorityFilterChange(nextPriorityFilter: PriorityFilter) {
    setPriorityFilter(nextPriorityFilter)
    setPage(1)
  }
  function handleSortChange(nextSort: TicketSort) {
    setSort(nextSort)
    setPage(1)
  }

  // "Clear filters": back to every ticket.
  function handleClearFilters() {
    setSearchText('')
    setStatusFilter('ALL')
    setPriorityFilter('ALL')
    setPage(1)
    // The button disappears along with the message, which would drop
    // keyboard focus to the top of the page. Put it in the search box,
    // where someone would start a new search.
    const searchBox = document.getElementById('ticket-search')
    if (searchBox instanceof HTMLInputElement) {
      searchBox.focus()
    }
  }

  // A 400 for the query string names the PARAMETERS that broke a rule
  // (fields: { "status": "...", "stauts": "..." }). The UI only sends
  // values from its own lists, so this means the client and server have
  // drifted apart; it must be visible, not swallowed.
  // - A name with a control on screen: its message goes under that control.
  // - Any other name (page, size, an unknown parameter): there's no control
  //   to attach it to, so it's listed by name in the error box instead.
  const apiError = readApiError(error)
  const queryProblems = apiError?.error === 'VALIDATION_ERROR' ? apiError.fields : {}
  const controlErrors: Partial<Record<FilterControl, string>> = {}
  const otherProblems: [string, string][] = []
  for (const [name, message] of Object.entries(queryProblems)) {
    if (FILTER_CONTROLS.includes(name)) {
      controlErrors[name as FilterControl] = message
    } else {
      otherProblems.push([name, message])
    }
  }

  const isFiltered =
    filters.status !== undefined || filters.priority !== undefined || search.trim() !== ''

  // Says exactly which filters found nothing.
  const chosen: string[] = []
  if (search.trim() !== '') chosen.push(`"${search.trim()}"`)
  if (filters.status) chosen.push(`the status ${getStatusLabel(filters.status)}`)
  if (filters.priority) chosen.push(`the priority ${TICKET_PRIORITY_LABELS[filters.priority]}`)
  const emptyMessage =
    chosen.length > 0 ? `No tickets match ${chosen.join(' with ')}.` : 'No tickets match your filters.'

  let summary = ''
  if (data && data.totalItems > 0) {
    if (view === 'list') {
      // Positions on THIS page, from the server's own page and size.
      const first = (data.page - 1) * data.size + 1
      const last = first + data.items.length - 1
      summary = `Showing ${first} to ${last} of ${countTickets(data.totalItems)}`
    } else if (data.totalItems > data.items.length) {
      summary = `Showing the first ${data.items.length} of ${countTickets(data.totalItems)} on the board. Narrow the filters, or use the list, to see the rest.`
    } else {
      summary = `Showing ${countTickets(data.totalItems)} on the board`
    }
  } else if (data) {
    summary = 'No tickets match your search.'
  }

  return (
    <>
      <div className="ticket-browser__toolbar">
        <TicketFilters
          searchText={searchText}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={handlePriorityFilterChange}
          sort={view === 'list' ? sort : undefined}
          onSortChange={handleSortChange}
          errors={controlErrors}
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

      {/* role="status" makes screen readers announce the new count. aria-busy
          while a new page or filter is on its way. */}
      <p className="ticket-browser__summary" role="status" aria-busy={isFetching}>
        {summary}
      </p>

      {isLoading && (
        <SkeletonGroup label="Loading tickets">
          <TicketBrowserSkeleton view={view} />
        </SkeletonGroup>
      )}

      {/* A list that failed to load stays explained HERE, where the list
          would be, with Retry, rather than as a toast: a toast times out
          and would leave an empty page with no reason given. (Failed CHANGES
          to a ticket are toasts, because the page is still there.) */}
      {isError && apiError?.error === 'VALIDATION_ERROR' && (
        <StatusMessage
          type="error"
          action={
            <button type="button" className="button" onClick={handleClearFilters}>
              Clear filters
            </button>
          }
        >
          The server didn&apos;t accept this search.{' '}
          {otherProblems.length > 0
            ? otherProblems.map(([name, message]) => `${name}: ${message}`).join(' ')
            : 'See the highlighted filters above.'}
        </StatusMessage>
      )}
      {isError && apiError?.error !== 'VALIDATION_ERROR' && (
        <StatusMessage type="error" onRetry={refetch}>
          Sorry, we couldn&apos;t load the tickets.
        </StatusMessage>
      )}

      {!isError && data && data.totalItems === 0 && !isFiltered && (
        <StatusMessage
          type="empty"
          action={
            <Link to="/tickets/new" className="button button--primary">
              Create a ticket
            </Link>
          }
        >
          {/* Only point at the Reset button when it's actually there. */}
          {canResetSampleData
            ? 'There are no tickets yet. Create the first one, or use "Reset to sample data" above to bring back the examples.'
            : 'There are no tickets yet. Create the first one.'}
        </StatusMessage>
      )}

      {!isError && data && data.totalItems === 0 && isFiltered && (
        <StatusMessage
          type="empty"
          action={
            <button type="button" className="button" onClick={handleClearFilters}>
              Clear filters
            </button>
          }
        >
          {emptyMessage} Try a different search, or clear the filters to see every ticket.
        </StatusMessage>
      )}

      {!isError && data && data.items.length > 0 && view === 'list' && (
        <>
          <TicketList tickets={data.items} />
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
            label="Ticket list pages"
          />
        </>
      )}

      {!isError && data && data.items.length > 0 && view === 'board' && (
        <TicketBoard tickets={data.items} onMoveTicket={onMoveTicket} />
      )}
    </>
  )
}

export default TicketBrowser
