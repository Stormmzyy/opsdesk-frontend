import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test/renderWithProviders.tsx'
import ErrorBoundary from './ErrorBoundary.tsx'

// A component that always crashes while rendering, the kind of error an
// error boundary exists to catch. Its return type is `never` because it
// never returns: it always throws.
function BrokenComponent(): never {
  throw new Error('Deliberate test crash')
}

describe('ErrorBoundary', () => {
  it('shows the fallback instead of a component that crashes', () => {
    // When a component throws, React (and our componentDidCatch) log the
    // error with console.error. Here that's expected, so silence it for
    // THIS test only, to keep the test output readable. mockImplementation
    // replaces console.error with a function that does nothing; the spy
    // still records the calls, so we can check them below.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      // renderWithProviders adds a router, which the fallback's
      // "Go to the dashboard" link needs.
      renderWithProviders(
        <ErrorBoundary>
          <BrokenComponent />
        </ErrorBoundary>,
      )

      expect(
        screen.getByRole('heading', { level: 1, name: /something went wrong/i }),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /go to the dashboard/i })).toHaveAttribute(
        'href',
        '/dashboard',
      )
      // The raw error message is for developers, never shown to users...
      expect(screen.queryByText(/deliberate test crash/i)).not.toBeInTheDocument()
      // ...but it was logged, so a developer can find it.
      expect(consoleError).toHaveBeenCalled()
    } finally {
      // Put the real console.error back, even if an expect above failed,
      // so other tests still show their errors.
      consoleError.mockRestore()
    }
  })
})
