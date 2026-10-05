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
