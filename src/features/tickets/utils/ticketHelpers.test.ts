import type { Ticket } from '../types.ts'
import { filterTickets, parseTicketId } from './ticketHelpers.ts'

// Three small tickets, each built to test one thing.
const tickets: Ticket[] = [
  {
    id: 1,
    title: 'Login page times out',
    description: 'Happens on slow Wi-Fi.',
    priority: 'URGENT',
    status: 'OPEN',
    team: 'Engineering',
  },
  {
    id: 2,
    title: 'Order new laptops',
    description: 'For the March starters.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    team: 'Operations',
  },
  {
    id: 3,
    title: 'Fix the office wifi router',
    description: 'It restarts every hour.',
    priority: 'HIGH',
    status: 'RESOLVED',
    team: 'Operations',
  },
]

// These are plain functions (no React), so they can be tested directly:
// call them with some input and check the output.
function ids(list: Ticket[]): number[] {
  return list.map((ticket) => ticket.id)
}

describe('filterTickets', () => {
  it('returns every ticket for an empty search and "ALL" statuses', () => {
    expect(ids(filterTickets(tickets, '', 'ALL'))).toEqual([1, 2, 3])
  })

  it('searches descriptions as well as titles, ignoring upper and lower case', () => {
    // Ticket 1 only mentions it in its description ("Wi-Fi"), ticket 3 in its
    // title ("wifi"), so "WI" must match both, whatever the case.
    expect(ids(filterTickets(tickets, 'WI', 'ALL'))).toEqual([1, 3])
  })

  it('ignores spaces around the search text', () => {
    expect(ids(filterTickets(tickets, '  laptops  ', 'ALL'))).toEqual([2])
  })

  it('combines the search with the status filter', () => {
    // Both 1 and 3 match "wi", but only 3 is RESOLVED.
    expect(ids(filterTickets(tickets, 'wi', 'RESOLVED'))).toEqual([3])
  })
})

describe('parseTicketId', () => {
  it('turns a whole-number URL param into a number', () => {
    expect(parseTicketId('3')).toBe(3)
    expect(parseTicketId('120')).toBe(120)
  })

  // it.each runs the same test once per value in the list.
  it.each(['abc', '3.5', '-1', '', ' 3', '3abc'])('rejects %j', (param) => {
    expect(parseTicketId(param)).toBeUndefined()
  })

  it('rejects a missing param', () => {
    expect(parseTicketId(undefined)).toBeUndefined()
  })
})
