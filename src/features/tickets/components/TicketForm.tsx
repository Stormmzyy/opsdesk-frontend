import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { employees } from '../../../data/employees.ts'
import type { TicketFormValues } from '../../../types.ts'
import { getDepartments } from '../../../utils/employeeHelpers.ts'
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUSES,
  parsePriority,
  parseStatus,
} from '../utils/ticketStatus.ts'
import { hasErrors, validateTicket } from '../utils/ticketValidation.ts'
import type { TicketFormErrors } from '../utils/ticketValidation.ts'
import './TicketForm.css'

const TEAMS = getDepartments(employees)

interface TicketFormProps {
  // The starting value of every field.
  initialValues: TicketFormValues
  // Called with the cleaned-up values, only when they're valid.
  onSubmit: (values: TicketFormValues) => void
  // The text on the submit button, e.g. "Create ticket".
  submitLabel: string
  // Called when the user presses Cancel.
  onCancel: () => void
  // Shows the Status dropdown, used when editing.
  showStatus?: boolean
}

// One form for both creating and editing a ticket.
function TicketForm({
  initialValues,
  onSubmit,
  submitLabel,
  onCancel,
  showStatus = false,
}: TicketFormProps) {
  const [values, setValues] = useState<TicketFormValues>(initialValues)
  // Starts empty, so no errors show until the user first tries to submit.
  const [errors, setErrors] = useState<TicketFormErrors>({})

  // Saves a new value for one field and returns the updated values.
  // K is "one of the form's field names", and TicketFormValues[K] is that
  // field's type, so setField('priority', 'banana') would be a type error.
  function setField<K extends keyof TicketFormValues>(
    name: K,
    value: TicketFormValues[K],
  ): TicketFormValues {
    const nextValues = { ...values, [name]: value }
    setValues(nextValues)
    return nextValues
  }

  // Title and description are the fields that can have errors.
  function handleTextChange(name: 'title' | 'description', value: string) {
    const nextValues = setField(name, value)

    // If this field is already showing an error, check it again, so the
    // message disappears as soon as the user fixes the problem.
    if (errors[name]) {
      setErrors({ ...errors, [name]: validateTicket(nextValues)[name] })
    }
  }

  // A <select> gives us a plain string, so turn it back into a Priority or
  // TicketStatus first. It is always one of our options, but TypeScript
  // can't know that, so we check rather than guess.
  function handlePriorityChange(event: ChangeEvent<HTMLSelectElement>) {
    const priority = parsePriority(event.target.value)
    if (priority) {
      setField('priority', priority)
    }
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const status = parseStatus(event.target.value)
    if (status) {
      setField('status', status)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Stop the browser from reloading the page, which forms do by default.
    event.preventDefault()

    const nextErrors = validateTicket(values)
    setErrors(nextErrors)

    if (hasErrors(nextErrors)) {
      // Move keyboard focus to the first field with a problem.
      // namedItem() finds the form field with that name attribute. It could
      // in theory return null, so we check it is a real element first.
      const firstInvalidField = Object.keys(nextErrors)[0]
      const field = event.currentTarget.elements.namedItem(firstInvalidField)
      if (field instanceof HTMLElement) {
        field.focus()
      }
      return
    }

    onSubmit({
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
    })
  }

  return (
    // noValidate turns off the browser's own pop-up messages, so ours show instead.
    <form className="ticket-form" onSubmit={handleSubmit} noValidate>
      <div className="ticket-form__field">
        <label htmlFor="ticket-title">Title</label>
        <input
          id="ticket-title"
          name="title"
          type="text"
          value={values.title}
          onChange={(event) => handleTextChange('title', event.target.value)}
          required
          // aria-invalid tells screen readers the field has a problem, and
          // aria-describedby makes them read the error message with the field.
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'ticket-title-error' : undefined}
        />
        {errors.title && (
          <p id="ticket-title-error" className="ticket-form__error">
            {errors.title}
          </p>
        )}
      </div>

      <div className="ticket-form__field">
        <label htmlFor="ticket-description">Description</label>
        <textarea
          id="ticket-description"
          name="description"
          rows={5}
          value={values.description}
          onChange={(event) => handleTextChange('description', event.target.value)}
          required
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'ticket-description-error' : undefined}
        />
        {errors.description && (
          <p id="ticket-description-error" className="ticket-form__error">
            {errors.description}
          </p>
        )}
      </div>

      <div className="ticket-form__field">
        <label htmlFor="ticket-priority">Priority</label>
        <select
          id="ticket-priority"
          name="priority"
          value={values.priority}
          onChange={handlePriorityChange}
        >
          {TICKET_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {TICKET_PRIORITY_LABELS[priority]}
            </option>
          ))}
        </select>
      </div>

      <div className="ticket-form__field">
        <label htmlFor="ticket-team">Team</label>
        <select
          id="ticket-team"
          name="team"
          value={values.team}
          onChange={(event) => setField('team', event.target.value)}
        >
          {TEAMS.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>

      {showStatus && (
        <div className="ticket-form__field">
          <label htmlFor="ticket-status">Status</label>
          <select
            id="ticket-status"
            name="status"
            value={values.status}
            onChange={handleStatusChange}
          >
            {TICKET_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="ticket-form__actions">
        <button type="submit" className="button button--primary">
          {submitLabel}
        </button>
        <button type="button" className="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default TicketForm
