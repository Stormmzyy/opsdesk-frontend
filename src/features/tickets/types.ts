// Types for the tickets feature.

// A union type: a TicketStatus can only be one of these exact strings,
// so a typo like 'CLOSD' is caught before the app even runs.
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

// What the status filter can be set to: one status, or 'ALL' for every status.
export type StatusFilter = TicketStatus | 'ALL'

// URGENT is the highest priority. The Dashboard lists urgent and high tickets.
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Ticket {
  id: number
  title: string
  description: string
  priority: Priority
  status: TicketStatus
  // One of the department names from the employee data, e.g. 'Engineering'.
  team: string

  // The contract's output-only fields. The server sets them; the client only
  // ever reads them. Sending any of them in a POST or PATCH is refused with a
  // 400 (backend decision 39), which is why TicketUpdate (ticketsApi.ts) and
  // TicketFormValues below can't carry them.
  //
  // Who the ticket is assigned to: both null when nobody is. Everyone who can
  // see the ticket sees this name (backend decision 50: names and ids only,
  // never email or role).
  assigneeId: number | null
  assigneeName: string | null
  // Who raised it.
  createdById: number
  createdByName: string
  // Goes up by one with every change the server writes.
  version: number
}

// The fields a client may send when creating or editing a ticket.
export type EditableTicketField = 'title' | 'description' | 'priority' | 'status' | 'team'

// --- The server's list: GET /tickets with query parameters ---------------
// (API_CONTRACT.md, "Filtering, sorting and pagination")

// The five fields the server will sort on. Anything else is a 400, so the
// type only allows these.
export type TicketSortField = 'id' | 'title' | 'status' | 'priority' | 'team'

// The `sort` parameter, spelled exactly as the server accepts it: the field,
// a comma, and a LOWERCASE direction ("title,desc"). The filter values are
// UPPERCASE ("status=OPEN"). There's no single casing rule (backend decision
// 48), and the wrong one is a 400, so the type spells out the 10 values the
// UI may send: "title,DESC" or "created,asc" won't compile.
export type TicketSort = `${TicketSortField},${'asc' | 'desc'}`

// What the list asks the server for. Undefined means "not filtered": the
// parameter is left out, because an empty value is a 400 for everything
// except search.
export interface TicketQuery {
  // Counting from 1, as the contract does: page=1 is the first page.
  page: number
  size: number
  sort: TicketSort
  status?: TicketStatus
  priority?: Priority
  search?: string
}

// The contract's envelope for a page of tickets.
export interface TicketPage {
  items: Ticket[]
  page: number
  size: number
  // How many match the filters across all pages, counting only the tickets
  // the caller may see (a USER's totals count only her own).
  totalItems: number
  // 0 when nothing matches.
  totalPages: number
}

// What the priority filter can be set to: one priority, or every one.
export type PriorityFilter = Priority | 'ALL'

// The function a ticket card calls to change a ticket's status.
export type MoveTicketHandler = (ticketId: number, newStatus: TicketStatus) => void

// The fields the ticket form edits. status is optional ("?") because the
// create form doesn't show it: new tickets always start as OPEN.
export interface TicketFormValues {
  title: string
  description: string
  priority: Priority
  team: string
  status?: TicketStatus
}

// A status paired with the text we show for it, e.g. 'IN_PROGRESS' / 'In progress'.
export interface TicketStatusOption {
  value: TicketStatus
  label: string
}
