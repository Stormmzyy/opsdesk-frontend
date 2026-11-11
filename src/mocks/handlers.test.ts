import { server } from './server.ts'
import { getAllTickets, resetToSampleTickets } from './ticketDb.ts'
import { resetToSampleUsers } from './userDb.ts'

// Checks the mock API against API_CONTRACT.md, one endpoint at a time:
// the status code, the body's shape, and every failure case the contract
// lists. If the mock and the contract ever disagree, a test here fails, and
// the CONTRACT wins: the handler is what gets fixed.
//
// These talk to the mock with plain fetch, like the real backend will be
// talked to, rather than through the app's RTK Query hooks.

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetToSampleTickets()
  resetToSampleUsers()
})
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

  // With any query parameter, the contract's envelope instead.
  it('returns a page in the envelope, filtered and ordered by meaning, counting pages from 1', async () => {
    const { status, body } = await call('GET', '/tickets?status=OPEN&sort=priority,desc&size=2&page=1')
    expect(status).toBe(200)
    const page = body as { items: { id: number; priority: string; status: string }[] }
    expect(Object.keys(body as object)).toEqual(['items', 'page', 'size', 'totalItems', 'totalPages'])
    const open = getAllTickets().filter((ticket) => ticket.status === 'OPEN')
    expect(body).toMatchObject({ page: 1, size: 2, totalItems: open.length, totalPages: Math.ceil(open.length / 2) })
    // Most urgent first: URGENT before HIGH, never by spelling.
    expect(page.items.map((ticket) => ticket.priority)).toEqual(['URGENT', 'HIGH'])
    expect(page.items.every((ticket) => ticket.status === 'OPEN')).toBe(true)
  })

  it('answers a page past the end with no items and the real totals, not an error', async () => {
    const { status, body } = await call('GET', '/tickets?page=99')
    expect(status).toBe(200)
    expect(body).toEqual({ items: [], page: 99, size: 10, totalItems: 12, totalPages: 2 })
  })

  it('refuses bad parameters with every problem keyed by the parameter name', async () => {
    const { status, body } = await call(
      'GET',
      '/tickets?size=500&status=OPEN&status=CLOSED&stauts=OPEN&sort=title,DESC',
    )
    expect(status).toBe(400)
    // The contract's captured example, plus the uppercase direction.
    expect(body).toEqual({
      error: 'VALIDATION_ERROR',
      message:
        'Size must be a whole number from 1 to 100. Status can only be sent once. There is no query parameter called "stauts". Sort must be id, title, status, priority or team, optionally followed by ,asc or ,desc.',
      fields: {
        size: 'Size must be a whole number from 1 to 100.',
        status: 'Status can only be sent once.',
        stauts: 'There is no query parameter called "stauts".',
        sort: 'Sort must be id, title, status, priority or team, optionally followed by ,asc or ,desc.',
      },
    })
  })

  it('refuses an empty filter, but not an empty search', async () => {
    expect((await call('GET', '/tickets?status=')).status).toBe(400)
    expect((await call('GET', '/tickets?search=')).status).toBe(200)
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
    // The output-only fields are the server's: nobody assigned, the mock's
    // fixed creator, version 0.
    expect(body).toEqual({
      ...validNewTicket,
      id: 13,
      status: 'OPEN',
      assigneeId: null,
      assigneeName: null,
      createdById: 1,
      createdByName: 'Priya Sharma',
      version: 0,
    })
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
    // Every saved change adds one to the version, as the server's does.
    expect(body).toEqual({ ...before, status: 'RESOLVED', version: before!.version + 1 })
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

describe('GET /users', () => {
  it('returns 200 and every user in the contract shape, sorted by id', async () => {
    const { status, body } = await call('GET', '/users')
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(6)

    const users = body as { id: number }[]
    const ids = users.map((user) => user.id)
    expect(ids).toEqual([...ids].sort((a, b) => a - b))

    // toEqual on the whole object fails on any extra field as well as a
    // missing one, so this catches the mock drifting from the contract in
    // either direction: a leftover JSONPlaceholder field (website, geo,
    // catchPhrase), or a password or password hash, which a User must never
    // include.
    for (const user of users) {
      expect(user).toEqual({
        id: expect.any(Number),
        name: expect.any(String),
        username: expect.any(String),
        email: expect.any(String),
        // On every User response (backend decision 59). The mock's users
        // carry the backend seeder's roles, so role-aware screens behave the
        // same against either.
        role: expect.stringMatching(/^(ADMIN|MANAGER|AGENT|USER)$/),
        phone: expect.any(String),
        address: {
          street: expect.any(String),
          suite: expect.any(String),
          city: expect.any(String),
          zipcode: expect.any(String),
        },
        company: { name: expect.any(String) },
      })
    }
  })
})

describe('PATCH /tickets/{id}/assignee', () => {
  const ASSIGNEE_MESSAGES = {
    required: 'Assignee id is required.',
    invalid: 'Assignee id must be a positive whole number.',
    user: "A USER can't be assigned tickets.",
  }

  it('returns 200 and the whole ticket, with the assignee and the version up by one', async () => {
    const before = getAllTickets().find((ticket) => ticket.id === 2)!
    const { status, body } = await call('PATCH', '/tickets/2/assignee', { assigneeId: 2 })
    expect(status).toBe(200)
    expect(body).toEqual({
      ...before,
      assigneeId: 2,
      assigneeName: 'Daniel Mensah',
      version: before.version + 1,
    })
  })

  it('treats assigning the current assignee as a 200 that writes nothing: the version stays', async () => {
    const { body: first } = await call('PATCH', '/tickets/2/assignee', { assigneeId: 2 })
    const { status, body: second } = await call('PATCH', '/tickets/2/assignee', { assigneeId: 2 })
    expect(status).toBe(200)
    expect(second).toEqual(first)
  })

  it("refuses a USER with the contract's message", async () => {
    // User 5 is Fatima, the one USER.
    const { status, body } = await call('PATCH', '/tickets/2/assignee', { assigneeId: 5 })
    expect(status).toBe(400)
    expect(body).toEqual({
      error: 'VALIDATION_ERROR',
      message: ASSIGNEE_MESSAGES.user,
      fields: { assigneeId: ASSIGNEE_MESSAGES.user },
    })
  })

  it.each([
    [{}, ASSIGNEE_MESSAGES.required],
    // null is never "unassign": that's DELETE.
    [{ assigneeId: null }, ASSIGNEE_MESSAGES.required],
    [{ assigneeId: 0 }, ASSIGNEE_MESSAGES.invalid],
    [{ assigneeId: 2.5 }, ASSIGNEE_MESSAGES.invalid],
    [{ assigneeId: '2' }, ASSIGNEE_MESSAGES.invalid],
    [{ assigneeId: 99 }, 'No user with id 99.'],
  ])('refuses %j', async (sent, message) => {
    const { status, body } = await call('PATCH', '/tickets/2/assignee', sent)
    expect(status).toBe(400)
    expect(body).toMatchObject({ error: 'VALIDATION_ERROR', fields: { assigneeId: message } })
  })

  it('answers 404 for a missing ticket before looking at the body', async () => {
    const { status, body } = await call('PATCH', '/tickets/999/assignee', 'not json')
    expect(status).toBe(404)
    expect(body).toEqual({ error: 'NOT_FOUND', message: 'No ticket with id "999".' })
  })
})

describe('DELETE /tickets/{id}/assignee', () => {
  it('returns 200 and the ticket with nobody assigned, and the version up by one', async () => {
    const { body: assigned } = await call('PATCH', '/tickets/2/assignee', { assigneeId: 2 })
    const { status, body } = await call('DELETE', '/tickets/2/assignee')
    expect(status).toBe(200)
    expect(body).toEqual({
      ...(assigned as object),
      assigneeId: null,
      assigneeName: null,
      version: (assigned as { version: number }).version + 1,
    })
  })

  it('treats unassigning a ticket nobody has as a 200 that writes nothing', async () => {
    const before = getAllTickets().find((ticket) => ticket.id === 2)!
    expect(before.assigneeId).toBeNull()
    const { status, body } = await call('DELETE', '/tickets/2/assignee')
    expect(status).toBe(200)
    expect(body).toEqual(before)
  })

  it('answers 404 for a missing ticket', async () => {
    const { status } = await call('DELETE', '/tickets/999/assignee')
    expect(status).toBe(404)
  })
})

describe('POST /auth/login', () => {
  it('returns 200, a token and the user, for a sample user with the development password', async () => {
    const { status, body } = await call('POST', '/auth/login', {
      email: 'Kwame.Asante@opsdesk.com',
      password: 'devpassword123',
    })
    expect(status).toBe(200)
    expect(body).toMatchObject({ token: expect.any(String), user: { id: 3, role: 'MANAGER' } })
  })

  it('gives a wrong password and an unknown email exactly the same 401', async () => {
    const wrong = await call('POST', '/auth/login', {
      email: 'fatima.bello@opsdesk.com',
      password: 'nope-nope',
    })
    const unknown = await call('POST', '/auth/login', {
      email: 'nobody@example.com',
      password: 'nope-nope',
    })
    expect(wrong).toEqual({
      status: 401,
      body: { error: 'UNAUTHORIZED', message: 'The email or password is incorrect.' },
    })
    expect(unknown).toEqual(wrong)
  })
})

describe('GET /auth/me', () => {
  it('returns the user the mock token belongs to, and 401 without one', async () => {
    const { body } = await call('POST', '/auth/login', {
      email: 'fatima.bello@opsdesk.com',
      password: 'devpassword123',
    })
    const token = (body as { token: string }).token
    const me = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
    expect(me.status).toBe(200)
    expect(await me.json()).toMatchObject({ id: 5, name: 'Fatima Bello', role: 'USER' })

    const { status } = await call('GET', '/auth/me')
    expect(status).toBe(401)
  })
})

describe('POST /auth/register', () => {
  it('returns 201 and a new USER with the email and username lowercased', async () => {
    const { status, body } = await call('POST', '/auth/register', {
      name: 'Ama Owusu',
      username: 'Ama.Owusu',
      email: 'Ama@Example.com',
      password: 'correct-horse-battery',
    })
    expect(status).toBe(201)
    expect(body).toMatchObject({
      id: 7,
      username: 'ama.owusu',
      email: 'ama@example.com',
      role: 'USER',
    })
    expect(body).not.toHaveProperty('password')
  })

  it("refuses a taken email with the contract's 409", async () => {
    const { status, body } = await call('POST', '/auth/register', {
      name: 'Kwame Again',
      username: 'kwame.two',
      email: 'kwame.asante@opsdesk.com',
      password: 'correct-horse-battery',
    })
    expect(status).toBe(409)
    expect(body).toEqual({ error: 'CONFLICT', message: 'An account with this email already exists.' })
  })

  it("lists every broken field with the contract's messages", async () => {
    const { status, body } = await call('POST', '/auth/register', {
      name: 'Ama',
      username: 'ama',
      email: 'not-an-email',
      password: 'short',
    })
    expect(status).toBe(400)
    // The contract's captured example, word for word.
    expect(body).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Enter a valid email address. Password must be at least 8 characters.',
      fields: {
        email: 'Enter a valid email address.',
        password: 'Password must be at least 8 characters.',
      },
    })
  })
})
