import { useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import AppRoutes from './routes/AppRoutes.tsx'

// The tickets used to live here in a useTickets hook and be passed down to
// every page. Now each page asks RTK Query for them (see store/ticketsApi.ts),
// and RTK Query's shared cache keeps every page in step.
function App() {
  // A unique id for every navigation, even to the same path again, so
  // "Go to the dashboard" clears the error even when the dashboard crashed.
  const { key: locationKey } = useLocation()

  // The outer error boundary: a safety net in case the Layout itself (the
  // sidebar, notifications, or the frame around pages) throws. The inner
  // boundary in Layout can't catch that, because a boundary only catches
  // errors in the components INSIDE it, never in its own parents.
  // Most crashes are caught by the inner one first, so this rarely shows.
  // fullPage gives the fallback its own <main>, since the Layout is gone.
  return (
    <ErrorBoundary resetKey={locationKey} fullPage>
      <AppRoutes />
    </ErrorBoundary>
  )
}

export default App
