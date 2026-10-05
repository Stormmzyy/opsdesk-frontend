import { tickets as sampleTickets } from '../data/tickets.ts'
import type { Ticket } from '../features/tickets/types.ts'
import { isTicketList } from '../features/tickets/utils/ticketHelpers.ts'

// The mock API's "database". Only the MSW handlers use this file: the app
// itself never touches localStorage for tickets. It talks to /api/tickets
// like it would talk to a real backend, and the handlers read and write here.
//
// It keeps the tickets in memory, like a server would, and also saves them to
// localStorage, so they survive a page refresh just like in Week 2.

// The same key Week 2 used, so tickets saved before this change carry over.
const STORAGE_KEY = 'opsdesk.tickets'

// Saves the tickets. If localStorage is full or blocked, the mock API keeps
// working from memory; the changes just won't survive a refresh.
function persist(tickets: Ticket[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  } catch {
    // Nothing else to do: the in-memory copy is still up to date.
  }
}

// Reads the saved tickets once, when the mock API starts. Falls back to the
// sample tickets (and saves them, "seeding" the database) when:
// - nothing has been saved yet,
// - the saved text isn't valid JSON, or doesn't look like a list of tickets,
// - localStorage can't be used at all.
function load(): Ticket[] {
  try {
    const savedText = window.localStorage.getItem(STORAGE_KEY)
    if (savedText !== null) {
      // JSON.parse could return anything, so treat it as unknown until checked.
      const saved: unknown = JSON.parse(savedText)
      if (isTicketList(saved)) {
        return saved
      }
    }
  } catch {
    // Invalid JSON or blocked storage: fall through to the sample tickets.
  }
  persist(sampleTickets)
  return sampleTickets
}

let tickets: Ticket[] = load()

export function getAllTickets(): Ticket[] {
  return tickets
}

// Replaces every ticket. The handlers always pass a NEW array, so nothing
// outside this file can change the stored list by accident.
export function saveAllTickets(nextTickets: Ticket[]) {
  tickets = nextTickets
  persist(nextTickets)
}

// Throws every change away and goes back to the sample tickets.
export function resetToSampleTickets(): Ticket[] {
  saveAllTickets(sampleTickets)
  return sampleTickets
}
