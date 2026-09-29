export const TITLE_MIN_LENGTH = 3

// Checks the ticket form values and returns the error messages, keyed by
// field name, e.g. { title: 'Title is required.' }.
// An empty object {} means every field is valid.
export function validateTicket(values) {
  const errors = {}

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
export function hasErrors(errors) {
  return Object.keys(errors).length > 0
}
