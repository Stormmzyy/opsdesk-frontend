import { server } from './server.ts'
import { getAllTickets, resetToSampleTickets } from './ticketDb.ts'

// Checks the mock API against API_CONTRACT.md, one endpoint at a time:
// the status code, the body's shape, and every failure case the contract
// lists. If the mock and the contract ever disagree, a test here fails, and
// the CONTRACT wins: the handler is what gets fixed.
//
// These talk to the mock with plain fetch, like the real backend will be
// talked to, rather than through the app's RTK Query hooks.

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetToSampleTickets())
afterAll(() => server.close())

// A full URL, because Node's fetch rejects relative ones (see api.ts).
const API = new URL('/api/v1', window.location.origin).href

// Sends a request to the mock API and returns the status and the parsed
// JSON body (or null when there's no body, as with 204).
async function call(method: string, path: string, body?: unknown) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    // A string is sent exactly as it is, so a test can send broken JSON.
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
  const text = await response.text()
  const json: unknown = text === '' ? null : JSON.parse(text)
  return { status: response.status, body: json }
}

const TEAM_MESSAGE = 'Team must be one of Engineering, Finance, HR, Operations or Support.'

const validNewTicket = {
  title: 'Printer on the second floor is jammed',
  description: 'It shows error E-42 and nothing prints.',
  priority: 'HIGH',
  team: 'Operations',
}

describe('the standard error shape', () => {
  it('has error and message, and no fields, for anything but a validation error', async () => {
    const { status, body } = await call('GET', '/tickets/999')
    expect(status).toBe(404)
    expect(body).toEqual({ error: 'NOT_FOUND', message: 'No ticket with id "999".' })
  })
})

describe('GET /tickets', () => {
  it('returns 200 and every ticket, as a plain array sorted by id', async () => {
    const { status, body } = await call('GET', '/tickets')
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect(body).toEqual(getAllTickets())
    const ids = getAllTickets().map((ticket) => ticket.id)
    expect(ids).toEqual([...ids].sort((a, b) => a - b))
  })
})

describe('GET /tickets/{id}', () => {
  it('returns 200 and the ticket', async () => {
    const { status, body } = await call('GET', '/tickets/2')
    expect(status).toBe(200)
    expect(body).toMatchObject({ id: 2, title: 'Order new laptops for the March starters' })
  })

  it.each(['999', 'abc', '3.5', '-1'])('returns 404 NOT_FOUND for id "%s"', async (id) => {
    const { status, body } = await call('GET', `/tickets/${id}`)
    expect(status).toBe(404)
    expect(body).toEqual({ error: 'NOT_FOUND', message: `No ticket with id "${id}".` })
  })
})

describe('POST /tickets', () => {
  it('returns 201 and the new ticket, always OPEN, ignoring id, status and unknown fields', async () => {
    const { status, body } = await call('POST', '/tickets', {
      ...validNewTicket,
      id: 500,
      status: 'CLOSED',
      colour: 'blue',
    })
    expect(status).toBe(201)
    expect(body).toEqual({ ...validNewTicket, id: 13, status: 'OPEN' })
  })

  it('trims spaces from the title and description before saving', async () => {
    const { body } = await call('POST', '/tickets', {
      ...validNewTicket,
      title: '   Printer jammed   ',
      description: '  Error E-42.  ',
    })
    expect(body).toMatchObject({ title: 'Printer jammed', description: 'Error E-42.' })
  })

  it('returns 400 BAD_REQUEST when the body is not valid JSON', async () => {
    const { status, body } = await call('POST', '/tickets', '{ not json')
    expect(status).toBe(400)
    expect(body).toEqual({
      error: 'BAD_REQUEST',
      message: 'The request body must be a JSON object.',
    })
  })

  it('returns 400 BAD_REQUEST when the body is JSON but not an object', async () => {
    const { status, body } = await call('POST', '/tickets', [])
    expect(status).toBe(400)
    expect(body).toMatchObject({ error: 'BAD_REQUEST' })
  })

  it('returns 400 VALIDATION_ERROR listing EVERY invalid field in fields', async () => {
    const { status, body } = await call('POST', '/tickets', {
      ...validNewTicket,
      title: '  ',
      team: 'Marketing',
    })
    expect(status).toBe(400)
    expect(body).toEqual({
      error: 'VALIDATION_ERROR',
      message: `Title is required. ${TEAM_MESSAGE}`,
      fields: { title: 'Title is required.', team: TEAM_MESSAGE },
    })
  })

  it('names each field that is missing or the wrong type', async () => {
    const { status, body } = await call('POST', '/tickets', { title: 42, priority: 'SOON' })
    expect(status).toBe(400)
    expect(body).toMatchObject({
      error: 'VALIDATION_ERROR',
      fields: {
        title: 'Title must be text.',
        description: 'Description is required.',
        priority: 'Priority must be one of LOW, MEDIUM, HIGH or URGENT.',
        team: TEAM_MESSAGE,
      },
    })
  })

  it('rejects a title shorter than 3 characters', async () => {
    const { body } = await call('POST', '/tickets', { ...validNewTicket, title: 'ab' })
    expect(body).toMatchObject({ fields: { title: 'Title must be at least 3 characters.' } })
  })
})

