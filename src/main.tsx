import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { store } from './store/store.ts'
import { isMockApiEnabled } from './utils/mockApi.ts'

// getElementById returns null if the element is missing, so check before using it.
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Could not find the #root element in index.html')
}

// Starts the mock API (MSW), but only when asked to, and only in development.
// - VITE_USE_MOCK_API must be exactly "true" (see .env.example). Now that the
//   real backend exists, it's the default, and the mock is opt-in: for working
//   on the frontend without the backend running.
// - import.meta.env.DEV is true under `npm run dev` and false in a production
//   build, so the production app never intercepts requests.
// - The first check keeps MSW out of the production bundle altogether. In a
//   build, Vite replaces import.meta.env.DEV with the literal false, so this
//   line becomes "if (true) return" and the bundler can see that the import
//   below never runs, and drops it with everything it pulls in (404 kB).
//   isMockApiEnabled() returns false in a build too, but the bundler doesn't
//   look inside another module's function to find that out, so without this
//   line the mock was still emitted as a chunk (found in Week 8). The service
//   worker file is removed from the build by vite.config.ts.
// - "bypass" lets requests we have no handler for (such as Vite's own files)
//   go through untouched.
async function enableMocking() {
  if (!import.meta.env.DEV) {
    return
  }
  if (!isMockApiEnabled()) {
    return
  }
  const { worker } = await import('./mocks/browser.ts')
  await worker.start({ onUnhandledFrame: 'bypass' })
}

// Wait for the mock API to be ready BEFORE rendering. Otherwise the first
// request for tickets could leave before the service worker is listening,
// and would fail.
await enableMocking()

// Provider makes the Redux store available to every component inside it,
// so any of them can read shared UI state or dispatch actions.
// BrowserRouter keeps the UI in sync with the URL in the address bar,
// so every component inside App can use routes, links and URL params.
createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
