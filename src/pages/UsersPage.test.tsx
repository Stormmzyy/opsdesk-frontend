import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { users } from '../data/users.ts'
import { server } from '../mocks/server.ts'
import AppRoutes from '../routes/AppRoutes.tsx'
import { renderWithProviders } from '../test/renderWithProviders.tsx'

// The Users page for each way GET /users can end. The page stays routable for
// every role on purpose: hiding the link would be the same convenience as
// hiding a button, and the page would still have to handle the refusal (a
// role changed since sign-in, or a typed URL). So each failure gets its own
// sentence, and only the ones that retrying could fix get a Retry button.
//
// The mock serves the list to anyone, so the server's refusal is staged here,
// as in TicketPermissions.test.tsx.

const ADMIN = users.find((candidate) => candidate.role === 'ADMIN')!
const AGENT = users.find((candidate) => candidate.role === 'AGENT')!

// The contract's one fixed 403 body.
const FORBIDDEN = { error: 'FORBIDDEN', message: "You don't have permission to do this." }

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Users page', () => {
  it('lists everyone for an ADMIN', async () => {
    renderWithProviders(<AppRoutes />, { route: '/users', signedInAs: ADMIN })
    expect(await screen.findByText(AGENT.name)).toBeInTheDocument()
  })

  it("tells an AGENT they don't have permission, not to check their connection, and offers no Retry", async () => {
    server.use(http.get('/api/v1/users', () => HttpResponse.json(FORBIDDEN, { status: 403 })))
    renderWithProviders(<AppRoutes />, { route: '/users', signedInAs: AGENT })

    expect(
      await screen.findByText("You don't have permission to see the user list."),
    ).toBeInTheDocument()
    expect(screen.queryByText(/check your connection/i)).not.toBeInTheDocument()
    // Asking again gets the same answer, so a Retry button would only invite
    // a pointless click.
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
  })

  it('blames the connection only when the request never reached the server', async () => {
    server.use(http.get('/api/v1/users', () => HttpResponse.error()))
    renderWithProviders(<AppRoutes />, { route: '/users', signedInAs: ADMIN })

    expect(
      await screen.findByText("Sorry, we couldn't load users. Check your connection."),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it("says the server had a problem when it answers 500, and doesn't blame the connection", async () => {
    server.use(
      http.get('/api/v1/users', () =>
        HttpResponse.json(
          { error: 'INTERNAL_ERROR', message: 'Something went wrong on our side.' },
          { status: 500 },
        ),
      ),
    )
    renderWithProviders(<AppRoutes />, { route: '/users', signedInAs: ADMIN })

    expect(
      await screen.findByText(
        "Sorry, we couldn't load users. The server had a problem, so try again in a moment.",
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/check your connection/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})
