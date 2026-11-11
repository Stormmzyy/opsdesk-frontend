import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

// The contract's error body (API_CONTRACT.md, "The error shape"):
// { "error": "VALIDATION_ERROR", "message": "...", "fields": { "email": "..." } }
// `fields` is only there on VALIDATION_ERROR.
export interface ApiErrorBody {
  status: number
  error: string
  message: string
  fields: Record<string, string>
}

// Reads an RTK Query error as the contract's error body, or returns null when
// it isn't one: the request never reached the server (FETCH_ERROR), the
// answer wasn't JSON, or something in our own code threw. Callers show their
// own "couldn't reach the server" message for null, because then there's no
// server message to show.
//
// error.data is `unknown` (the server could send anything), so every field
// is checked rather than cast.
export function readApiError(
  error: FetchBaseQueryError | SerializedError | undefined | unknown,
): ApiErrorBody | null {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return null
  }
  const { status } = error
  const body = 'data' in error ? error.data : undefined
  if (
    typeof status !== 'number' ||
    typeof body !== 'object' ||
    body === null ||
    !('error' in body) ||
    !('message' in body) ||
    typeof body.error !== 'string' ||
    typeof body.message !== 'string'
  ) {
    return null
  }
  const fields: Record<string, string> = {}
  if ('fields' in body && typeof body.fields === 'object' && body.fields !== null) {
    for (const [name, message] of Object.entries(body.fields)) {
      if (typeof message === 'string') {
        fields[name] = message
      }
    }
  }
  return { status, error: body.error, message: body.message, fields }
}

// The sentence to show when a change to a ticket fails, starting with what
// didn't happen ("Ticket #7 wasn't saved").
//
// A refusal is a real outcome, not a glitch, and it can happen to someone
// who did nothing wrong: an AGENT opens the edit form for a ticket assigned
// to them, a manager reassigns it, and the AGENT's save gets a 403. So the
// message says what the server decided and the likely reason, instead of a
// bare "couldn't be saved".
//
// The ticket is fetched again afterwards without any code here: RTK Query
// invalidates a mutation's tags when it fails as well as when it succeeds,
// so the page catches up with whatever changed.
export function describeTicketChangeFailure(error: unknown, whatFailed: string): string {
  const apiError = readApiError(error)
  if (apiError === null) {
    return `${whatFailed}: couldn't reach the server. Check your connection and try again.`
  }
  switch (apiError.error) {
    case 'FORBIDDEN':
      return (
        `${whatFailed}: you don't have permission to make this change. ` +
        'If the ticket changed since you opened it (reassigned, or moved on), it now shows ' +
        'where it stands.'
      )
    case 'NOT_FOUND':
      return `${whatFailed}: the ticket no longer exists, or you can no longer see it.`
    default:
      // CONFLICT, VALIDATION_ERROR and the rest carry a message written for
      // people (the contract's error codes), so it's shown as it is.
      return `${whatFailed}: ${apiError.message}`
  }
}
