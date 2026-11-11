import { screen } from '@testing-library/react'
import { users } from '../data/users.ts'
import { server } from '../mocks/server.ts'
import { getAllTickets, resetToSampleTickets, saveAllTickets } from '../mocks/ticketDb.ts'
import AppRoutes from '../routes/AppRoutes.tsx'
import { ticketsApi } from '../store/ticketsApi.ts'
import { renderWithProviders } from '../test/renderWithProviders.tsx'

// The Edit page sends only what the person changed (backend decision 71),
// compared with a snapshot taken when the form loaded. These check the
// REQUEST, because the bug they guard against (a stale field overwriting
// someone else's change) looks fine on screen.

const ADMIN = users.find((candidate) => candidate.role === 'ADMIN')!
// Ticket #1 in src/data/tickets.ts: OPEN.
const TITLE = 'Login page times out on slow networks'

// The body of every PATCH the server receives, and every request line.
let patchBodies: unknown[] = []
let requests: string[] = []

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  patchBodies = []
  requests = []
  server.events.on('request:start', async ({ request }) => {
    requests.push(`${request.method} ${new URL(request.url).pathname}`)
    if (request.method === 'PATCH') {
      patchBodies.push(await request.clone().json())
    }
  })
})
afterEach(() => {
  resetToSampleTickets()
  server.resetHandlers()
  server.events.removeAllListeners()
})
afterAll(() => server.close())

function renderEditPage() {
  return renderWithProviders(<AppRoutes />, { route: '/tickets/1/edit', signedInAs: ADMIN })
}

describe('EditTicketPage', () => {
  it('opens the form on a fresh answer from the server, not on the cached ticket', async () => {
    // The person reads ticket 1 first, so it's in RTK Query's cache.
    const { user } = renderWithProviders(<AppRoutes />, { route: '/tickets/1', signedInAs: ADMIN })
    expect(await screen.findByRole('heading', { level: 1, name: TITLE })).toBeInTheDocument()

    // Meanwhile someone else moves it on. Nothing tells this page.
    saveAllTickets(
      getAllTickets().map((ticket) =>
        ticket.id === 1 ? { ...ticket, status: 'IN_PROGRESS' } : ticket,
      ),
    )

    await user.click(screen.getByRole('link', { name: 'Edit' }))

    // The form shows the server's current status. Mounted on the cached
    // copy, it would show Open, and its snapshot would be that stale copy.
    expect(await screen.findByRole('combobox', { name: 'Status' })).toHaveValue('IN_PROGRESS')
    // The ticket page's GET, then the edit page's own.
    expect(requests.filter((line) => line === 'GET /api/v1/tickets/1')).toHaveLength(2)
  })

  it('sends only the field that changed', async () => {
    const { user } = renderEditPage()
    const title = await screen.findByRole('textbox', { name: /title/i })

    await user.clear(title)
    await user.type(title, 'Login page times out on mobile data')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText('Changes to ticket #1 were saved.')).toBeInTheDocument()
    // Not the description, priority, team or status the form also holds.
    expect(patchBodies).toEqual([{ title: 'Login page times out on mobile data' }])
  })

  it('sends no request at all when nothing changed', async () => {
    const { user } = renderEditPage()
    await screen.findByRole('textbox', { name: /title/i })

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText('Ticket #1 had no changes to save.')).toBeInTheDocument()
    // Back on the ticket's own page, having sent nothing.
    expect(await screen.findByRole('heading', { level: 1, name: TITLE })).toBeInTheDocument()
    expect(requests.filter((line) => line.startsWith('PATCH'))).toEqual([])
  })

  it("compares with the snapshot, so a refetch can't make it revert someone else's change", async () => {
    const { user, store } = renderEditPage()
    const title = await screen.findByRole('textbox', { name: /title/i })

    // While the form is open, someone else moves the ticket on, and this
    // page's cache refetches it (as it would after any invalidation).
    saveAllTickets(
      getAllTickets().map((ticket) =>
        ticket.id === 1 ? { ...ticket, status: 'IN_PROGRESS' } : ticket,
      ),
    )
    store.dispatch(ticketsApi.util.invalidateTags([{ type: 'Ticket', id: 1 }]))
    await vi.waitFor(() =>
      expect(ticketsApi.endpoints.getTicket.select(1)(store.getState()).data?.status).toBe(
        'IN_PROGRESS',
      ),
    )

    // The person fixes only the title. Their form still shows OPEN.
    await user.type(title, '!')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    // Compared with the refetched ticket, OPEN would look like a change and
    // be sent, putting the other person's IN_PROGRESS back. Compared with
    // the snapshot, only the title goes.
    await vi.waitFor(() => expect(patchBodies).toEqual([{ title: `${TITLE}!` }]))
    expect(getAllTickets().find((ticket) => ticket.id === 1)?.status).toBe('IN_PROGRESS')
  })
})
