import { useNavigate } from 'react-router-dom'
import { employees } from '../data/employees.ts'
import { getDepartments } from '../utils/employeeHelpers.ts'
import PageHeader from '../components/common/PageHeader.jsx'
import TicketForm from '../components/tickets/TicketForm.jsx'

// The starting values for a brand new ticket: empty text, medium priority,
// and the first team in the list.
const EMPTY_TICKET = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  team: getDepartments(employees)[0],
}

function NewTicketPage({ onCreateTicket }) {
  // useNavigate gives us a function that changes the URL from code,
  // for example after a form is saved.
  const navigate = useNavigate()

  function handleCreate(values) {
    const newId = onCreateTicket(values)
    navigate(`/tickets/${newId}`)
  }

  return (
    <>
      <PageHeader
        title="New ticket"
        description="Describe the problem so the right team can pick it up."
      />
      <TicketForm
        initialValues={EMPTY_TICKET}
        onSubmit={handleCreate}
        submitLabel="Create ticket"
        onCancel={() => navigate('/tickets')}
      />
    </>
  )
}

export default NewTicketPage
