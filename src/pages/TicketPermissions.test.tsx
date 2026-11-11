import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { users } from '../data/users.ts'
import { server } from '../mocks/server.ts'
import { getAllTickets, resetToSampleTickets } from '../mocks/ticketDb.ts'
import AppRoutes from '../routes/AppRoutes.tsx'
import { renderWithProviders } from '../test/renderWithProviders.tsx'

// What each role is OFFERED, and what a refusal looks like when it comes
// anyway. Offering is convenience; the server is what refuses (README,
// "Hiding a button is not security").

const ADMIN = users.find((candidate) => candidate.role === 'ADMIN')!
const AGENT = users.find((candidate) => candidate.role === 'AGENT')!
const MANAGER = users.find((candidate) => candidate.role === 'MANAGER')!
const DANIEL = users.find((candidate) => candidate.name === 'Daniel Mensah')!

// The contract's one fixed 403 body.
const FORBIDDEN = { error: 'FORBIDDEN', message: "You don't have permission to do this." }

let requests: string[] = []

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  requests = []
  server.events.on('request:start', ({ request }) => {
    requests.push(`${request.method} ${new URL(request.url).pathname}`)
  })
})
afterEach(() => {
  resetToSampleTickets()
  server.resetHandlers()
  server.events.removeAllListeners()
})
afterAll(() => server.close())

