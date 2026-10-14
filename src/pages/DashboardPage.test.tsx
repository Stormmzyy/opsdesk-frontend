import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server.ts'
import { renderWithProviders } from '../test/renderWithProviders.tsx'
import DashboardPage from './DashboardPage.tsx'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('DashboardPage', () => {
  it('shows the tickets error once for the whole page, not once per section', async () => {
    server.use(
      http.get('/api/v1/tickets', () =>
        HttpResponse.json(
          { error: 'INTERNAL_ERROR', message: 'Something went wrong on the server.' },
          { status: 500 },
        ),
      ),
    )
    renderWithProviders(<DashboardPage />, { route: '/dashboard' })

    // Wait for the error, then check there's exactly ONE alert (so a screen
    // reader announces it once) and one Retry button.
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load the tickets/i)
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: /retry/i })).toHaveLength(1)
    // People come from local data, so that section still shows.
    expect(screen.getByRole('heading', { level: 2, name: /people/i })).toBeInTheDocument()
  })
})
