# OpsDesk API contract (v1)

OpsDesk is an internal operations desk: staff raise support **tickets**, move them through a workflow (Open → In progress → Resolved → Closed), and see what each team is working on through **projects** and a **users** directory. Since Week 7, everyone signs in, and what they may do depends on their **role**.

This document is the agreement between the frontend and the backend. It says exactly which requests a client sends and exactly what it gets back. **The Week 7 backend (opsdesk-backend) is built against this document**, and every example response below was captured from it, not written by hand: each example sits under a hidden comment naming the exact request and caller that produced it, run against a freshly seeded database. There is one exception, the [409](#patch-ticketsid), which is pinned by a test instead. A capture records what was true on the day it was taken, and goes stale silently; the examples that matter most should be pinned by backend tests, which fail when the code drifts. If the backend and this document ever disagree, this document wins and the code is fixed, with one exception: **who may do what**. The backend is the source of truth for permissions, and this document's [permission table](#the-permission-table) only describes it.

**The mock API is Week 6 vintage.** When `VITE_USE_MOCK_API=true`, a mock built with [Mock Service Worker (MSW)](https://mswjs.io/) answers requests inside the browser instead (`src/mocks/handlers.ts`). It still implements the Week 6 part of this contract: the six-field Ticket object, `GET`, `POST`, `PATCH` and `DELETE` on `/tickets`, `/projects` and `/users`, with the same validation and 404 messages. It does **not** implement anything added in Week 7: signing in, the token, roles and permissions (401 and 403), the new Ticket fields, the assignee endpoints, filtering, sorting and pagination, or the 409 for a stale write. Each endpoint below says whether the mock serves it.

**On `main` today the frontend and the backend don't work together**, on purpose: the backend requires a token, and the frontend doesn't send one yet. Carrying a session is Week 8 work. See the frontend README.

## Contents

- [Conventions](#conventions)
- [Signing in and the token](#signing-in-and-the-token)
- [Roles and permissions](#roles-and-permissions)
- [Errors](#errors)
- [Status codes](#status-codes)
- [The order of the checks](#the-order-of-the-checks)
- [Tickets](#tickets)
- [Projects](#projects)
- [Users](#users)
- [Auth](#auth)
- [Promises that a future version may change](#promises-that-a-future-version-may-change)
- [Mock-only endpoint](#mock-only-endpoint-not-part-of-the-api)

## Conventions

### Base URL and versioning

Every path in this document is relative to the base URL:

```
/api/v1
```

So `GET /tickets` means `GET /api/v1/tickets`. The frontend reads the base URL from the `VITE_API_URL` environment variable (default `/api/v1`). The backend only accepts browser requests from `http://localhost:5173` (CORS), so serving the frontend from another origin needs a change to the backend's CORS configuration too.

`v1` is the version of this contract. Changes that don't break existing clients (a new endpoint, a new field in a response) can be added to v1. A change that would break a client (renaming or removing a field, changing a type, changing a status code that a working request gets) needs a new version, `/api/v2`, served alongside v1 until clients have moved.

### Paths

- Resources are **plural nouns**: `/tickets`, `/projects`, `/users`.
- One item is the collection plus its id: `/tickets/3`. A part of an item is a path under it: `/tickets/3/assignee`.
- **No verbs in paths**, with one deliberate exception: `/auth/register`, `/auth/login` and `/auth/me`. Signing in isn't a resource anyone reads back, and these names are what every client developer expects.

### Requests and responses

- Request and response bodies are **JSON**. A request with a body must set `Content-Type: application/json`; one that doesn't gets **400 `BAD_REQUEST`**.
- Field names are **camelCase**, for example `totalItems`.
- **Ids are positive whole numbers** (`1`, `2`, `3` …), chosen by the server. Clients never choose an id.
- In a path, an id that isn't a whole number (`/tickets/abc`, `/tickets/3.5`, `/tickets/-1`) is treated the same as an id that doesn't exist: **404 `NOT_FOUND`**. Leading zeros are accepted (`/tickets/02` is ticket 2), and a 404 quotes the id exactly as it was sent.
- **Fields the server doesn't recognise in a request body are ignored**, not rejected, with one exception: a Ticket's **output-only fields** (`assigneeId`, `assigneeName`, `createdById`, `createdByName`, `version`) are **refused** with a 400 if a `POST` or `PATCH` sends them, even as `null`. A client sending one is trying to do something (assign a ticket, ask for a conflict check) that this endpoint doesn't do, and a 200 that quietly did nothing would mislead it. `id` is still ignored.
- **Query parameters:** an endpoint that accepts query parameters **rejects unknown ones** with a 400. An endpoint that accepts none ignores any it's sent. Today only `GET /tickets` accepts any. A dropped body field is a write that didn't happen, which a client can see by reading back; a dropped filter is a read that silently returned more than asked, which it can't. A client that needs to defeat a cache should send `Cache-Control`, not an extra parameter.
- Lists are returned as a **plain JSON array**, sorted by `id`, oldest first, unless the endpoint says otherwise. `GET /tickets` can also return one page at a time, in a chosen order; see [Filtering, sorting and pagination](#filtering-sorting-and-pagination).
- Free-text fields (a ticket's `title` and `description`, a user's `name`) are **trimmed**: leading and trailing spaces are removed before the value is checked and saved. Passwords are never trimmed.
- **Fixed values are matched exactly, including case**, and there is no single casing rule. They are written exactly as in these examples:

  | Kind | Example | Not |
  | --- | --- | --- |
  | status, priority, role | `?status=IN_PROGRESS`, `"priority": "URGENT"` | `in_progress`, `Urgent` |
  | team | `?team=Operations`, `"team": "HR"` | `OPERATIONS`, `hr`, `" Support "` |
  | sort field and direction | `?sort=priority,desc` | `Priority,DESC` |

  `DESC` is worth calling out: many APIs built on Spring accept it, and this one doesn't.

## Signing in and the token

1. **Sign in** with `POST /auth/login`. The response holds a `token`.
2. **Send it on every other request**, in a header:

   ```
   Authorization: Bearer <token>
   ```

3. **It lasts 60 minutes.** After that, every request answers 401, and the client signs in again. There is no refresh token.
4. **There is no logout endpoint.** Signing out means the client throws the token away. A token that was copied somewhere stays valid until it expires.
5. **The server reads the caller's account on every request.** A role changed by an administrator applies from the caller's next request, without signing in again, and an account that no longer exists gets a 401.

Every endpoint except `POST /auth/register` and `POST /auth/login` needs a valid token, **including paths that don't exist**. Without one, every request gets the same 401, so a caller who isn't signed in can't tell which paths exist:

<!-- captured from the running backend: GET /api/v1/tickets with no token → 401 -->

```json
{
  "error": "UNAUTHORIZED",
  "message": "You need to log in first. Send your token as \"Authorization: Bearer <token>\"."
}
```

The same answer comes back for a missing header, a malformed or expired token, and a token whose account is gone.

## Roles and permissions

Every user has exactly one **role**: `ADMIN`, `MANAGER`, `AGENT` or `USER`. A new account registered through `POST /auth/register` is always a `USER`; roles are changed by an administrator, outside the API.

A client learns the signed-in user's role from the `role` field of the [User object](#the-user-object), for example from `GET /auth/me`. It must not read it from the token: the token's contents aren't part of this contract, and the server never trusts the role written in it either.

### The permission table

| Action | ADMIN | MANAGER | AGENT | USER |
| --- | --- | --- | --- | --- |
| See tickets | all | all | all | **only the ones she created** |
| Create a ticket | yes | yes | yes | yes |
| Edit a ticket | any | any | **only tickets assigned to them** | **only her own, and only while it's `OPEN`** |
| Assign or unassign a ticket | yes | yes | no | no |
| Delete a ticket | yes | no | no | no |
| List users | yes | yes | no | no |
| See projects | yes | yes | yes | yes |

Two rules the table can't show:

- **A USER may change only `title` and `description`** on her own `OPEN` ticket. Changing `status`, `priority` or `team` is refused with 403. ("Changing" means sending a value different from the current one; see [PATCH /tickets/{id}](#patch-ticketsid).)
- **An AGENT can't edit a ticket assigned to nobody**, nor one assigned to someone else. Only an ADMIN or MANAGER assigns tickets.

**The backend is the source of truth for these rules, and this table is descriptive.** It's written down so a client can decide which controls to show, not to define the rules. If you find the table and the backend disagreeing, believe the backend: its answer is what your request will actually get. Then report it, so the table is corrected. (This is the one place where this document doesn't win over the code: permission rules are security decisions, made and enforced on the server.)

A client that shows a button can still get a 403: for example, when the ticket was reassigned or moved on since the page loaded. A client should handle 403 everywhere, not only where its own copy of the table predicts one.

## Errors

### The error shape

**Every** failing request, on every endpoint, answers with this JSON body:

<!-- captured from the running backend: POST /api/v1/tickets as priya with {"title": "", "priority": "HIGH", "team": "Operations", "description": "Toner"} → 400 -->

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Title is required.",
  "fields": {
    "title": "Title is required."
  }
}
```

| Field | Type | Present | Meaning |
| --- | --- | --- | --- |
| `error` | string | always | A fixed **error code** from the list below. Code can check it (`if (body.error === 'NOT_FOUND')`). It never changes. |
| `message` | string | always | A sentence a person can read. It may be reworded at any time, so code must not depend on its wording. |
| `fields` | object | **only** for `VALIDATION_ERROR` | One entry per invalid field or query parameter: the key is its name, the value is a message for it. Fields that are fine are left out. |

For a `VALIDATION_ERROR`, `message` repeats the field messages joined into one sentence, so a client that ignores `fields` can still show something useful.

### Error codes

This is the complete list. The backend must not invent others without updating this document.

| Code | Status | When |
| --- | --- | --- |
| `BAD_REQUEST` | 400 | The request can't be read at all: the body isn't valid JSON, isn't a JSON object, is missing, or isn't sent as JSON. |
| `VALIDATION_ERROR` | 400 | The request was read, but one or more fields or query parameters break the rules. `fields` says which. |
| `UNAUTHORIZED` | 401 | No valid token: missing, malformed, expired, or for an account that no longer exists. Also a failed login. |
| `FORBIDDEN` | 403 | The caller is signed in, and isn't allowed to do this: their role, or their relationship to the ticket, doesn't permit it. |
| `NOT_FOUND` | 404 | The resource doesn't exist, **or the caller isn't allowed to see it** (see [Visibility](#visibility-a-ticket-you-cant-see-is-a-404)): no item with that id, an id that isn't a whole number, a path that doesn't exist, or a method that path doesn't support. |
| `CONFLICT` | 409 | The request clashes with the current data: registering an email or username that's already taken, or changing a ticket that someone else changed at the same moment. |
| `INTERNAL_ERROR` | 500 | Something went wrong on the server that isn't the client's fault. The message never includes stack traces, SQL or other internals. |

The 403's message is always the same. It never says which rule refused, so a caller can't probe the rules by reading the reasons:

<!-- captured from the running backend: DELETE /api/v1/tickets/1 as daniel → 403 -->

```json
{
  "error": "FORBIDDEN",
  "message": "You don't have permission to do this."
}
```

## Status codes

| Code | Name | Used for |
| --- | --- | --- |
| **200** | OK | A successful read (`GET`), update (`PATCH`), login, or unassign. The body is the requested or updated data. |
| **201** | Created | A successful `POST` that created something. The body is the new item, including its server-chosen `id`. |
| **204** | No Content | A successful `DELETE /tickets/{id}`. There is **no body** at all. |
| **400** | Bad Request | `BAD_REQUEST` or `VALIDATION_ERROR`. The client must fix the request before sending it again. |
| **401** | Unauthorized | `UNAUTHORIZED`. Sign in (again). |
| **403** | Forbidden | `FORBIDDEN`. Sending the same request again won't help. |
| **404** | Not Found | `NOT_FOUND`. |
| **409** | Conflict | `CONFLICT`. For a stale write: reload, look at the other change, and try again if it still makes sense. |
| **500** | Internal Server Error | `INTERNAL_ERROR`. **Any** endpoint can answer 500, so it isn't repeated under each one below. The client may retry. |

The API has no 405: a method a path doesn't support (`PUT /tickets/1`) is a 404, because no endpoint exists for that method and path.

<!-- captured from the running backend: PUT /api/v1/tickets/1 as priya with {} → 404 -->

```json
{
  "error": "NOT_FOUND",
  "message": "Nothing exists at PUT /api/v1/tickets/1."
}
```

## The order of the checks

When a request has more than one problem, the server answers with the **first** of these that applies:

| Step | Answer | Checked |
| --- | --- | --- |
| 1 | **401** | Is there a valid token? |
| 2 | **403** for a **role** rule | Does the caller's role allow this endpoint at all? Only for `DELETE /tickets/{id}` (ADMIN), `GET /users`, and both `/tickets/{id}/assignee` endpoints (ADMIN or MANAGER). |
| 3 | **404** | Does the ticket exist, and may the caller see it? Does the path exist? |
| 4 | **403** for a **ticket** rule | May this caller edit this particular ticket? (`PATCH /tickets/{id}`: an AGENT's assignment, a USER's ownership and the ticket's status.) |
| 5 | **400 `BAD_REQUEST`** | Can the body be read? |
| 6 | **400 `VALIDATION_ERROR`** | Do the fields follow the rules? Every invalid field is listed together, not just the first. |
| 7 | **403** for a USER's **field** rule | Does a USER's request change `status`, `priority` or `team`? |
| 8 | **409** | Did someone else change the ticket at the same moment? |

**The principle: every check that can be decided from the path and the token runs before the body is read.** Who the caller is (step 1), what their role allows (2), whether the ticket exists for them (3), and whether they may edit that ticket (4) don't depend on the body, so a request that isn't allowed is refused the same way whatever its body contains. Only then is the body read and checked (5, 6).

Step 7 follows from that principle; it isn't an exception to it. A USER's field rule ("she may not change `status`") is the one refusal that **needs the body**: whether she's changing the status depends on the value she sent, and that value has to be valid before it can be compared with the ticket's. So it can't run before the body is read, and it runs as soon as it can: right after validation. A USER sending `{"status": "BANANA"}` therefore gets the 400, and `{"status": "CLOSED"}` the 403. Step 8 is last for the same reason: a conflict only exists once the change is being written.

This order is why the same request can get different answers from different callers. `DELETE /tickets/999`, for a ticket that doesn't exist:

- a MANAGER gets **403**: step 2, her role can't delete anything, so whether the ticket exists is never asked.
- an ADMIN gets **404**: step 2 passes, and step 3 finds no ticket.

<!-- captured from the running backend: DELETE /api/v1/tickets/999 as kwame → 403 -->

```json
{
  "error": "FORBIDDEN",
  "message": "You don't have permission to do this."
}
```

<!-- captured from the running backend: DELETE /api/v1/tickets/999 as priya → 404 -->

```json
{
  "error": "NOT_FOUND",
  "message": "No ticket with id \"999\"."
}
```

## Tickets

### The Ticket object

<!-- captured from the running backend: GET /api/v1/tickets/1 as priya → 200 -->

```json
{
  "id": 1,
  "title": "Login page times out on slow networks",
  "description": "Users on mobile data report that the login page spins for over 30 seconds and then shows a timeout error. It works fine on office Wi-Fi.",
  "priority": "URGENT",
  "status": "OPEN",
  "team": "Engineering",
  "assigneeId": 2,
  "assigneeName": "Daniel Mensah",
  "createdById": 1,
  "createdByName": "Priya Sharma",
  "version": 0
}
```

| Field | Type | Rules |
| --- | --- | --- |
| `id` | integer | Chosen by the server. Positive, unique, never reused, never changed. |
| `title` | string | **Required.** At least **3** characters after trimming. |
| `description` | string | **Required.** Not empty after trimming. |
| `priority` | string | **Required.** One of `LOW`, `MEDIUM`, `HIGH`, `URGENT`. |
| `status` | string | One of `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`. Every new ticket starts as `OPEN`. |
| `team` | string | **Required.** One of `Engineering`, `Finance`, `HR`, `Operations`, `Support`. |
| `assigneeId` | integer or `null` | **Output only.** The user working the ticket, or `null` when nobody is assigned. Changed only through [`/tickets/{id}/assignee`](#patch-ticketsidassignee). |
| `assigneeName` | string or `null` | **Output only.** That user's name. `null` exactly when `assigneeId` is. |
| `createdById` | integer | **Output only.** The user who raised the ticket. Always set: the signed-in user who created it. |
| `createdByName` | string | **Output only.** That user's name. |
| `version` | integer | **Output only.** Goes up by at least 1 every time the ticket is changed. Nothing accepts it back yet. |

The people on a ticket are given by id and **name only**, never by email or role. A name is enough to show who is handling a ticket; an email is a login name, and a ticket list isn't the place to hand those out.

Any status can change to any other status; the frontend's "Move to …" button only suggests the next one.

Validation messages, used in `fields`:

| Field | Problem | Message |
| --- | --- | --- |
| `title` | missing, or empty after trimming | `Title is required.` |
| `title` | 1 or 2 characters after trimming | `Title must be at least 3 characters.` |
| `title` | not a string | `Title must be text.` |
| `description` | missing, or empty after trimming | `Description is required.` |
| `description` | not a string | `Description must be text.` |
| `priority` | missing, or not one of the four values | `Priority must be one of LOW, MEDIUM, HIGH or URGENT.` |
| `status` | not one of the four values | `Status must be one of OPEN, IN_PROGRESS, RESOLVED or CLOSED.` |
| `team` | missing, or not one of the five teams | `Team must be one of Engineering, Finance, HR, Operations or Support.` |
| `assigneeId`, `assigneeName` | sent on `PATCH /tickets/{id}`, with any value | `The assignee can't be changed here. Use PATCH /tickets/{id}/assignee.` |
| `assigneeId`, `assigneeName` | sent on `POST /tickets`, with any value | `The assignee can't be set here. Use PATCH /tickets/{id}/assignee.` |
| `createdById`, `createdByName` | sent, with any value | `The creator is set by the server and can't be sent.` |
| `version` | sent, with any value | `The version is set by the server and can't be sent.` |

### Visibility: a ticket you can't see is a 404

A USER sees only the tickets she created. Every other role sees every ticket. This applies everywhere: the list, its `totalItems`, and every endpoint with a ticket id in its path.

**A ticket that exists but that the caller may not see answers exactly as if it didn't exist:** the same 404, with the same body that a missing ticket with that id would get, byte for byte. The only thing that varies is the id the message quotes, and that's always the id the caller sent. A client must not tell its user that such a ticket "was deleted". All it knows is that this person can't see it, and a 404 never says more than that.

Here is ticket 2, which exists and belongs to Kwame, asked for by Fatima, and then ticket 999, which doesn't exist. Apart from the id each one quotes back, they're identical:

<!-- captured from the running backend: GET /api/v1/tickets/2 as fatima → 404 -->

```json
{
  "error": "NOT_FOUND",
  "message": "No ticket with id \"2\"."
}
```

<!-- captured from the running backend: GET /api/v1/tickets/999 as fatima → 404 -->

```json
{
  "error": "NOT_FOUND",
  "message": "No ticket with id \"999\"."
}
```

Writing this down gives nothing away. **What protects other people's tickets is the visibility rule**, which the server applies to every request. The identical 404 only makes sure the rule isn't leaked *through the error*: a 403 would confirm that the ticket exists and belongs to someone else, and would let a caller count other people's tickets by trying ids. Knowing that hidden and missing look alike tells a reader nothing about which tickets exist.

### GET /tickets

The tickets the caller may see.

- **Who:** any signed-in user. A USER gets only her own tickets.
- **Mock:** serves the plain array (the six Week 6 fields) and no query parameters.
- Query parameters: optional `page`, `size`, `status`, `priority`, `team`, `search` and `sort`, described in [Filtering, sorting and pagination](#filtering-sorting-and-pagination). Any other query parameter is refused with a 400.
- Request body: none.

**200 OK**, when none of the parameters is sent: a plain array of Ticket objects, sorted by `id`. An empty array `[]` when there are none (not a 404). For example, as Fatima, who can see two tickets:

<!-- captured from the running backend: GET /api/v1/tickets as fatima → 200 -->

```json
[
  {
    "id": 4,
    "title": "Update the holiday policy document",
    "description": "The holiday policy still lists last year's public holidays. Update the dates and the carry-over rules agreed at the last meeting.",
    "priority": "LOW",
    "status": "OPEN",
    "team": "HR",
    "assigneeId": null,
    "assigneeName": null,
    "createdById": 5,
    "createdByName": "Fatima Bello",
    "version": 0
  },
  {
    "id": 9,
    "title": "Schedule onboarding for new hires",
    "description": "Book onboarding sessions for this month's new hires, covering IT setup, security training and a team introduction.",
    "priority": "MEDIUM",
    "status": "RESOLVED",
    "team": "HR",
    "assigneeId": null,
    "assigneeName": null,
    "createdById": 5,
    "createdByName": "Fatima Bello",
    "version": 0
  }
]
```

Failures: 400 `VALIDATION_ERROR` when a parameter breaks its rules; 401.

#### Filtering, sorting and pagination

**The frontend doesn't call these yet**; it still pages, filters and searches a dozen tickets in the browser. The mock doesn't serve them.

**If none of these parameters is sent, the response stays the plain array**, so existing clients keep working. If any one is sent, even `?page=1`, the response is the envelope below.

| Query parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `page` | integer | `1` | Which page, counting from 1. Must be 1 or more. |
| `size` | integer | `10` | Tickets per page. From 1 to 100. |
| `status` | string | (every status) | One of `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`. |
| `priority` | string | (every priority) | One of `LOW`, `MEDIUM`, `HIGH`, `URGENT`. |
| `team` | string | (every team) | One of `Engineering`, `Finance`, `HR`, `Operations`, `Support`. |
| `search` | string | (none) | Keeps tickets whose `title` **or** `description` contains this text, ignoring case and leading and trailing spaces. `%`, `_` and `\` are ordinary characters. An empty `search=` keeps every ticket. |
| `sort` | string | `id` | One of `id`, `title`, `status`, `priority`, `team`, optionally followed by `,asc` or `,desc` (default `asc`). |

- **Search covers `title` and `description` only.** Both appear in every response for the tickets searched, so a search can never find a ticket by something its reader can't see.
- **Sorting orders by meaning, not by spelling.** `priority` sorts `LOW`, `MEDIUM`, `HIGH`, `URGENT`; `status` sorts `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`; `title` ignores case; `team` is alphabetical. Tickets with the same value are always in `id` order, so a page boundary falls in the same place on every request. Only one field can be sorted on.
- **Every parameter may be sent only once.** `?status=OPEN&status=CLOSED` is a 400, not "either".
- **An empty value is a 400** for every parameter except `search`. `status=` doesn't mean "any status".

Example: `GET /api/v1/tickets?status=OPEN&sort=priority,desc&size=2&page=2`, as Priya:

<!-- captured from the running backend: GET /api/v1/tickets?status=OPEN&sort=priority,desc&size=2&page=2 as priya → 200 -->

```json
{
  "items": [
    {
      "id": 2,
      "title": "Order new laptops for the March starters",
      "description": "Four new starters join on 3 March. Order laptops with the standard developer setup and have them ready the Friday before.",
      "priority": "MEDIUM",
      "status": "OPEN",
      "team": "Operations",
      "assigneeId": null,
      "assigneeName": null,
      "createdById": 3,
      "createdByName": "Kwame Asante",
      "version": 0
    },
    {
      "id": 4,
      "title": "Update the holiday policy document",
      "description": "The holiday policy still lists last year's public holidays. Update the dates and the carry-over rules agreed at the last meeting.",
      "priority": "LOW",
      "status": "OPEN",
      "team": "HR",
      "assigneeId": null,
      "assigneeName": null,
      "createdById": 5,
      "createdByName": "Fatima Bello",
      "version": 0
    }
  ],
  "page": 2,
  "size": 2,
  "totalItems": 4,
  "totalPages": 2
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `items` | Ticket[] | This page's tickets, after the filters, in the requested order. |
| `page` | integer | The page returned. |
| `size` | integer | The page size used. |
| `totalItems` | integer | How many tickets match the filters, across all pages. Only tickets the caller may see are counted. |
| `totalPages` | integer | `ceil(totalItems / size)`, and `0` when nothing matches. |

A `page` beyond the last one is not an error: it returns `200` with `"items": []` and the real totals.

**Each page is computed when it's asked for.** Page 2 means "skip `size` tickets, take the next `size`" at the moment page 2 is requested. If tickets are created, deleted or changed between a client's request for page 1 and its request for page 2, a ticket can appear on both pages or on neither. Sorting by `status` or `priority` makes this likelier, because a change then moves a ticket within the order. A client that needs a stable list should reload from page 1.

**400 Bad Request, `VALIDATION_ERROR`**: a parameter breaks its rules. The keys in `fields` are the parameter names, and every failing parameter is listed:

<!-- captured from the running backend: GET /api/v1/tickets?size=500&status=OPEN&status=CLOSED&stauts=OPEN as priya → 400 -->

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Size must be a whole number from 1 to 100. Status can only be sent once. There is no query parameter called \"stauts\".",
  "fields": {
    "size": "Size must be a whole number from 1 to 100.",
    "status": "Status can only be sent once.",
    "stauts": "There is no query parameter called \"stauts\"."
  }
}
```

| Parameter | Problem | Message |
| --- | --- | --- |
| `page` | not a whole number of 1 or more, or empty | `Page must be a whole number, 1 or more.` |
| `size` | not a whole number from 1 to 100, or empty | `Size must be a whole number from 1 to 100.` |
| `status` | not one of the four values, or empty | `Status must be one of OPEN, IN_PROGRESS, RESOLVED or CLOSED.` |
| `priority` | not one of the four values, or empty | `Priority must be one of LOW, MEDIUM, HIGH or URGENT.` |
| `team` | not one of the five teams, or empty | `Team must be one of Engineering, Finance, HR, Operations or Support.` |
| `sort` | anything but the fifteen spellings above, or empty | `Sort must be id, title, status, priority or team, optionally followed by ,asc or ,desc.` |
| any of them | sent more than once | `Page can only be sent once.` (with the parameter's own name) |
| any other name | not a parameter of `GET /tickets` | `There is no query parameter called "stauts".` (with the name sent) |

### GET /tickets/{id}

One ticket.

- **Who:** any signed-in user who may see it. A USER may see only her own.
- **Mock:** serves it, with the six Week 6 fields.

| Path parameter | Type | Rules |
| --- | --- | --- |
| `id` | integer | The ticket's id. |

- Request body: none.

**200 OK**: the Ticket object.

<!-- captured from the running backend: GET /api/v1/tickets/4 as fatima → 200 -->

```json
{
  "id": 4,
  "title": "Update the holiday policy document",
  "description": "The holiday policy still lists last year's public holidays. Update the dates and the carry-over rules agreed at the last meeting.",
  "priority": "LOW",
  "status": "OPEN",
  "team": "HR",
  "assigneeId": null,
  "assigneeName": null,
  "createdById": 5,
  "createdByName": "Fatima Bello",
  "version": 0
}
```

**404 Not Found**: no ticket has that id, the id isn't a whole number, **or the caller may not see it** ([Visibility](#visibility-a-ticket-you-cant-see-is-a-404)).

<!-- captured from the running backend: GET /api/v1/tickets/abc as priya → 404 -->

```json
{
  "error": "NOT_FOUND",
  "message": "No ticket with id \"abc\"."
}
```

### POST /tickets

Create a ticket. Its creator is the signed-in user, and it starts as `OPEN` and unassigned.

- **Who:** any signed-in user.
- **Mock:** serves it, with the six Week 6 fields and no creator.

Request body:

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | Required, at least 3 characters after trimming. |
| `description` | string | Required, not empty after trimming. |
| `priority` | string | Required. `LOW`, `MEDIUM`, `HIGH` or `URGENT`. |
| `team` | string | Required. `Engineering`, `Finance`, `HR`, `Operations` or `Support`. |

`id` and `status` are **ignored** if sent. The output-only fields are **refused** if sent: a new ticket is assigned afterwards, through `PATCH /tickets/{id}/assignee`.

```json
{
  "title": "Printer on the second floor is jammed",
  "description": "It shows error E-42 and nothing prints.",
  "priority": "HIGH",
  "team": "Operations"
}
```

**201 Created**: the new Ticket, with its `id`, `status`, creator and `version`. As Fatima:

<!-- captured from the running backend: POST /api/v1/tickets as fatima with {"title": "Printer on the second floor is jammed", "description": "It shows error E-42 and nothing prints.", "priority": "HIGH", "team": "Operations"} → 201 -->

```json
{
  "id": 13,
  "title": "Printer on the second floor is jammed",
  "description": "It shows error E-42 and nothing prints.",
  "priority": "HIGH",
  "status": "OPEN",
  "team": "Operations",
  "assigneeId": null,
  "assigneeName": null,
  "createdById": 5,
  "createdByName": "Fatima Bello",
  "version": 0
}
```

**400 Bad Request, `BAD_REQUEST`**: the body isn't valid JSON, isn't a JSON object (for example `[]` or `"hello"`), or isn't sent as JSON.

<!-- captured from the running backend: POST /api/v1/tickets as fatima with [] → 400 -->

```json
{
  "error": "BAD_REQUEST",
  "message": "The request body must be a JSON object."
}
```

**400 Bad Request, `VALIDATION_ERROR`**: one or more fields break the rules. Every invalid field is listed.

<!-- captured from the running backend: POST /api/v1/tickets as fatima with {"title": "  ", "description": "x", "priority": "HIGH", "team": "Marketing", "assigneeId": 2} → 400 -->

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Title is required. Team must be one of Engineering, Finance, HR, Operations or Support. The assignee can't be set here. Use PATCH /tickets/{id}/assignee.",
  "fields": {
    "title": "Title is required.",
    "team": "Team must be one of Engineering, Finance, HR, Operations or Support.",
    "assigneeId": "The assignee can't be set here. Use PATCH /tickets/{id}/assignee."
  }
}
```

### PATCH /tickets/{id}

Change some of a ticket's fields. Only the fields sent are changed; everything else stays as it was. An empty object `{}` is allowed and changes nothing.

- **Who:** depends on the ticket ([the permission table](#the-permission-table)): an ADMIN or MANAGER any ticket, an AGENT only a ticket assigned to them, a USER only her own `OPEN` ticket, and only its `title` and `description`.
- **Mock:** serves it, with no permissions and the six Week 6 fields.

| Path parameter | Type | Rules |
| --- | --- | --- |
| `id` | integer | The ticket's id. |

Request body: **any** of these fields, each following the same rules as on the Ticket object.

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | At least 3 characters after trimming. |
| `description` | string | Not empty after trimming. |
| `priority` | string | `LOW`, `MEDIUM`, `HIGH` or `URGENT`. |
| `status` | string | `OPEN`, `IN_PROGRESS`, `RESOLVED` or `CLOSED`. |
| `team` | string | `Engineering`, `Finance`, `HR`, `Operations` or `Support`. |

`id` is ignored if sent. The output-only fields are refused.

#### Send only the fields being changed

**A PATCH is expected to carry only the fields the person actually changed.** A client that sends the whole form, including the fields nobody touched, sends the values it *loaded*, and those may no longer be the ticket's values. The server can't tell "I want the status to be `OPEN`" from "the status was `OPEN` when my page loaded": the two are the same bytes.

What happens then depends on who is saving:

- **A USER gets a 403.** Her form sends the old `priority` or `status`. If someone has since changed it, her request is changing it back, which a USER may not do. Nothing is written, but she's told she lacks permission when she only edited the title.
- **An ADMIN, MANAGER or AGENT silently reverts the other change.** Daniel opens ticket 1, Kwame moves it to `IN_PROGRESS`, and Daniel fixes a typo in the title and saves the whole form. His request sends `"status": "OPEN"`, which is different from the ticket's status, so it's applied. Kwame's change is undone, with no error for either of them.

**A field sent with the value it already has is not a change.** So a USER's whole-form save from an *up-to-date* page succeeds, as long as only `title` or `description` differ. That's what keeps today's edit form working, and it's exactly what fails the moment the page is out of date.

**The frontend's edit form sends every field today. That's a bug in the frontend, and this is where it's named:** the form should compare its values with the ticket as loaded, and send only the ones that differ. A client whose page may be out of date should reload the ticket first. (The server can't fix this alone; nothing in the request says which values were meant.)

```json
{
  "status": "RESOLVED"
}
```

**200 OK**: the whole updated Ticket. `version` has gone up. As Daniel, assigned ticket 1:

<!-- captured from the running backend: PATCH /api/v1/tickets/1 as daniel with {"status": "RESOLVED"} → 200 -->

```json
{
  "id": 1,
  "title": "Login page times out on slow networks",
  "description": "Users on mobile data report that the login page spins for over 30 seconds and then shows a timeout error. It works fine on office Wi-Fi.",
  "priority": "URGENT",
  "status": "RESOLVED",
  "team": "Engineering",
  "assigneeId": 2,
  "assigneeName": "Daniel Mensah",
  "createdById": 1,
  "createdByName": "Priya Sharma",
  "version": 1
}
```

**403 Forbidden**: the caller may not edit this ticket (step 4 of [the order](#the-order-of-the-checks)), or a USER's request changes a field she may not change (step 7). As Fatima, whose ticket 4 is `OPEN`, changing its status:

<!-- captured from the running backend: PATCH /api/v1/tickets/4 as fatima with {"status": "CLOSED"} → 403 -->

```json
{
  "error": "FORBIDDEN",
  "message": "You don't have permission to do this."
}
```

**404 Not Found**: no ticket has that id, or the caller may not see it. Decided before the body is read.

<!-- captured from the running backend: PATCH /api/v1/tickets/999 as priya with {"status": "RESOLVED"} → 404 -->

```json
{
  "error": "NOT_FOUND",
  "message": "No ticket with id \"999\"."
}
```

**400 Bad Request, `BAD_REQUEST`**: the body isn't a JSON object.

<!-- captured from the running backend: PATCH /api/v1/tickets/1 as priya with "hello" → 400 -->

```json
{
  "error": "BAD_REQUEST",
  "message": "The request body must be a JSON object."
}
```

**400 Bad Request, `VALIDATION_ERROR`**: a field that was sent breaks the rules, or an output-only field was sent.

<!-- captured from the running backend: PATCH /api/v1/tickets/1 as daniel with {"status": "DONE", "assigneeId": 4} → 400 -->

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Status must be one of OPEN, IN_PROGRESS, RESOLVED or CLOSED. The assignee can't be changed here. Use PATCH /tickets/{id}/assignee.",
  "fields": {
    "status": "Status must be one of OPEN, IN_PROGRESS, RESOLVED or CLOSED.",
    "assigneeId": "The assignee can't be changed here. Use PATCH /tickets/{id}/assignee."
  }
}
```

**409 Conflict**: someone else changed the ticket in the moment between this request reading it and writing it. Nothing was written. Reload the ticket, look at what changed, and send the change again if it still makes sense. The server never retries by itself, because only the person knows whether their change still makes sense on top of the other one.

```json
{
  "error": "CONFLICT",
  "message": "Someone else changed this at the same time. Reload it and try again."
}
```

This is the one hand-written example in this document. It isn't captured, because it needs two requests to overlap within milliseconds, which no single request can trigger on demand. It's **pinned by `GlobalExceptionHandlerTest`** in the backend, which asserts this exact status, code and message. That makes it better evidence than a capture, not worse: a test fails the moment the backend drifts from it, while a capture just goes quietly stale.

A 409 only covers requests that overlap in time. A client saving a page that was loaded minutes ago gets no 409, however much has changed since: see [Send only the fields being changed](#send-only-the-fields-being-changed).

### DELETE /tickets/{id}

Delete a ticket for good. Its id is never reused.

- **Who:** an ADMIN.
- **Mock:** serves it, with no permissions.

| Path parameter | Type | Rules |
| --- | --- | --- |
| `id` | integer | The ticket's id. |

- Request body: none.

**204 No Content**: deleted. The response has **no body**.

**403 Forbidden**: the caller isn't an ADMIN. Decided before the ticket is looked up, so a MANAGER gets 403 even for a ticket that doesn't exist.

**404 Not Found**: no ticket has that id (including one that was already deleted). Only an ADMIN gets this far.

### PATCH /tickets/{id}/assignee

Assign a ticket to a user.

- **Who:** an ADMIN or MANAGER.
- **Mock:** doesn't serve it.

Request body:

| Field | Type | Rules |
| --- | --- | --- |
| `assigneeId` | integer | **Required.** The id of an ADMIN, MANAGER or AGENT. A USER can't be assigned tickets. |

```json
{
  "assigneeId": 2
}
```

**200 OK**: the whole updated Ticket, with `version` up by one. Assigning a ticket to the person who already has it is not an error: it answers 200, writes nothing, and `version` stays the same. Kwame assigning the unassigned ticket 2 to Daniel:

<!-- captured from the running backend: PATCH /api/v1/tickets/2/assignee as kwame with {"assigneeId": 2} → 200 -->

```json
{
  "id": 2,
  "title": "Order new laptops for the March starters",
  "description": "Four new starters join on 3 March. Order laptops with the standard developer setup and have them ready the Friday before.",
  "priority": "MEDIUM",
  "status": "OPEN",
  "team": "Operations",
  "assigneeId": 2,
  "assigneeName": "Daniel Mensah",
  "createdById": 3,
  "createdByName": "Kwame Asante",
  "version": 1
}
```

**403 Forbidden**: the caller isn't an ADMIN or MANAGER. Decided first, before the ticket is looked up.

**404 Not Found**: no ticket has that id.

**400 Bad Request, `VALIDATION_ERROR`**, on `assigneeId`:

<!-- captured from the running backend: PATCH /api/v1/tickets/2/assignee as kwame with {"assigneeId": 5} → 400 -->

```json
{
  "error": "VALIDATION_ERROR",
  "message": "A USER can't be assigned tickets.",
  "fields": {
    "assigneeId": "A USER can't be assigned tickets."
  }
}
```

| Problem | Message |
| --- | --- |
| missing | `Assignee id is required.` |
| not a whole number of 1 or more | `Assignee id must be a positive whole number.` |
| no user has that id | `No user with id 99.` (with the id sent) |
| that user is a USER | `A USER can't be assigned tickets.` |

To find who can be assigned, use `GET /users` and keep the users whose `role` isn't `USER`.

That filter is **a copy of a server rule**, and it's a known duplication, not an oversight: the assign endpoint makes the same check, and if the two ever differ the endpoint wins with a 400. The better shape would be a server-side filter (for example `GET /users?assignable=true`), so the rule lives in one place. It isn't built yet: there's one client, and the endpoint refuses a USER whatever the client offers.

### DELETE /tickets/{id}/assignee

Unassign a ticket. (Not `{"assigneeId": null}`: that's refused, so a missing field can never unassign by accident.)

- **Who:** an ADMIN or MANAGER.
- **Mock:** doesn't serve it.
- Request body: none.

**200 OK**: the whole updated Ticket, with `assigneeId` and `assigneeName` both `null`. Unassigning a ticket nobody has is not an error.

<!-- captured from the running backend: DELETE /api/v1/tickets/2/assignee as kwame → 200 -->

```json
{
  "id": 2,
  "title": "Order new laptops for the March starters",
  "description": "Four new starters join on 3 March. Order laptops with the standard developer setup and have them ready the Friday before.",
  "priority": "MEDIUM",
  "status": "OPEN",
  "team": "Operations",
  "assigneeId": null,
  "assigneeName": null,
  "createdById": 3,
  "createdByName": "Kwame Asante",
  "version": 2
}
```

**403 Forbidden**: the caller isn't an ADMIN or MANAGER. **404 Not Found**: no ticket has that id.

## Projects

Projects are **read-only** in v1: there are no endpoints to create, change or delete them.

### The Project object

<!-- captured from the running backend: GET /api/v1/projects/2 as fatima → 200 -->

```json
{
  "id": 2,
  "name": "New office move",
  "description": "Plan and run the move to the new Accra office, including desks and network.",
  "status": "PLANNING",
  "team": "Operations",
  "lead": "Kwame Asante"
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | integer | Chosen by the server. |
| `name` | string | The project's name. |
| `description` | string | What the project is for. |
| `status` | string | One of `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`. |
| `team` | string | The team that owns it: one of the five ticket teams. |
| `lead` | string | The full name of the person leading it. |

### GET /projects

Every project, sorted by `id`.

- **Who:** any signed-in user.
- **Mock:** serves it.
- Path and query parameters: none.

**200 OK**: an array of Project objects. An empty array `[]` when there are none.

### GET /projects/{id}

One project. Used by the frontend's project page, `/projects/:id`.

- **Who:** any signed-in user.
- **Mock:** serves it.

**200 OK**: the Project object (see the example above).

**404 Not Found**: no project has that id, or the id isn't a whole number.

<!-- captured from the running backend: GET /api/v1/projects/999 as fatima → 404 -->

```json
{
  "error": "NOT_FOUND",
  "message": "No project with id \"999\"."
}
```

## Users

### The User object

<!-- captured from the running backend: GET /api/v1/auth/me as kwame → 200 -->

```json
{
  "id": 3,
  "name": "Kwame Asante",
  "username": "kwame.asante",
  "email": "kwame.asante@opsdesk.com",
  "role": "MANAGER",
  "phone": "",
  "address": {
    "street": "",
    "suite": "",
    "city": "",
    "zipcode": ""
  },
  "company": {
    "name": ""
  }
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | integer | Chosen by the server. |
| `name` | string | Full name. |
| `username` | string | A short handle, shown as `@username`. Unique, and always lowercase. |
| `email` | string | Email address, used to sign in. Unique, and always lowercase. |
| `role` | string | `ADMIN`, `MANAGER`, `AGENT` or `USER`. What this user may do ([the permission table](#the-permission-table)). |
| `phone` | string | **Deprecated.** Always `""`. |
| `address` | object | **Deprecated.** `street`, `suite`, `city`, `zipcode`, all always `""`. |
| `company` | object | **Deprecated.** `name`, always `""`. |

A User object **never** includes a password or a password hash, in any response.

**`phone`, `address` and `company` are deprecated.** They came from JSONPlaceholder, which the Users page read until Week 6, and OpsDesk stores no such data: the backend has nowhere to keep them, so they're always empty strings. An empty string suggests the data exists and happens to be blank, which isn't true. They stay in v1, because removing a field breaks a client that reads it (the frontend's user card reads `company.name` and `address.city`, and hides them when empty). They will be removed in the next version. **New code must not read them.**

### GET /users

Every user, sorted by `id`.

- **Who:** an ADMIN or MANAGER.
- **Mock:** serves it, with JSONPlaceholder-style data and no `role`.
- Path and query parameters: none.

**200 OK**: an array of User objects.

**403 Forbidden**: the caller is an AGENT or a USER.

<!-- captured from the running backend: GET /api/v1/users as fatima → 403 -->

```json
{
  "error": "FORBIDDEN",
  "message": "You don't have permission to do this."
}
```

## Auth

`POST /auth/register` and `POST /auth/login` are the only endpoints that don't need a token. **The frontend doesn't call any of the three yet**, and the mock doesn't serve them.

### POST /auth/register

Create a new account. It's always a `USER`.

Request body:

| Field | Type | Rules | Message when broken |
| --- | --- | --- | --- |
| `name` | string | Required, not empty after trimming. | `Name is required.` |
| `username` | string | Required, 3 to 30 characters: letters, numbers, `_` and `.` only. Stored lowercase, so `Ama.Owusu` and `ama.owusu` are the same username. | `Username must be 3 to 30 letters, numbers, dots or underscores.` |
| `email` | string | Required, a valid email address. Stored lowercase, so it's compared without regard to case. Not trimmed. | `Enter a valid email address.` |
| `password` | string | Required, at least 8 characters, and **at most 72 bytes** in UTF-8. Never trimmed, and never stored as sent: only a salted hash is kept. | `Password must be at least 8 characters.`, or `Password must be at most 72 bytes.` |

**Why 72 bytes, and why bytes:** the password hash (BCrypt) only ever reads the first 72 bytes. A longer password would be accepted, and every character after the 72nd byte would be silently ignored. It's counted in bytes because that's what BCrypt counts: an `é` is 2 bytes and many emoji are 4, so a password can be well under 72 characters and still too long.

```json
{
  "name": "Ama Owusu",
  "username": "Ama.Owusu",
  "email": "Ama@Example.com",
  "password": "correct-horse-battery"
}
```

**201 Created**: the new User (with no password). Note the lowercased `username` and `email`:

<!-- captured from the running backend: POST /api/v1/auth/register with {"name": "Ama Owusu", "username": "Ama.Owusu", "email": "Ama@Example.com", "password": "correct-horse-battery"} → 201 -->

```json
{
  "id": 7,
  "name": "Ama Owusu",
  "username": "ama.owusu",
  "email": "ama@example.com",
  "role": "USER",
  "phone": "",
  "address": {
    "street": "",
    "suite": "",
    "city": "",
    "zipcode": ""
  },
  "company": {
    "name": ""
  }
}
```

**400 Bad Request, `BAD_REQUEST`**: the body isn't a JSON object.

**400 Bad Request, `VALIDATION_ERROR`**: one or more fields break the rules.

<!-- captured from the running backend: POST /api/v1/auth/register with {"name": "Ama", "username": "ama", "email": "not-an-email", "password": "short"} → 400 -->

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Enter a valid email address. Password must be at least 8 characters.",
  "fields": {
    "email": "Enter a valid email address.",
    "password": "Password must be at least 8 characters."
  }
}
```

**409 Conflict**: an account with that email, or that username, already exists. The email is checked first.

<!-- captured from the running backend: POST /api/v1/auth/register with {"name": "Ama Again", "username": "ama.owusu", "email": "ama@example.com", "password": "correct-horse-battery"} → 409 -->

```json
{
  "error": "CONFLICT",
  "message": "An account with this email already exists."
}
```

<!-- captured from the running backend: POST /api/v1/auth/register with {"name": "Ama Again", "username": "AMA.OWUSU", "email": "ama.second@example.com", "password": "correct-horse-battery"} → 409 -->

```json
{
  "error": "CONFLICT",
  "message": "An account with this username already exists."
}
```

### POST /auth/login

Sign in with an email and password.

Request body:

| Field | Type | Rules | Message when broken |
| --- | --- | --- | --- |
| `email` | string | Required. Compared without regard to case. | `Email is required.` |
| `password` | string | Required. | `Password is required.` |

```json
{
  "email": "ama@example.com",
  "password": "correct-horse-battery"
}
```

**200 OK**: the token, and the signed-in user. Send the token on every other request ([Signing in and the token](#signing-in-and-the-token)). A login creates nothing on the server, so it's a 200, not a 201. (The `token` below is shortened to its first 20 characters, the one deliberate edit to a captured response in this document: a usable token doesn't belong in a published file. A real one is a few hundred characters.)

<!-- captured from the running backend: POST /api/v1/auth/login with {"email": "AMA@example.com", "password": "correct-horse-battery"} → 200 -->

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9…",
  "user": {
    "id": 7,
    "name": "Ama Owusu",
    "username": "ama.owusu",
    "email": "ama@example.com",
    "role": "USER",
    "phone": "",
    "address": {
      "street": "",
      "suite": "",
      "city": "",
      "zipcode": ""
    },
    "company": {
      "name": ""
    }
  }
}
```

**400 Bad Request, `BAD_REQUEST`**: the body isn't a JSON object.

**400 Bad Request, `VALIDATION_ERROR`**: the email or password is missing.

<!-- captured from the running backend: POST /api/v1/auth/login with {"email": "ama@example.com"} → 400 -->

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Password is required.",
  "fields": {
    "password": "Password is required."
  }
}
```

**401 Unauthorized**: the email isn't registered, **or** the password is wrong. Both get exactly the same answer, and take about as long, so the response never reveals which emails have accounts.

<!-- captured from the running backend: POST /api/v1/auth/login with {"email": "ama@example.com", "password": "wrong-password"} → 401 -->

```json
{
  "error": "UNAUTHORIZED",
  "message": "The email or password is incorrect."
}
```

### GET /auth/me

The signed-in user. This is how a client learns its own `role`.

- **Who:** any signed-in user.

**200 OK**: the User object (see [the example above](#the-user-object)).

**401 Unauthorized**: no valid token.

## Promises that a future version may change

Two things in this contract are promises that cost more as the data grows. They hold for all of v1. Changing either needs a new version:

- **Search finds text anywhere in a title or description** ("contains"), not only at the start. That's what makes a search read every ticket, whatever the database indexes. It's fine at today's size; at tens of thousands of tickets the choice is between searching from the start of a word, which would change what a search finds, and a different kind of index.
- **`totalItems` is exact.** For a caller who sees every ticket, counting means counting every ticket. At hundreds of thousands of tickets, a future version may make it approximate, cap it ("more than 10,000"), or leave it out and say only whether there's a next page. Each of those changes what a client can show ("page 3 of 412").

## Mock-only endpoint (not part of the API)

The mock API has one extra endpoint that exists only to make development easier. **The backend must not build it.**

| Endpoint | What it does |
| --- | --- |
| `POST /tickets/reset` | Throws away every change and restores the sample tickets. It answers `200` with the full list of sample tickets. Used by the "Reset to sample data" button, which works only with the mock. |

It breaks this contract's "no verbs in paths" rule on purpose, and it's left out of the rules above because it isn't part of the API: it's a reset switch for the mock's in-browser database.
