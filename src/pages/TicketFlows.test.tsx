import { screen, within } from '@testing-library/react'
import { server } from '../mocks/server.ts'
import { getAllTickets, resetToSampleTickets } from '../mocks/ticketDb.ts'
import AppRoutes from '../routes/AppRoutes.tsx'
import { renderWithProviders } from '../test/renderWithProviders.tsx'

// Whole user journeys, through the REAL app: the routes, the Layout (so the
// toasts are there too), RTK Query and the mock API handlers. Only the
// network is fake. The tests act like a person would: find things by their
// role and label, type, click, then check what's on screen.

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetToSampleTickets()
  server.resetHandlers()
  // Stop any request listeners a test added (see the delete test).
  server.events.removeAllListeners()
})
afterAll(() => server.close())

describe('ticket flows', () => {
  it('creates a ticket and shows it on its own page and in the list', async () => {
    const title = 'Printer on the second floor is jammed'
    const { user } = renderWithProviders(<AppRoutes />, { route: '/tickets/new' })

    // Fields are found by their labels, which also proves they're labelled.
    await user.type(screen.getByRole('textbox', { name: /title/i }), title)
    await user.type(
      screen.getByRole('textbox', { name: /description/i }),
      'It shows error E-42 and nothing prints.',
    )
    await user.selectOptions(screen.getByRole('combobox', { name: /priority/i }), 'HIGH')
    await user.click(screen.getByRole('button', { name: /create ticket/i }))

    // The app goes to the new ticket's page: its title is the page's <h1>.
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    // The success toast (the sample data has 12 tickets, so this is #13).
    expect(screen.getByText(/ticket #13 was created/i)).toBeInTheDocument()

    // And it's really saved: back on the list, a search finds it.
    await user.click(screen.getByRole('link', { name: /back to tickets/i }))
    await user.type(await screen.findByRole('searchbox', { name: /search tickets/i }), 'printer')
    expect(await screen.findByRole('link', { name: title })).toBeInTheDocument()
  })

  it('does nothing on Cancel, and deletes the ticket after confirming', async () => {
    // Ticket #1 in src/data/tickets.ts.
    const title = 'Login page times out on slow networks'
    const { user } = renderWithProviders(<AppRoutes />, { route: '/tickets/1' })

    // Note the method of every request the mock server receives, so we can
    // check that Cancel never even SENDS a delete. Checking the screen alone
    // isn't enough: a delete still on its way wouldn't have changed it yet.
    const requestMethods: string[] = []
    server.events.on('request:start', ({ request }) => {
      requestMethods.push(request.method)
    })

    // The Delete button lives in its own "Delete this ticket" section. Looking
    // inside it tells it apart from the dialog's own "Delete ticket" button.
    const deleteSection = await screen.findByRole('region', { name: /delete this ticket/i })
    const deleteButton = within(deleteSection).getByRole('button', { name: /delete ticket/i })

    // 1. Open the dialog, then Cancel.
    await user.click(deleteButton)
    const dialog = screen.getByRole('dialog', { name: /delete ticket #1\?/i })
    expect(dialog).toHaveAttribute('open')
    // Its description (aria-describedby) says what will happen.
    expect(dialog).toHaveAccessibleDescription(/permanently deleted/i)

    await user.click(within(dialog).getByRole('button', { name: /cancel/i }))

    // Cancel closed the dialog, put focus back on the button that opened it,
    // and changed nothing: the ticket is still on screen and in the database.
    expect(dialog).not.toHaveAttribute('open')
    expect(requestMethods).not.toContain('DELETE')
    expect(deleteButton).toHaveFocus()
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    expect(getAllTickets().some((ticket) => ticket.id === 1)).toBe(true)

    // 2. Open it again, and confirm this time.
    await user.click(deleteButton)
    await user.click(within(dialog).getByRole('button', { name: /delete ticket/i }))

    // This time a DELETE was sent.
    expect(requestMethods).toContain('DELETE')
    // The app goes back to the Tickets page and shows a success toast.
    expect(await screen.findByRole('heading', { level: 1, name: 'Tickets' })).toBeInTheDocument()
    expect(screen.getByText(/ticket #1 was deleted/i)).toBeInTheDocument()
    // The ticket is gone from the database and, once the list has loaded,
    // from the list too (11 tickets left of the 12).
    expect(getAllTickets().some((ticket) => ticket.id === 1)).toBe(false)
    expect(await screen.findByText(/of 11 tickets/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: title })).not.toBeInTheDocument()
  })
})
