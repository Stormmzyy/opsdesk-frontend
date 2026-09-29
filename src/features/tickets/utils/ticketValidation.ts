import type { TicketFormValues } from '../../../types.ts'

export const TITLE_MIN_LENGTH = 3

// One optional message per field that can be wrong.
// A missing key means that field is fine.
export interface TicketFormErrors {
  title?: string
  description?: string
}

// Checks the ticket form values and returns the error messages, keyed by
// field name, e.g. { title: 'Title is required.' }.
// An empty object {} means every field is valid.
export function validateTicket(values: TicketFormValues): TicketFormErrors {
  const errors: TicketFormErrors = {}

  // trim() ignores spaces at the start and end, so "   " counts as empty.
  const title = values.title.trim()
  if (title === '') {
    errors.title = 'Title is required.'
  } else if (title.length < TITLE_MIN_LENGTH) {
    errors.title = `Title must be at least ${TITLE_MIN_LENGTH} characters.`
  }

  if (values.description.trim() === '') {
    errors.description = 'Description is required.'
  }

  return errors
}

// True when validateTicket found at least one problem.
export function hasErrors(errors: TicketFormErrors): boolean {
  return Object.keys(errors).length > 0
}
