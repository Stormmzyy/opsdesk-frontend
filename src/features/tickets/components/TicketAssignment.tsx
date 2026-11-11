import { useState } from 'react'
import type { FormEvent } from 'react'
import StatusMessage from '../../../components/StatusMessage.tsx'
import { canBeAssigned } from '../../auth/permissions.ts'
import { describeTicketChangeFailure, readApiError } from '../../../store/apiError.ts'
import { useAppDispatch } from '../../../store/hooks.ts'
import { useAssignTicketMutation, useUnassignTicketMutation } from '../../../store/ticketsApi.ts'
import { addNotification } from '../../../store/uiSlice.ts'
import { useGetUsersQuery } from '../../../store/usersApi.ts'
import type { Ticket } from '../types.ts'
import './TicketAssignment.css'

interface TicketAssignmentProps {
  ticket: Ticket
}

// Who has the ticket, and the controls to change that. The ticket page only
// renders this for an ADMIN or MANAGER (canAssignTickets in permissions.ts),
// for convenience: the server refuses anyone else with a 403 whatever is on
// screen.
//
// The page gives it a key that changes with the ticket's version, so after
// any change (ours, or someone else's picked up by a refetch) it starts
// again from the ticket as it now is, instead of keeping a stale selection.
function TicketAssignment({ ticket }: TicketAssignmentProps) {
  const dispatch = useAppDispatch()
  // GET /users: ADMIN and MANAGER only, the same roles that see this
  // control, so this request is never sent for anyone it would refuse.
  const { data: users, isLoading, isError, error, refetch } = useGetUsersQuery()
  const [assignTicket, { isLoading: isAssigning }] = useAssignTicketMutation()
  const [unassignTicket, { isLoading: isUnassigning }] = useUnassignTicketMutation()

  // The <select>'s value is always a string; '' means "nobody chosen yet".
  const [selected, setSelected] = useState(ticket.assigneeId === null ? '' : String(ticket.assigneeId))
  // The server's message for assigneeId, from a 400 VALIDATION_ERROR.
  const [fieldError, setFieldError] = useState<string | null>(null)

  const isBusy = isAssigning || isUnassigning
  const pickerId = `assignee-${ticket.id}`
  const errorId = `${pickerId}-error`

  async function handleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldError(null)
    const assigneeId = Number(selected)
    try {
      const saved = await assignTicket({ id: ticket.id, assigneeId }).unwrap()
      dispatch(
        addNotification({
          message: `Ticket #${ticket.id} is now assigned to ${saved.assigneeName ?? 'nobody'}.`,
          type: 'success',
        }),
      )
    } catch (failure) {
      showFailure(failure, `Ticket #${ticket.id} wasn't assigned`)
    }
  }

  async function handleUnassign() {
    setFieldError(null)
    try {
      await unassignTicket(ticket.id).unwrap()
      dispatch(
        addNotification({ message: `Ticket #${ticket.id} is no longer assigned to anyone.`, type: 'success' }),
      )
    } catch (failure) {
      showFailure(failure, `Ticket #${ticket.id} wasn't unassigned`)
    }
  }

  // Every refusal is a real answer, shown where it belongs:
  // - 400 VALIDATION_ERROR on assigneeId (for example "A USER can't be
  //   assigned tickets." if the picker's copy of the rule ever falls behind
  //   the server's, or "No user with id 9." for someone deleted meanwhile):
  //   under the picker, as the field's own error.
  // - Anything else (a 403 because the person's role changed, a 404 because
  //   the ticket went, the network): the same explanation as every other
  //   failed ticket change, as a notification.
  function showFailure(failure: unknown, whatFailed: string) {
    const apiError = readApiError(failure)
    const assigneeMessage = apiError?.error === 'VALIDATION_ERROR' ? apiError.fields.assigneeId : undefined
    if (assigneeMessage) {
      setFieldError(assigneeMessage)
      return
    }
    dispatch(addNotification({ message: describeTicketChangeFailure(failure, whatFailed), type: 'error' }))
  }

  let picker
  if (isLoading) {
    picker = <StatusMessage type="loading" compact>Loading the people who can be assigned…</StatusMessage>
  } else if (isError || !users) {
    // A 403 here means the role changed since the page loaded: the server
    // no longer lets this person list users, or assign.
    const forbidden = readApiError(error)?.error === 'FORBIDDEN'
    picker = (
      <StatusMessage type="error" compact onRetry={forbidden ? undefined : refetch}>
        {forbidden
          ? 'You can no longer assign tickets. Your role may have changed since this page loaded.'
          : "Couldn't load the people who can be assigned."}
      </StatusMessage>
    )
  } else {
    const assignable = users.filter(canBeAssigned)
    picker = (
      <form className="ticket-assignment__form" onSubmit={handleAssign} noValidate>
        <div className="ticket-assignment__field">
          <label htmlFor={pickerId}>Assign to</label>
          <select
            id={pickerId}
            name="assigneeId"
            value={selected}
            onChange={(event) => {
              setSelected(event.target.value)
              setFieldError(null)
            }}
            aria-invalid={fieldError !== null}
            aria-describedby={fieldError ? errorId : undefined}
          >
            <option value="" disabled>
              Choose a person
            </option>
            {assignable.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          {fieldError && (
            <p id={errorId} className="ticket-assignment__error" role="alert">
              {fieldError}
            </p>
          )}
        </div>
        <div className="ticket-assignment__actions">
          {/* Disabled until a different person is chosen: assigning the
              current assignee again would be a 200 that writes nothing. */}
          <button
            type="submit"
            className="button button--primary"
            disabled={isBusy || selected === '' || Number(selected) === ticket.assigneeId}
          >
            Assign
          </button>
          {ticket.assigneeId !== null && (
            <button type="button" className="button" disabled={isBusy} onClick={handleUnassign}>
              Unassign
            </button>
          )}
        </div>
      </form>
    )
  }

  return (
    <section className="ticket-assignment" aria-labelledby={`${pickerId}-heading`}>
      <h2 id={`${pickerId}-heading`}>Assignment</h2>
      <p>
        {ticket.assigneeName === null
          ? 'Nobody has this ticket yet.'
          : `${ticket.assigneeName} has this ticket.`}
      </p>
      {picker}
    </section>
  )
}

export default TicketAssignment
