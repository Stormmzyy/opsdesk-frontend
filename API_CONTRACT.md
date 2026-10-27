# OpsDesk API contract (v1)

OpsDesk is an internal operations desk: staff raise support **tickets**, move them through a workflow (Open → In progress → Resolved → Closed), and see what each team is working on through **projects** and a **users** directory.

This document is the agreement between the frontend and the backend. It says exactly which requests the frontend sends and exactly what it expects back. **The Week 6 backend is built against this document**, and if the frontend and this document ever disagree, this document wins and the code is fixed.

**The frontend talks to the real backend (opsdesk-backend) by default.** When `VITE_USE_MOCK_API=true`, a mock API built with [Mock Service Worker (MSW)](https://mswjs.io/) stands in for it instead, answering requests inside the browser (`src/mocks/handlers.ts`), so the frontend can be worked on without the backend running. The mock follows this contract exactly for every endpoint marked IMPLEMENTED, and is still checked against it by `src/mocks/handlers.test.ts`.

Every endpoint is marked with one of:

| Label | Meaning |
| --- | --- |
| **IMPLEMENTED** | The mock API serves it today, and the frontend uses it. The backend must behave exactly as described. |
| **SPECIFIED** | The backend must build it, but the frontend doesn't call it yet. The mock doesn't serve it. |

## Contents

- [Conventions](#conventions)
- [Errors](#errors)
- [Status codes](#status-codes)
- [Tickets](#tickets)
- [Projects](#projects)
- [Users](#users)
- [Auth](#auth)
- [Mock-only endpoint](#mock-only-endpoint-not-part-of-the-api)

## Conventions

### Base URL and versioning

Every path in this document is relative to the base URL:

```
/api/v1
```

So `GET /tickets` means `GET /api/v1/tickets`. The frontend reads the base URL from the `VITE_API_URL` environment variable (default `/api/v1`), so the backend can live on another host, for example `https://api.example.com/api/v1`.

`v1` is the version of this contract. Changes that don't break existing clients (a new endpoint, a new optional field in a response) can be added to v1. A change that would break the frontend (renaming or removing a field, changing a type or a status code) needs a new version, `/api/v2`, served alongside v1 until the frontend has moved.

### Paths

- Resources are **plural nouns**: `/tickets`, `/projects`, `/users`, `/sessions`.
- One item is the collection plus its id: `/tickets/3`.
- **No verbs in paths.** The HTTP method says what happens: `GET` reads, `POST` creates, `PATCH` changes some fields, `DELETE` removes. That's why logging in is `POST /sessions` ("create a session") and registering is `POST /users` ("create a user"), not `/login` and `/register`.

### Requests and responses

- Request and response bodies are **JSON**. Requests that send a body must set `Content-Type: application/json`.
- Field names are **camelCase**, for example `totalItems`.
- **Ids are positive whole numbers** (`1`, `2`, `3` …), chosen by the server. Clients never choose an id.
- In a path, an id that isn't a whole number (`/tickets/abc`, `/tickets/3.5`, `/tickets/-1`) is treated the same as an id that doesn't exist: **404 `NOT_FOUND`**.
- Fields the server doesn't recognise in a request body are **ignored**, not rejected.
- Lists are returned as a **plain JSON array**, sorted by `id`, oldest first. (`GET /tickets` can also return one page at a time; see [Pagination and filtering](#pagination-and-filtering).)
- Free-text fields (a ticket's `title` and `description`) are **trimmed**: leading and trailing spaces are removed before the value is checked and saved. Fields with a fixed set of values (`priority`, `status`, `team`) are not trimmed: `" Support "` is not a valid team.

## Errors

### The error shape

**Every** failing request, on every endpoint, answers with this JSON body:

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
| `fields` | object | **only** for `VALIDATION_ERROR` | One entry per invalid field: the key is the field name from the request body, the value is a message for that field. Fields that are fine are left out. |

For a `VALIDATION_ERROR`, `message` repeats the field messages joined into one sentence, so a client that ignores `fields` can still show something useful.

### Error codes

This is the complete list. The backend must not invent others without updating this document.

| Code | Status | When |
| --- | --- | --- |
| `BAD_REQUEST` | 400 | The request can't be read at all: the body isn't valid JSON, or isn't a JSON object. |
| `VALIDATION_ERROR` | 400 | The body was read, but one or more fields break the rules. `fields` says which. |
| `UNAUTHORIZED` | 401 | Login failed: the email or password is wrong. (From Week 8, also: a request that needs a signed-in user had none.) |
| `NOT_FOUND` | 404 | The resource doesn't exist: no item with that id, an id that isn't a whole number, or a path that doesn't exist. |
| `CONFLICT` | 409 | The request clashes with data that already exists: registering an email that's already taken. |
| `INTERNAL_ERROR` | 500 | Something went wrong on the server that isn't the client's fault. The message must not include stack traces, SQL or other internals. |

## Status codes

| Code | Name | Used for |
| --- | --- | --- |
| **200** | OK | A successful read (`GET`) or update (`PATCH`). The body is the requested or updated data. |
| **201** | Created | A successful `POST` that created something. The body is the new item, including its server-chosen `id`. |
| **204** | No Content | A successful `DELETE`. There is **no body** at all. |
| **400** | Bad Request | `BAD_REQUEST` or `VALIDATION_ERROR`. The client must fix the request before sending it again. |
| **401** | Unauthorized | `UNAUTHORIZED`. |
| **404** | Not Found | `NOT_FOUND`. |
| **409** | Conflict | `CONFLICT`. |
| **500** | Internal Server Error | `INTERNAL_ERROR`. **Any** endpoint can answer 500, so it isn't repeated under each one below. The client may retry. |

When a request has more than one problem, the server checks in this order and answers with the first that applies: **404** (the item doesn't exist), then **400 `BAD_REQUEST`** (the body can't be read), then **400 `VALIDATION_ERROR`** (with every invalid field listed together, not just the first).

## Tickets

### The Ticket object

```json
{
  "id": 1,
  "title": "Login page times out on slow networks",
  "description": "Users on mobile data report that the login page spins for over 30 seconds and then shows a timeout error. It works fine on office Wi-Fi.",
  "priority": "URGENT",
  "status": "OPEN",
  "team": "Engineering"
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

Any status can change to any other status; the frontend's "Move to …" button only suggests the next one.

Validation messages, used in `fields` (the frontend's form shows the same ones):

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

### GET /tickets

**IMPLEMENTED.** Every ticket.

- Path parameters: none.
- Query parameters: optional `page`, `size`, `status` and `search`, described in [Pagination and filtering](#pagination-and-filtering) below. Any other query parameter is ignored.
- Request body: none.

**200 OK**, when none of `page`, `size`, `status` or `search` is sent: an array of Ticket objects, sorted by `id`. An empty array `[]` when there are no tickets (not a 404).

```json
[
  {
    "id": 1,
    "title": "Login page times out on slow networks",
    "description": "Users on mobile data report that the login page spins for over 30 seconds and then shows a timeout error. It works fine on office Wi-Fi.",
    "priority": "URGENT",
    "status": "OPEN",
    "team": "Engineering"
  },
  {
    "id": 2,
    "title": "Order new laptops for the March starters",
    "description": "Four new starters join on 3 March. Order laptops with the standard developer setup and have them ready the Friday before.",
    "priority": "MEDIUM",
    "status": "OPEN",
    "team": "Operations"
  }
]
```

Failures: 400 `VALIDATION_ERROR` when a pagination parameter is invalid (see [Pagination and filtering](#pagination-and-filtering)); otherwise only 500 (see [Status codes](#status-codes)).

#### Pagination and filtering

**SPECIFIED.** The backend must build this; the frontend doesn't call it yet. The mock doesn't serve it.

The frontend currently paginates, searches and filters tickets **in the browser**, because the dataset is small (a dozen tickets).

`GET /tickets` accepts these query parameters. **If none of them is sent, the response stays the plain v1 array**, so existing clients keep working. If any one is sent, the response is the envelope below.

| Query parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `page` | integer | `1` | Which page, counting from 1. Must be 1 or more. |
| `size` | integer | `10` | Tickets per page. From 1 to 100. |
| `status` | string | (none: every status) | One of `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`. |
| `search` | string | (none) | Keeps tickets whose `title` **or** `description` contains this text, ignoring case and leading and trailing spaces. |

Example: `GET /api/v1/tickets?page=2&size=10&status=OPEN&search=printer`

**200 OK**: an envelope with one page of tickets.

```json
{
  "items": [
    {
      "id": 14,
      "title": "Printer on the third floor is out of toner",
      "description": "The printer by the kitchen says the toner is empty.",
      "priority": "LOW",
      "status": "OPEN",
      "team": "Operations"
    }
  ],
  "page": 2,
  "size": 10,
  "totalItems": 11,
  "totalPages": 2
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `items` | Ticket[] | This page's tickets, sorted by `id`, after the filters are applied. |
| `page` | integer | The page returned. |
| `size` | integer | The page size used. |
| `totalItems` | integer | How many tickets match the filters, across all pages. |
| `totalPages` | integer | `ceil(totalItems / size)`, and `0` when nothing matches. |

A `page` beyond the last one is not an error: it returns `200` with `"items": []` and the real totals.

**400 Bad Request, `VALIDATION_ERROR`**: a query parameter breaks its rules. The keys in `fields` are the parameter names.

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Size must be a whole number from 1 to 100.",
  "fields": {
    "size": "Size must be a whole number from 1 to 100."
  }
}
```

| Parameter | Message |
| --- | --- |
| `page` | `Page must be a whole number, 1 or more.` |
| `size` | `Size must be a whole number from 1 to 100.` |
| `status` | `Status must be one of OPEN, IN_PROGRESS, RESOLVED or CLOSED.` |

### GET /tickets/{id}

**IMPLEMENTED.** One ticket.

| Path parameter | Type | Rules |
| --- | --- | --- |
| `id` | integer | The ticket's id. |

- Query parameters: none.
- Request body: none.

**200 OK**: the Ticket object.

```json
{
  "id": 2,
  "title": "Order new laptops for the March starters",
  "description": "Four new starters join on 3 March. Order laptops with the standard developer setup and have them ready the Friday before.",
  "priority": "MEDIUM",
  "status": "OPEN",
  "team": "Operations"
}
```

**404 Not Found**: no ticket has that id, or the id isn't a whole number (`/tickets/abc`).

```json
{
  "error": "NOT_FOUND",
  "message": "No ticket with id \"999\"."
}
```

### POST /tickets

**IMPLEMENTED.** Create a ticket.

- Path and query parameters: none.

Request body:

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | Required, at least 3 characters after trimming. |
| `description` | string | Required, not empty after trimming. |
| `priority` | string | Required. `LOW`, `MEDIUM`, `HIGH` or `URGENT`. |
| `team` | string | Required. `Engineering`, `Finance`, `HR`, `Operations` or `Support`. |

`id` and `status` are **not** accepted: if sent, they're ignored. The server picks the id, and every new ticket starts as `OPEN`.

```json
{
  "title": "Printer on the second floor is jammed",
  "description": "It shows error E-42 and nothing prints.",
  "priority": "HIGH",
  "team": "Operations"
}
```

**201 Created**: the new Ticket, with its `id` and `status`.

```json
{
  "id": 13,
  "title": "Printer on the second floor is jammed",
  "description": "It shows error E-42 and nothing prints.",
  "priority": "HIGH",
  "status": "OPEN",
  "team": "Operations"
}
```

**400 Bad Request, `BAD_REQUEST`**: the body isn't valid JSON, or isn't a JSON object (for example `[]` or `"hello"`).

```json
{
  "error": "BAD_REQUEST",
  "message": "The request body must be a JSON object."
}
```

**400 Bad Request, `VALIDATION_ERROR`**: one or more fields break the rules. Every invalid field is listed.

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Title is required. Team must be one of Engineering, Finance, HR, Operations or Support.",
  "fields": {
    "title": "Title is required.",
    "team": "Team must be one of Engineering, Finance, HR, Operations or Support."
  }
}
```

### PATCH /tickets/{id}

**IMPLEMENTED.** Change some of a ticket's fields. Only the fields sent are changed; everything else stays as it was. The frontend uses this both to save the edit form (all fields) and to move a ticket on the board (`{ "status": "RESOLVED" }`).

| Path parameter | Type | Rules |
| --- | --- | --- |
| `id` | integer | The ticket's id. |

- Query parameters: none.

Request body: **any** of these fields, each following the same rules as on the Ticket object. An empty object `{}` is allowed and changes nothing.

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | At least 3 characters after trimming. |
| `description` | string | Not empty after trimming. |
| `priority` | string | `LOW`, `MEDIUM`, `HIGH` or `URGENT`. |
| `status` | string | `OPEN`, `IN_PROGRESS`, `RESOLVED` or `CLOSED`. |
| `team` | string | `Engineering`, `Finance`, `HR`, `Operations` or `Support`. |

`id` can't be changed: if sent, it's ignored.

```json
{
  "status": "RESOLVED"
}
```

**200 OK**: the whole updated Ticket.

```json
{
  "id": 1,
  "title": "Login page times out on slow networks",
  "description": "Users on mobile data report that the login page spins for over 30 seconds and then shows a timeout error. It works fine on office Wi-Fi.",
  "priority": "URGENT",
  "status": "RESOLVED",
  "team": "Engineering"
}
```

**404 Not Found**: no ticket has that id. Checked first, before the body.

```json
{
  "error": "NOT_FOUND",
  "message": "No ticket with id \"999\"."
}
```

**400 Bad Request, `BAD_REQUEST`**: the body isn't a JSON object.

```json
{
  "error": "BAD_REQUEST",
  "message": "The request body must be a JSON object."
}
```

**400 Bad Request, `VALIDATION_ERROR`**: a field that was sent breaks the rules.

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Status must be one of OPEN, IN_PROGRESS, RESOLVED or CLOSED.",
  "fields": {
    "status": "Status must be one of OPEN, IN_PROGRESS, RESOLVED or CLOSED."
  }
}
```

### DELETE /tickets/{id}

**IMPLEMENTED.** Delete a ticket for good. Its id is never reused.

| Path parameter | Type | Rules |
| --- | --- | --- |
| `id` | integer | The ticket's id. |

- Query parameters: none.
- Request body: none.

**204 No Content**: deleted. The response has **no body**.

**404 Not Found**: no ticket has that id (including one that was already deleted).

```json
{
  "error": "NOT_FOUND",
  "message": "No ticket with id \"12\"."
}
```

## Projects

Projects are **read-only** in v1: there are no endpoints to create, change or delete them.

### The Project object

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

**IMPLEMENTED.** Every project.

- Path and query parameters: none.
- Request body: none.

**200 OK**: an array of Project objects, sorted by `id`. An empty array `[]` when there are none.

```json
[
  {
    "id": 1,
    "name": "Customer portal redesign",
    "description": "A faster, mobile-friendly customer portal with a simpler login.",
    "status": "ACTIVE",
    "team": "Engineering",
    "lead": "Priya Sharma"
  }
]
```

Failures: only 500.

### GET /projects/{id}

**IMPLEMENTED.** One project. Used by the frontend's project page, `/projects/:id`.

| Path parameter | Type | Rules |
| --- | --- | --- |
| `id` | integer | The project's id. |

- Query parameters: none.
- Request body: none.

**200 OK**: the Project object (see the example above).

**404 Not Found**: no project has that id, or the id isn't a whole number.

```json
{
  "error": "NOT_FOUND",
  "message": "No project with id \"999\"."
}
```

## Users

### The User object

```json
{
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "leanne@example.com",
  "phone": "1-770-736-8031",
  "address": {
    "street": "Kulas Light",
    "suite": "Apt. 556",
    "city": "Gwenborough",
    "zipcode": "92998-3874"
  },
  "company": {
    "name": "Romaguera-Crona"
  }
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | integer | Chosen by the server. |
| `name` | string | Full name. |
| `username` | string | A short handle, shown as `@username`. |
| `email` | string | Email address. Unique across all users. |
| `phone` | string | Phone number, as entered. |
| `address` | object | `street`, `suite`, `city`, `zipcode`, all strings. |
| `company` | object | `name`, a string. |

A User object **never** includes a password or a password hash, in any response.

### GET /users

**IMPLEMENTED.** The mock API serves it, and the frontend's Users page uses it.

Until Week 6, the Users page read its list from the public [JSONPlaceholder](https://jsonplaceholder.typicode.com/users) API with a hand-written `useFetch` hook, which is why the User object above uses the same field names. JSONPlaceholder also sends `website`, `address.geo` and more of `company`, which the frontend never used, so they aren't part of this contract. **Since Week 6, the Users page reads this endpoint**, through RTK Query like the rest of the app.

- Path and query parameters: none.
- Request body: none.

**200 OK**: an array of User objects, sorted by `id`. An empty array `[]` when there are none.

Failures: only 500. (From Week 8 this will also need a signed-in user, and answer 401 `UNAUTHORIZED` without one.)

## Auth

**Both endpoints are SPECIFIED, and arrive in Week 8.** The frontend has no sign-in yet.

**How a signed-in session is carried after login is a Week 8 decision**, and isn't part of this contract yet: for example, an `httpOnly` cookie set by the server, or a token in the response body that the frontend sends back in an `Authorization` header. This section only fixes the request and response bodies. It will be updated when that decision is made.

### POST /users (register)

**SPECIFIED.** Create a new user account.

- Path and query parameters: none.

Request body:

| Field | Type | Rules | Message when broken |
| --- | --- | --- | --- |
| `name` | string | Required, not empty after trimming. | `Name is required.` |
| `username` | string | Required, 3 to 30 characters: letters, numbers, `_` and `.` only. | `Username must be 3 to 30 letters, numbers, dots or underscores.` |
| `email` | string | Required, a valid email address. Compared without regard to case. | `Enter a valid email address.` |
| `password` | string | Required, at least 8 characters. Never stored as sent: only a salted hash is kept. | `Password must be at least 8 characters.` |

```json
{
  "name": "Ama Owusu",
  "username": "ama.owusu",
  "email": "ama@example.com",
  "password": "correct-horse-battery"
}
```

**201 Created**: the new User object (with no password). Fields the register form doesn't collect come back as empty strings: `phone`, `address.street`, `address.suite`, `address.city`, `address.zipcode` and `company.name`.

```json
{
  "id": 11,
  "name": "Ama Owusu",
  "username": "ama.owusu",
  "email": "ama@example.com",
  "phone": "",
  "address": { "street": "", "suite": "", "city": "", "zipcode": "" },
  "company": { "name": "" }
}
```

**400 Bad Request, `BAD_REQUEST`**: the body isn't a JSON object.

**400 Bad Request, `VALIDATION_ERROR`**: one or more fields break the rules.

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

**409 Conflict**: an account with that email already exists.

```json
{
  "error": "CONFLICT",
  "message": "An account with this email already exists."
}
```

### POST /sessions (log in)

**SPECIFIED.** Sign in with an email and password.

- Path and query parameters: none.

Request body:

| Field | Type | Rules | Message when broken |
| --- | --- | --- | --- |
| `email` | string | Required. | `Email is required.` |
| `password` | string | Required. | `Password is required.` |

```json
{
  "email": "ama@example.com",
  "password": "correct-horse-battery"
}
```

**201 Created**: a session was created. The body holds the signed-in user. How the session itself reaches the browser is decided in Week 8 (see above).

```json
{
  "user": {
    "id": 11,
    "name": "Ama Owusu",
    "username": "ama.owusu",
    "email": "ama@example.com",
    "phone": "",
    "address": { "street": "", "suite": "", "city": "", "zipcode": "" },
    "company": { "name": "" }
  }
}
```

**400 Bad Request, `BAD_REQUEST`**: the body isn't a JSON object.

**400 Bad Request, `VALIDATION_ERROR`**: the email or password is missing.

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Password is required.",
  "fields": {
    "password": "Password is required."
  }
}
```

**401 Unauthorized**: the email isn't registered, **or** the password is wrong. Both cases get exactly the same answer, so the response never reveals which emails have accounts.

```json
{
  "error": "UNAUTHORIZED",
  "message": "The email or password is incorrect."
}
```

## Mock-only endpoint (not part of the API)

The mock API has one extra endpoint that exists only to make development easier. **The backend must not build it.**

| Endpoint | What it does |
| --- | --- |
| `POST /tickets/reset` | Throws away every change and restores the sample tickets. It answers `200` with the full list of sample tickets. Used by the "Reset to sample data" button, which will be removed when the real backend arrives. |

It breaks this contract's "no verbs in paths" rule on purpose, and it's left out of the rules above because it isn't part of the API: it's a reset switch for the mock's in-browser database.
