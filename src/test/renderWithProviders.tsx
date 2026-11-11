import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { makeStore } from '../store/store.ts'
import type { AppStore } from '../store/store.ts'
import type { User } from '../features/users/types.ts'

interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  // The URL the test starts on, e.g. '/tickets'. Defaults to '/'.
  route?: string
  // A store to use. Defaults to a brand new one, so no test can see what an
  // earlier test put in the store.
  store?: AppStore
  // Start signed in as this user, with a placeholder token. The signed-in
  // pages sit behind ProtectedRoute, which sends anyone without a token to
  // /login, so a test rendering AppRoutes needs this. The mock API doesn't
  // check the token, so its value doesn't matter.
  signedInAs?: User
}

// Renders a component the way the app does: inside a router (so <Link> and
// useParams work) and a Redux store (so the typed hooks and RTK Query work).
//
// MemoryRouter keeps the URL in memory instead of the address bar, which
// suits tests: there's no real browser address bar in Node.
//
// Returns everything Testing Library's render() returns, plus:
// - store: to check or change Redux state in a test,
// - user: a userEvent instance, which types and clicks the way a real person
//   does (focus, key presses, pointer events), not just by firing one event.
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', signedInAs, store: givenStore, ...renderOptions }: ProviderOptions = {},
) {
  const startingAuth = signedInAs
    ? { token: 'test-token', user: signedInAs, signOutReason: null }
    : undefined
  const store = givenStore ?? makeStore(startingAuth)

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    )
  }

  return {
    store,
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}
