import type { TicketFormValues } from '../types.ts'

export const TITLE_MIN_LENGTH = 3

// One optional message per field that can be wrong.
// A missing key means that field is fine.
export interface TicketFormErrors {
  title?: string
  description?: string
}

// The rule for a title. Returns the error message, or undefined if it's fine.
// Shared by the form (below) and the mock API (src/mocks/handlers.ts), so
// the browser and the "server" always agree, word for word, on what's valid.
export function validateTitle(title: string): string | undefined {
  // trim() ignores spaces at the start and end, so "   " counts as empty.
  const trimmed = title.trim()
  if (trimmed === '') {
    return 'Title is required.'
  }
  if (trimmed.length < TITLE_MIN_LENGTH) {
    return `Title must be at least ${TITLE_MIN_LENGTH} characters.`
  }
  return undefined
}

// The rule for a description, shared the same way.
export function validateDescription(description: string): string | undefined {
  return description.trim() === '' ? 'Description is required.' : undefined
}

// Checks the ticket form values and returns the error messages, keyed by
// field name, e.g. { title: 'Title is required.' }.
// An empty object {} means every field is valid.
// Only the title and description can be wrong: the form's priority and team
// are dropdowns, so they can only ever hold a valid choice.
export function validateTicket(
  values: Pick<TicketFormValues, 'title' | 'description'>,
): TicketFormErrors {
  const errors: TicketFormErrors = {}
  const titleProblem = validateTitle(values.title)
  if (titleProblem) {
    errors.title = titleProblem
  }
  const descriptionProblem = validateDescription(values.description)
  if (descriptionProblem) {
    errors.description = descriptionProblem
  }
  return errors
}

// True when validateTicket found at least one problem.
export function hasErrors(errors: TicketFormErrors): boolean {
  return Object.keys(errors).length > 0
}
