import type { TicketQuery, TicketSort } from '../types.ts'

// The page size the list asks for: the contract's default, sent explicitly.
// Any parameter at all switches GET /tickets from the plain array to the
// envelope, so the list always sends page and size.
export const LIST_PAGE_SIZE = 10

// The board can't be paged: a column that showed some of its cards would
// mislead. It asks for one page as large as the contract allows (size is 1
// to 100), and says so when more match than fit.
export const BOARD_PAGE_SIZE = 100

// The sort orders the list offers, each one of the server's spellings.
// The labels say what "ascending" MEANS for that field, because the server
// sorts by meaning (priority LOW to URGENT, status OPEN to CLOSED), not by
// spelling.
export const SORT_OPTIONS: { value: TicketSort; label: string }[] = [
  // First, because it's the default: the server's own order (by id).
  { value: 'id,asc', label: 'Oldest first' },
  { value: 'id,desc', label: 'Newest first' },
  { value: 'priority,desc', label: 'Priority, most urgent first' },
  { value: 'priority,asc', label: 'Priority, least urgent first' },
  { value: 'status,asc', label: 'Status, open first' },
  { value: 'status,desc', label: 'Status, closed first' },
  { value: 'title,asc', label: 'Title, A to Z' },
  { value: 'title,desc', label: 'Title, Z to A' },
  { value: 'team,asc', label: 'Team, A to Z' },
]

// Turns a <select>'s string back into a sort the server accepts, or
// undefined for anything else.
export function parseSort(value: string): TicketSort | undefined {
  return SORT_OPTIONS.find((option) => option.value === value)?.value
}

// The query string for GET /tickets, built from what the UI chose.
//
// Each rule here is one the server enforces with a 400 (decision 44 and the
// contract's table), so getting one wrong shows up as an error, not as a
// silently wrong list:
// - only the contract's parameter names (unknown ones are refused);
// - a filter that isn't set is LEFT OUT, never sent empty: "status=" is a
//   400, not "any status". Only search may be empty, and it's left out too
//   when it's only spaces, since the server would ignore it anyway;
// - sort is one of the whitelisted spellings (the TicketSort type);
// - enum values are uppercase, the sort direction lowercase (decision 48).
export function buildTicketParams(query: TicketQuery): Record<string, string> {
  const params: Record<string, string> = {
    page: String(query.page),
    size: String(query.size),
    sort: query.sort,
  }
  if (query.status !== undefined) params.status = query.status
  if (query.priority !== undefined) params.priority = query.priority
  const search = query.search?.trim()
  if (search) params.search = search
  return params
}
