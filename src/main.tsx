import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// getElementById returns null if the element is missing, so check before using it.
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Could not find the #root element in index.html')
}

// BrowserRouter keeps the UI in sync with the URL in the address bar,
// so every component inside App can use routes, links and URL params.
createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
