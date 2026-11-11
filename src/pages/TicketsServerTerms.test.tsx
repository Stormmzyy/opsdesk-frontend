import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { users } from '../data/users.ts'
import { server } from '../mocks/server.ts'
import { resetToSampleTickets } from '../mocks/ticketDb.ts'
import AppRoutes from '../routes/AppRoutes.tsx'
import { renderWithProviders } from '../test/renderWithProviders.tsx'

// The Tickets list on the server's terms: what the page ASKS for (the query
// parameters it sends), and what it does with the server's answers,
// including the 400s that name a parameter rather than a form field.

const ADMIN = users.find((candidate) => candidate.role === 'ADMIN')!

// The query string of every GET /tickets the server receives, as an object.
let listQueries: Record<string, string>[] = []

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  listQueries = []
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/api/v1/tickets') {
      listQueries.push(Object.fromEntries(url.searchParams))
    }
  })
})
afterEach(() => {
  resetToSampleTickets()
  server.resetHandlers()
  server.events.removeAllListeners()
})
afterAll(() => server.close())

function renderTickets() {
  return renderWithProviders(<AppRoutes />, { route: '/tickets', signedInAs: ADMIN })
}

describe('the ticket list asks the server', () => {
  it("sends exactly the chosen filters and sort, in the server's spelling", async () => {
    const { user } = renderTickets()
    expect(await screen.findByText('Showing 1 to 10 of 12 tickets')).toBeInTheDocument()
    // The first page, counting from 1, in the server's default order.
    expect(listQueries[0]).toEqual({ page: '1', size: '10', sort: 'id,asc' })

    await user.selectOptions(screen.getByLabelText('Priority'), 'HIGH')
    await user.selectOptions(screen.getByLabelText('Sort by'), 'title,desc')

    // Uppercase enum, lowercase direction, and NO status or search: a filter
    // that isn't set is left out, never sent empty.
    await vi.waitFor(() =>
      expect(listQueries.at(-1)).toEqual({
        page: '1',
        size: '10',
        sort: 'title,desc',
        priority: 'HIGH',
      }),
    )
  })

  it("pages from 1, and the summary comes from the server's totals", async () => {
    const { user } = renderTickets()
    expect(await screen.findByText('Showing 1 to 10 of 12 tickets')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    // Page 2 of 12 at 10 a page: tickets 11 and 12, not an empty page and
    // not page 1 again (the two ways an off-by-one shows up).
    expect(await screen.findByText('Showing 11 to 12 of 12 tickets')).toBeInTheDocument()
    expect(listQueries.at(-1)).toEqual({ page: '2', size: '10', sort: 'id,asc' })
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
  })
})

describe('a 400 for the query string', () => {
  it('lists a parameter with no control by name, so it does not vanish', async () => {
    const message = 'There is no query parameter called "stauts".'
    server.use(
      http.get('/api/v1/tickets', () =>
        HttpResponse.json(
          { error: 'VALIDATION_ERROR', message, fields: { stauts: message } },
          { status: 400 },
        ),
      ),
    )
    renderTickets()

    expect(await screen.findByText(/the server didn't accept this search/i)).toHaveTextContent(
      `stauts: ${message}`,
    )
  })

  it('shows a parameter that has a control under that control', async () => {
    const message = 'Status must be one of OPEN, IN_PROGRESS, RESOLVED or CLOSED.'
    server.use(
      http.get('/api/v1/tickets', () =>
        HttpResponse.json(
          { error: 'VALIDATION_ERROR', message, fields: { status: message } },
          { status: 400 },
        ),
      ),
    )
    renderTickets()

    const statusFilter = await screen.findByLabelText('Status')
    await vi.waitFor(() => expect(statusFilter).toHaveAccessibleDescription(message))
    expect(statusFilter).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('a 400 for a ticket form', () => {
  it('puts each message under its field, lists the ones without a field, and shows no toast', async () => {
    const titleMessage = 'Title must be at least 3 characters.'
    const teamMessage = 'Team must be one of Engineering, Finance, HR, Operations or Support.'
    server.use(
      http.patch('/api/v1/tickets/:id', () =>
        HttpResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: `${titleMessage} ${teamMessage}`,
            fields: { title: titleMessage, team: teamMessage },
          },
          { status: 400 },
        ),
      ),
    )
    const { user } = renderWithProviders(<AppRoutes />, {
      route: '/tickets/1/edit',
      signedInAs: ADMIN,
    })
    // Change something: a save with no changes sends no request at all.
    await user.type(await screen.findByRole('textbox', { name: /title/i }), '!')

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    // Title has its own slot: the message is the field's description.
    await vi.waitFor(() =>
      expect(screen.getByRole('textbox', { name: /title/i })).toHaveAccessibleDescription(
        titleMessage,
      ),
    )
    // The team dropdown has no message slot, so it's listed by name.
    expect(
      screen.getByText(/the server didn't accept these values/i).parentElement,
    ).toHaveTextContent(`team: ${teamMessage}`)
    // Field problems are shown on the form, not as a toast.
    expect(screen.queryByText(/wasn't saved/i)).not.toBeInTheDocument()
  })
})
