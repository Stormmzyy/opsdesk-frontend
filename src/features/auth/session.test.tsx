import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { users } from '../../data/users.ts'
import { server } from '../../mocks/server.ts'
import AppRoutes from '../../routes/AppRoutes.tsx'
import { makeStore } from '../../store/store.ts'
import { renderWithProviders } from '../../test/renderWithProviders.tsx'

// How a session ends, and what must NOT happen when it does. These go
// through the real app (routes, ProtectedRoute, the base query in api.ts),
// with only the network faked.
//
// Several of them check which requests were SENT, not just what's on screen
// at the end: the bugs they guard against end on the right screen, having
// sent a request they shouldn't have on the way.

const TOKEN_KEY = 'opsdesk.token'

// The contract's 401 bodies.
const NO_VALID_TOKEN = {
  error: 'UNAUTHORIZED',
  message: 'You need to log in first. Send your token as "Authorization: Bearer <token>".',
}
const WRONG_PASSWORD = { error: 'UNAUTHORIZED', message: 'The email or password is incorrect.' }

const ADMIN = users.find((candidate) => candidate.role === 'ADMIN')!

// Every request the mock server receives, as "METHOD /path".
let requests: string[] = []

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  requests = []
  server.events.on('request:start', ({ request }) => {
    requests.push(`${request.method} ${new URL(request.url).pathname}`)
  })
})
afterEach(() => {
  server.resetHandlers()
  server.events.removeAllListeners()
  window.localStorage.clear()
})
afterAll(() => server.close())

describe('ending a session', () => {
  it('sends no ticket request when /auth/me rejects a stored token', async () => {
    // A token from an earlier visit, which the server no longer accepts.
    server.use(http.get('/api/v1/auth/me', () => HttpResponse.json(NO_VALID_TOKEN, { status: 401 })))
    const store = makeStore({ token: 'stale-token', user: null, signOutReason: null })

    renderWithProviders(<AppRoutes />, { route: '/dashboard', store })

    expect(await screen.findByText(/your session expired/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /sign in/i })).toBeInTheDocument()
    expect(requests).toEqual(['GET /api/v1/auth/me'])
    // The bug this guards: after the 401 cleared the token, the dashboard
    // rendered for one render before the redirect, and sent this request.
    expect(requests).not.toContain('GET /api/v1/tickets')
  })

  it("shows a wrong password on the form, and doesn't treat it as an expired session", async () => {
    server.use(
      http.post('/api/v1/auth/login', () => HttpResponse.json(WRONG_PASSWORD, { status: 401 })),
    )
    // A leftover token in the store is the case where the exclusion in
    // api.ts matters: without it, the login's 401 would be taken as that
    // token being rejected, and the session "expired" from under the form.
    const store = makeStore({ token: 'leftover-token', user: null, signOutReason: null })
    const { user } = renderWithProviders(<AppRoutes />, { route: '/login', store })

    await user.type(screen.getByLabelText(/email/i), 'fatima.bello@opsdesk.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The email or password is incorrect.',
    )
    expect(screen.getByRole('heading', { level: 1, name: /sign in/i })).toBeInTheDocument()
    expect(screen.queryByText(/your session expired/i)).not.toBeInTheDocument()
    expect(store.getState().auth.signOutReason).toBeNull()
    // One attempt, one request: no redirect, no retry.
    expect(requests).toEqual(['POST /api/v1/auth/login'])
  })

  it('sends a signed-in person to sign in again when a request answers 401', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'test-token')
    // The token expires while they're using the app: the next request fails.
    server.use(http.get('/api/v1/tickets', () => HttpResponse.json(NO_VALID_TOKEN, { status: 401 })))
    const { store } = renderWithProviders(<AppRoutes />, { route: '/dashboard', signedInAs: ADMIN })

    expect(await screen.findByText(/your session expired/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /sign in/i })).toBeInTheDocument()
    expect(store.getState().auth).toEqual({ token: null, user: null, signOutReason: 'expired' })
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it("logs out: clears the session, the stored token and the previous person's cached data", async () => {
    window.localStorage.setItem(TOKEN_KEY, 'test-token')
    const { store, user } = renderWithProviders(<AppRoutes />, {
      route: '/dashboard',
      signedInAs: ADMIN,
    })
    // Wait until the dashboard's tickets have arrived and are in the cache.
    await vi.waitFor(() => expect(requests).toContain('GET /api/v1/tickets'))
    await vi.waitFor(() =>
      expect(Object.values(store.getState().api.queries).some((q) => q?.status === 'fulfilled')).toBe(
        true,
      ),
    )
    const requestsBeforeLogout = requests.length

    await user.click(screen.getByRole('button', { name: /log out/i }))

    expect(await screen.findByText("You've logged out.")).toBeInTheDocument()
    expect(store.getState().auth).toEqual({ token: null, user: null, signOutReason: 'signed-out' })
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull()
    // RTK Query's cache is empty: nothing of the previous person's is left
    // for the next one to see.
    expect(store.getState().api.queries).toEqual({})
    // And emptying it didn't make the pages still on screen fetch again.
    expect(requests.slice(requestsBeforeLogout)).toEqual([])
  })
})
