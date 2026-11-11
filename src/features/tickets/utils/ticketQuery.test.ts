import { LIST_PAGE_SIZE, SORT_OPTIONS, buildTicketParams, parseSort } from './ticketQuery.ts'

// The query string for GET /tickets. Every rule checked here is one the
// server enforces with a 400 (API_CONTRACT.md, "Filtering, sorting and
// pagination"), so a mistake would show up as a refused request.

describe('buildTicketParams', () => {
  it('always sends page, size and sort, and leaves out filters that are not set', () => {
    // "status=" is a 400, not "any status": an unset filter is LEFT OUT.
    expect(buildTicketParams({ page: 1, size: LIST_PAGE_SIZE, sort: 'id,asc' })).toEqual({
      page: '1',
      size: '10',
      sort: 'id,asc',
    })
  })

  it('sends enum values in uppercase and the sort direction in lowercase', () => {
    // Backend decision 48: there's no single casing rule; each is a 400 if wrong.
    expect(
      buildTicketParams({
        page: 2,
        size: 10,
        sort: 'title,desc',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      }),
    ).toEqual({ page: '2', size: '10', sort: 'title,desc', status: 'IN_PROGRESS', priority: 'HIGH' })
  })

  it('trims the search, and leaves it out when it is only spaces', () => {
    expect(buildTicketParams({ page: 1, size: 10, sort: 'id,asc', search: '  printer  ' }).search).toBe(
      'printer',
    )
    expect(buildTicketParams({ page: 1, size: 10, sort: 'id,asc', search: '   ' })).not.toHaveProperty(
      'search',
    )
  })
})

describe('the sort options', () => {
  it("are all spellings the server accepts: one of its five fields, then ',asc' or ',desc'", () => {
    for (const option of SORT_OPTIONS) {
      expect(option.value).toMatch(/^(id|title|status|priority|team),(asc|desc)$/)
    }
  })

  it('parse back only from those spellings', () => {
    expect(parseSort('priority,desc')).toBe('priority,desc')
    // Wrong case and an unknown field are exactly what the server refuses.
    expect(parseSort('title,DESC')).toBeUndefined()
    expect(parseSort('created,asc')).toBeUndefined()
  })
})
