import AppRoutes from './routes/AppRoutes.tsx'

// The tickets used to live here in a useTickets hook and be passed down to
// every page. Now each page asks RTK Query for them (see store/ticketsApi.ts),
// and RTK Query's shared cache keeps every page in step.
function App() {
  return <AppRoutes />
}

export default App
