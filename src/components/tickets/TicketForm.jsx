import { useState } from 'react'
import { employees } from '../../data/employees.js'
import { getDepartments } from '../../utils/employeeHelpers.js'
import { TICKET_PRIORITY_LABELS, TICKET_STATUSES } from '../../utils/ticketStatus.js'
import { hasErrors, validateTicket } from '../../utils/ticketValidation.js'
import './TicketForm.css'

// [['LOW', 'Low'], ['MEDIUM', 'Medium'], ...], ready to map into <option>s.
const PRIORITY_OPTIONS = Object.entries(TICKET_PRIORITY_LABELS)
const TEAMS = getDepartments(employees)

// One form for both creating and editing a ticket.
// - initialValues: the starting value of every field
// - onSubmit(values): called with the cleaned-up values, only when they're valid
// - submitLabel: the text on the submit button, e.g. "Create ticket"
// - onCancel: called when the user presses Cancel
// - showStatus (optional): shows the Status dropdown, used when editing
function TicketForm({ initialValues, onSubmit, submitLabel, onCancel, showStatus = false }) {
  const [values, setValues] = useState(initialValues)
  // Starts empty, so no errors show until the user first tries to submit.
  const [errors, setErrors] = useState({})

  // One change handler for every field: each field's name matches a key in values.
  function handleChange(event) {
    const { name, value } = event.target
    const nextValues = { ...values, [name]: value }
    setValues(nextValues)

    // If this field is already showing an error, check it again, so the
    // message disappears as soon as the user fixes the problem.
    if (errors[name]) {
      setErrors({ ...errors, [name]: validateTicket(nextValues)[name] })
    }
  }

  function handleSubmit(event) {
    // Stop the browser from reloading the page, which forms do by default.
    event.preventDefault()

    const nextErrors = validateTicket(values)
    setErrors(nextErrors)

    if (hasErrors(nextErrors)) {
      // Move keyboard focus to the first field with a problem.
      const firstInvalidField = Object.keys(nextErrors)[0]
      event.target.elements[firstInvalidField].focus()
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
          onChange={handleChange}
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
          onChange={handleChange}
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
          onChange={handleChange}
        >
          {PRIORITY_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="ticket-form__field">
        <label htmlFor="ticket-team">Team</label>
        <select id="ticket-team" name="team" value={values.team} onChange={handleChange}>
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
            onChange={handleChange}
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
