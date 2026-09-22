import EmployeesPage from './pages/EmployeesPage.jsx'
import TicketsPage from './pages/TicketsPage.jsx'
import UserDirectory from './components/users/UserDirectory.jsx'

function App() {
  // Temporary stacked layout; a proper page layout comes later.
  return (
    <>
      <EmployeesPage />
      <TicketsPage />
      <UserDirectory />
    </>
  )
}

export default App
