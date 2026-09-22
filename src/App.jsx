import EmployeeDirectory from './components/employees/EmployeeDirectory.jsx'
import TicketBoard from './components/TicketBoard.jsx'
import UserDirectory from './components/UserDirectory.jsx'

function App() {
  // Temporary stacked layout; a proper page layout comes later.
  return (
    <>
      <EmployeeDirectory />
      <TicketBoard />
      <UserDirectory />
    </>
  )
}

export default App
