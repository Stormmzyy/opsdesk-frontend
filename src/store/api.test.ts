import { isNotFoundError } from './api.ts'

// isNotFoundError decides whether a page says "Ticket not found" (the item
// doesn't exist) or "Sorry, we couldn't load this ticket" with Retry (the
// request failed). Getting it wrong tells people their data is gone.
describe('isNotFoundError', () => {
  it('is true for a 404 with the contract NOT_FOUND body', () => {
    expect(
      isNotFoundError({ status: 404, data: { error: 'NOT_FOUND', message: 'No ticket with id "9".' } }),
    ).toBe(true)
  })

  // What `npm run preview` (no backend) and a wrong VITE_API_URL give back:
  // a 404 that isn't from our API at all.
  it('is false for a bare 404 with no body, because the API itself is missing', () => {
    expect(isNotFoundError({ status: 404, data: null })).toBe(false)
    expect(isNotFoundError({ status: 404, data: '<html>Not Found</html>' })).toBe(false)
  })

  it('is false for other failures and when there is no error', () => {
    expect(isNotFoundError({ status: 500, data: { error: 'INTERNAL_ERROR', message: 'x' } })).toBe(
      false,
    )
    expect(isNotFoundError({ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' })).toBe(
      false,
    )
    expect(isNotFoundError(undefined)).toBe(false)
  })
})
