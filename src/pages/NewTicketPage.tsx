import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TicketFormValues } from '../features/tickets/types.ts'
import { employees } from '../data/employees.ts'
import { getDepartments } from '../features/employees/utils/employeeHelpers.ts'
import PageHeader from '../components/PageHeader.tsx'
import TicketForm from '../features/tickets/components/TicketForm.tsx'
import { describeTicketChangeFailure, readApiError } from '../store/apiError.ts'
import { useAppDispatch } from '../store/hooks.ts'
import { useAddTicketMutation } from '../store/ticketsApi.ts'
import { addNotification } from '../store/uiSlice.ts'

// The starting values for a brand new ticket: empty text, medium priority,
// and the first team in the list.
const EMPTY_TICKET: TicketFormValues = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  team: getDepartments(employees)[0],
}

function NewTicketPage() {
  // useNavigate gives us a function that changes the URL from code,
  // for example after a form is saved.
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  // isLoading is true while the new ticket is being sent.
  const [addTicket, { isLoading: isCreating }] = useAddTicketMutation()
  // The server's per-field messages from a refused submit (a 400
  // VALIDATION_ERROR), shown by the form under the right fields.
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})

  // Sends the new ticket (POST). The server picks its id and sends the saved
  // ticket back, so we can go straight to its page. unwrap() throws if the
  // request fails, so we only navigate when it worked.
  async function handleCreate(values: TicketFormValues) {
    setServerErrors({})
    try {
      const newTicket = await addTicket(values).unwrap()
      // Layout shows the notification, so it's still there on the next page.
      dispatch(
        addNotification({ message: `Ticket #${newTicket.id} was created.`, type: 'success' }),
      )
      navigate(`/tickets/${newTicket.id}`)
    } catch (error) {
      // Stay on the form, so nothing the user typed is lost. Field problems
      // go under their fields (no toast: the form shows them); anything
      // else is a toast.
      const apiError = readApiError(error)
      if (apiError?.error === 'VALIDATION_ERROR') {
        setServerErrors(apiError.fields)
        return
      }
      dispatch(
        addNotification({
          message: describeTicketChangeFailure(error, "The ticket wasn't created"),
          type: 'error',
        }),
      )
    }
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
        isSubmitting={isCreating}
        serverErrors={serverErrors}
      />
    </>
  )
}

export default NewTicketPage
