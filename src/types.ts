// Shared types used across the app.

// One link in the main navigation.
export interface NavPage {
  path: string
  label: string
}

// A union type: a TicketStatus can only be one of these exact strings,
// so a typo like 'CLOSD' is caught before the app even runs.
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

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
}

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

export interface Employee {
  id: number
  name: string
  department: string
  role: string
  email: string
  location: string
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED'

export interface Project {
  id: number
  name: string
  description: string
  status: ProjectStatus
  team: string
  // The name of the employee leading the project.
  lead: string
}

// A user from the JSONPlaceholder API (https://jsonplaceholder.typicode.com/users).
// The address and company come back as nested objects.
export interface User {
  id: number
  name: string
  username: string
  email: string
  phone: string
  website: string
  address: UserAddress
  company: UserCompany
}

export interface UserAddress {
  street: string
  suite: string
  city: string
  zipcode: string
  geo: {
    lat: string
    lng: string
  }
}

export interface UserCompany {
  name: string
  catchPhrase: string
  bs: string
}