describe('PATCH /tickets/{id}', () => {
  it('returns 200 and the whole ticket, changing only the fields sent', async () => {
    const before = getAllTickets().find((ticket) => ticket.id === 1)
    const { status, body } = await call('PATCH', '/tickets/1', { status: 'RESOLVED', id: 77 })
    expect(status).toBe(200)
    expect(body).toEqual({ ...before, status: 'RESOLVED' })
  })

  it('accepts an empty object and changes nothing', async () => {
    const before = getAllTickets().find((ticket) => ticket.id === 1)
    const { status, body } = await call('PATCH', '/tickets/1', {})
    expect(status).toBe(200)
    expect(body).toEqual(before)
  })

  it('returns 404 before looking at the body', async () => {
    const { status, body } = await call('PATCH', '/tickets/999', '{ not json')
    expect(status).toBe(404)
    expect(body).toEqual({ error: 'NOT_FOUND', message: 'No ticket with id "999".' })
  })

  it('returns 400 BAD_REQUEST when the body is not an object', async () => {
    const { status, body } = await call('PATCH', '/tickets/1', '"hello"')
    expect(status).toBe(400)
    expect(body).toMatchObject({ error: 'BAD_REQUEST' })
  })

  it('returns 400 VALIDATION_ERROR naming only the invalid fields that were sent', async () => {
    const { status, body } = await call('PATCH', '/tickets/1', { status: 'DONE' })
    expect(status).toBe(400)
    expect(body).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Status must be one of OPEN, IN_PROGRESS, RESOLVED or CLOSED.',
      fields: { status: 'Status must be one of OPEN, IN_PROGRESS, RESOLVED or CLOSED.' },
    })
  })
})

describe('DELETE /tickets/{id}', () => {
  it('returns 204 with no body, then 404 for the same id', async () => {
    const first = await call('DELETE', '/tickets/12')
    expect(first).toEqual({ status: 204, body: null })

    const second = await call('DELETE', '/tickets/12')
    expect(second).toEqual({
      status: 404,
      body: { error: 'NOT_FOUND', message: 'No ticket with id "12".' },
    })
  })
})

describe('GET /projects and GET /projects/{id}', () => {
  it('returns 200 and every project, sorted by id', async () => {
    const { status, body } = await call('GET', '/projects')
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(6)
    expect(body).toContainEqual(expect.objectContaining({ id: 2, name: 'New office move' }))
  })

  it('returns 200 and one project', async () => {
    const { status, body } = await call('GET', '/projects/2')
    expect(status).toBe(200)
    expect(body).toEqual({
      id: 2,
      name: 'New office move',
      description: 'Plan and run the move to the new Accra office, including desks and network.',
      status: 'PLANNING',
      team: 'Operations',
      lead: 'Kwame Asante',
    })
  })

  it.each(['999', 'abc'])('returns 404 NOT_FOUND for id "%s"', async (id) => {
    const { status, body } = await call('GET', `/projects/${id}`)
    expect(status).toBe(404)
    expect(body).toEqual({ error: 'NOT_FOUND', message: `No project with id "${id}".` })
  })
})
