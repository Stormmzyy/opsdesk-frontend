import { useTickets } from './features/tickets/hooks/useTickets.ts'
import AppRoutes from './routes/AppRoutes.tsx'

function App() {
  // The tickets live here, at the top, so every page sees the same
  // up-to-date list and changes aren't lost when you switch pages.
  const ticketStore = useTickets()

  return <AppRoutes ticketStore={ticketStore} />
}

export default App
