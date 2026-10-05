import { screen, within } from '@testing-library/react'
import { server } from '../mocks/server.ts'
import { resetToSampleTickets } from '../mocks/ticketDb.ts'
import { renderWithProviders } from '../test/renderWithProviders.tsx'
import TicketsPage from './TicketsPage.tsx'

// An integration test: the real TicketsPage, the real RTK Query api slice,
// and the real mock API handlers (running in Node through MSW). Only the
// network is fake, so this checks that all the pieces work together.

// Start the mock API before the tests and stop it afterwards.
// onUnhandledFrame: 'error' makes any request WITHOUT a handler fail loudly,
// so a typo in a URL can't silently pass.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
// After each test, put the mock database back to the sample tickets, so
// one test's changes can't leak into the next.
afterEach(() => resetToSampleTickets())
afterAll(() => server.close())

// Ticket #1 in src/data/tickets.ts, which starts as OPEN.
const TITLE = 'Login page times out on slow networks'

describe('TicketsPage', () => {
  it('moves a ticket on the board and the list refreshes by itself', async () => {
    const { user } = renderWithProviders(<TicketsPage />, { route: '/tickets' })

    // findBy... waits for the tickets to arrive from the mock API.
    await user.click(await screen.findByRole('button', { name: 'Board' }))

    // Each board column is a <section> labelled by its heading, which gives
    // it the "region" role, so we can look inside one column at a time.
    const openColumn = screen.getByRole('region', { name: 'Open' })
    const inProgressColumn = screen.getByRole('region', { name: 'In progress' })
    expect(within(openColumn).getByRole('link', { name: TITLE })).toBeInTheDocument()
    expect(within(inProgressColumn).queryByRole('link', { name: TITLE })).not.toBeInTheDocument()

    // Find THIS ticket's move button. Every card has one, so we pick it by
    // its description, which is the ticket title (see TicketCard).
    await user.click(
      within(openColumn).getByRole('button', { name: /move to in progress/i, description: TITLE }),
    )

    // Nothing in the page refetches by hand. The PATCH succeeds, its
    // invalidatesTags marks this ticket stale, RTK Query refetches the list,
    // and the card re-renders in its new column. findBy... waits for that.
    expect(await within(inProgressColumn).findByRole('link', { name: TITLE })).toBeInTheDocument()
    expect(within(openColumn).queryByRole('link', { name: TITLE })).not.toBeInTheDocument()
  })
})
