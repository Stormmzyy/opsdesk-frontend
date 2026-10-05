import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { store } from './store/store.ts'

// getElementById returns null if the element is missing, so check before using it.
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Could not find the #root element in index.html')
}

// Starts the mock API (MSW) in development only.
// - import.meta.env.DEV is true under `npm run dev` and false in a production
//   build, so the production app never intercepts requests.
// - The import is dynamic (inside the function), so MSW isn't even included
//   in the production bundle.
// - "bypass" lets requests we have no handler for (Vite's own files, the
//   real JSONPlaceholder API on the Users page) go through untouched.
async function enableMocking() {
  if (!import.meta.env.DEV) {
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