describe('role-aware ticket page', () => {
  it('offers Delete to an ADMIN and not to an AGENT', async () => {
    const asAgent = renderWithProviders(<AppRoutes />, { route: '/tickets/1', signedInAs: AGENT })
    // Wait for the loaded ticket, not the loading heading ("Ticket #1"), so
    // the check below runs against the finished page.
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Login page times out on slow networks' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /delete this ticket/i })).not.toBeInTheDocument()
    // hidden: true also counts what isn't on screen, such as the closed
    // confirmation dialog's own "Delete ticket" button.
    expect(
      screen.queryByRole('button', { name: /delete ticket/i, hidden: true }),
    ).not.toBeInTheDocument()
    asAgent.unmount()

    renderWithProviders(<AppRoutes />, { route: '/tickets/1', signedInAs: ADMIN })
    expect(await screen.findByRole('region', { name: /delete this ticket/i })).toBeInTheDocument()
  })

  it('explains a 403 on save, keeps the form, and fetches the ticket again', async () => {
    // The AGENT opened the form; meanwhile the ticket was reassigned, so the
    // server refuses the save. The mock doesn't know about assignment yet
    // (Part 6), so the refusal is staged here.
    server.use(
      http.patch('/api/v1/tickets/:id', () => HttpResponse.json(FORBIDDEN, { status: 403 })),
    )
    const { user } = renderWithProviders(<AppRoutes />, {
      route: '/tickets/1/edit',
      signedInAs: AGENT,
    })
    const title = await screen.findByRole('textbox', { name: /title/i })
    await user.type(title, ' (checked)')
    const requestsBeforeSave = requests.length

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(
      await screen.findByText(/ticket #1 wasn't saved: you don't have permission to make this change/i),
    ).toBeInTheDocument()
    // Still on the form, with what they typed.
    expect(screen.getByRole('heading', { level: 1, name: 'Edit ticket' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue(
      'Login page times out on slow networks (checked)',
    )
    // The refused PATCH, then the ticket fetched again, so the app catches
    // up with whatever changed. This GET is what lets the message say the
    // ticket "now shows where it stands" (see updateTicket in ticketsApi.ts).
    await vi.waitFor(() =>
      expect(requests.slice(requestsBeforeSave)).toEqual([
        'PATCH /api/v1/tickets/1',
        'GET /api/v1/tickets/1',
      ]),
    )
  })
})

// The mock serves both assignee endpoints. Two tests below still stage the
// server's answer, because the mock can't produce it: a 400 for a USER (the
// picker never offers one, so that test stands for the client's copy of the
// rule falling behind the server's), and a 403 (the mock has no signed-in
// user to refuse).

describe('assigning a ticket', () => {
  it('shows an AGENT who has the ticket, but no controls and no request for the user list', async () => {
    renderWithProviders(<AppRoutes />, { route: '/tickets/1', signedInAs: AGENT })

    expect(await screen.findByText('Assigned to')).toBeInTheDocument()
    expect(screen.getByText('Nobody yet')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /assignment/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /assign to/i })).not.toBeInTheDocument()
    // GET /users is ADMIN and MANAGER only: it isn't even asked for.
    expect(requests).not.toContain('GET /api/v1/users')
  })

  it('lets a MANAGER assign to anyone but a USER, then unassign', async () => {
    // Through the mock's own assignee endpoints; only the body is recorded.
    let sentBody: unknown
    server.events.on('request:start', async ({ request }) => {
      if (request.method === 'PATCH' && request.url.endsWith('/assignee')) {
        sentBody = await request.clone().json()
      }
    })
    const { user } = renderWithProviders(<AppRoutes />, { route: '/tickets/1', signedInAs: MANAGER })

    const picker = await screen.findByRole('combobox', { name: /assign to/i })
    // Everyone from GET /users except the one USER (Fatima): the client's
    // copy of the server's rule (permissions.ts, canBeAssigned).
    const offered = within(picker)
      .getAllByRole('option')
      .filter((option) => !(option as HTMLOptionElement).disabled)
      .map((option) => option.textContent)
    expect(offered).toEqual(
      users.filter((candidate) => candidate.role !== 'USER').map((candidate) => candidate.name),
    )
    expect(offered).not.toContain('Fatima Bello')

    await user.selectOptions(picker, String(DANIEL.id))
    await user.click(screen.getByRole('button', { name: 'Assign' }))

    expect(await screen.findByText('Ticket #1 is now assigned to Daniel Mensah.')).toBeInTheDocument()
    // Exactly the one field the endpoint takes, nothing else.
    expect(sentBody).toEqual({ assigneeId: DANIEL.id })

    await user.click(await screen.findByRole('button', { name: 'Unassign' }))
    expect(await screen.findByText('Ticket #1 is no longer assigned to anyone.')).toBeInTheDocument()
    expect(requests).toContain('DELETE /api/v1/tickets/1/assignee')
    expect(getAllTickets().find((ticket) => ticket.id === 1)?.assigneeId).toBeNull()
  })

  it("shows the server's 400 under the picker, linked to it", async () => {
    // As if the picker's copy of the rule had fallen behind the server's.
    const message = "A USER can't be assigned tickets."
    server.use(
      http.patch('/api/v1/tickets/:id/assignee', () =>
        HttpResponse.json(
          { error: 'VALIDATION_ERROR', message, fields: { assigneeId: message } },
          { status: 400 },
        ),
      ),
    )
    const { user } = renderWithProviders(<AppRoutes />, { route: '/tickets/1', signedInAs: MANAGER })

    const picker = await screen.findByRole('combobox', { name: /assign to/i })
    await user.selectOptions(picker, String(DANIEL.id))
    await user.click(screen.getByRole('button', { name: 'Assign' }))

    expect(await screen.findByText(message, { selector: '.ticket-assignment__error' })).toBeInTheDocument()
    expect(picker).toHaveAttribute('aria-invalid', 'true')
    expect(picker).toHaveAccessibleDescription(message)
  })

  it('explains a 403 on assign and fetches the ticket again', async () => {
    // The MANAGER was demoted while the page was open.
    server.use(
      http.patch('/api/v1/tickets/:id/assignee', () => HttpResponse.json(FORBIDDEN, { status: 403 })),
    )
    const { user } = renderWithProviders(<AppRoutes />, { route: '/tickets/1', signedInAs: MANAGER })

    const picker = await screen.findByRole('combobox', { name: /assign to/i })
    await user.selectOptions(picker, String(DANIEL.id))
    const requestsBeforeAssign = requests.length
    await user.click(screen.getByRole('button', { name: 'Assign' }))

    expect(
      await screen.findByText(/ticket #1 wasn't assigned: you don't have permission to make this change/i),
    ).toBeInTheDocument()
    await vi.waitFor(() =>
      expect(requests.slice(requestsBeforeAssign)).toEqual([
        'PATCH /api/v1/tickets/1/assignee',
        'GET /api/v1/tickets/1',
      ]),
    )
  })
})
