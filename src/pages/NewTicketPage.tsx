import { useNavigate } from 'react-router-dom'
import type { TicketFormValues } from '../types.ts'
import { employees } from '../data/employees.ts'
import { getDepartments } from '../utils/employeeHelpers.ts'
import PageHeader from '../components/PageHeader.tsx'
import TicketForm from '../features/tickets/components/TicketForm.tsx'

// The starting values for a brand new ticket: empty text, medium priority,
// and the first team in the list.
const EMPTY_TICKET: TicketFormValues = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  team: getDepartments(employees)[0],
}

interface NewTicketPageProps {
  // Adds the ticket and returns its new id.
  onCreateTicket: (values: TicketFormValues) => number
}

function NewTicketPage({ onCreateTicket }: NewTicketPageProps) {
  // useNavigate gives us a function that changes the URL from code,
  // for example after a form is saved.
  const navigate = useNavigate()

  function handleCreate(values: TicketFormValues) {
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
