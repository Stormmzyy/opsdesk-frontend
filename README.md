# OpsDesk

OpsDesk is a small internal operations dashboard built during an internship project. It brings the company's tickets, projects, teams and people together in one place.

> **Ticket data is mocked for now.** There is no backend yet. In development, [Mock Service Worker (MSW)](https://mswjs.io/) answers the app's `/api/tickets` requests inside the browser, and keeps the tickets in localStorage so they survive a refresh. The app itself talks to `/api` exactly as it will talk to the real backend when it arrives, so that switch won't need changes to the app's code. The mock only runs under `npm run dev`. A production build (`npm run build`) has no mock, and shows "couldn't load the tickets" until a real API exists.

## Getting started

You need [Node.js](https://nodejs.org/) installed.

```bash
npm install
npm run dev
```

Then open the local address Vite prints (usually http://localhost:5173). The browser console shows `[MSW] Mocking enabled.` when the mock API is running.

## Running the tests

```bash
npm test             # runs every test once
npm run test:watch   # re-runs the tests whenever you save a file
```

The tests use [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/), in a fake browser (jsdom). Test files sit next to the code they test, named `*.test.ts` or `*.test.tsx`. They find elements by role and accessible name (`getByRole('button', { name: /create ticket/i })`) the way a screen reader would, so small wording changes don't break them. `npm run typecheck` checks the test files too.

| Test file | What it checks |
| --- | --- |
| `features/tickets/components/TicketCard.test.tsx` | The ticket's title appears as a link to `/tickets/<id>`, and the Move button asks for the **next** status |
| `features/tickets/components/TicketForm.test.tsx` | Submitting an empty title marks the field invalid, **links** the error to it (it becomes the field's accessible description), moves focus to it, and submits nothing |
| `features/tickets/utils/ticketHelpers.test.ts` | `filterTickets` searches titles **and** descriptions ignoring case, trims spaces, and combines with the status filter. `parseTicketId` accepts only whole numbers (`"3"`) and rejects `"abc"`, `"3.5"`, `"-1"`, `""` and `" 3"` |
| `pages/TicketsPage.test.tsx` | An integration test with the real page, RTK Query and mock API (MSW running in Node): moving a ticket on the board makes the list refresh by itself |

Two helpers support them:
- `src/test/renderWithProviders.tsx` renders a component inside a router and a fresh Redux store, like the real app.
- `src/mocks/server.ts` runs the same mock API handlers in Node.

Every test was checked by breaking the feature on purpose and confirming the test fails. For example, the integration test fails if `updateTicket` stops invalidating its cache tag.

## What changed in Week 3

| Area | What changed |
| --- | --- |
| **Redux Toolkit** | A Redux store for the two pieces of **shared UI state**: whether the sidebar is collapsed, and the list of notifications. Components use typed `useAppSelector` and `useAppDispatch` hooks. |
| **Collapsible sidebar** | A **Main menu** button collapses the sidebar to a narrow strip on wide screens, or hides the links on narrow screens. |
| **Notifications** | Creating, saving, moving and resetting tickets show a success or error notification at the top of every page, each with a Dismiss button. |
| **RTK Query + a mock API** | Every page loads and changes tickets through RTK Query, which handles loading, errors and caching. After a change, the list refreshes by itself (see below). The old `useTickets` and `useLocalStorage` hooks are gone. |
| **Performance** | The Projects and Users pages are lazy-loaded, and the filtered ticket list is memoised with `useMemo`. |
| **Accessibility** | Six fixes, listed under [Accessibility](#accessibility). |
| **Tests** | The first automated tests, listed under [Running the tests](#running-the-tests). |

The reasoning behind the less obvious choices is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), and a list of every piece of state in the app is in [NOTES.md](NOTES.md).

## What's in Redux, and why only that

Redux holds **only** `sidebarCollapsed` and `notifications` (`src/store/uiSlice.ts`):

- **`sidebarCollapsed`** is read by two separate components: the Sidebar (its button and links) and the Layout (the width of the sidebar column).
- **`notifications`** are created deep inside different pages but shown in one place in the Layout, and they stay when you move to another page.

Everything else deliberately stays out:

- **Tickets are server data,** so they live in RTK Query's cache, not in a Redux slice. The server owns them, and RTK Query keeps our copy fresh.
- **Users** come from a real external API through the hand-written `useFetch` hook. It's kept as a comparison with RTK Query.
- **Page-level choices** stay in the component that owns them with `useState`: the Tickets page's search, filter, page and view, the form's values and errors, and the Employee Directory's search and selection. Keeping them local means they're easy to find, reset when you leave the page, and can't be changed by unrelated code.

## How ticket data works

```
Page  ->  RTK Query hook  ->  fetch('/api/tickets')  ->  MSW  ->  src/mocks/handlers.ts  ->  src/mocks/ticketDb.ts
```

- **`src/store/ticketsApi.ts`**: one RTK Query api slice with `getTickets`, `getTicket`, `addTicket`, `updateTicket` and `resetTickets`.
- **Cache tags keep the list up to date.** The list says it contains every ticket it holds, and moving ticket 3 marks "ticket 3" as changed. So RTK Query refetches the list (and ticket 3's page) automatically, with no manual refresh.
- **`src/mocks/handlers.ts`**: the mock API. `GET /api/tickets`, `GET /api/tickets/:id`, `POST /api/tickets`, `PATCH /api/tickets/:id`, and `POST /api/tickets/reset` for the Reset button.
  - Unknown or non-numeric ids return **404**.
  - Invalid data returns **400**, checked with the same rules as the form.
- **`src/mocks/ticketDb.ts`**: the mock's "database". It holds the tickets in memory and saves them to localStorage under `opsdesk.tickets`.
  - On startup, saved data is checked with the `isTicketList` type guard before it's trusted.
  - If nothing valid is saved, it starts from the sample tickets in `src/data/tickets.ts`.

## Routes

| URL | Page |
| --- | --- |
| `/` | Redirects to `/dashboard` |
| `/dashboard` | Ticket counts by status, people and team counts, and urgent and high priority open tickets |
| `/tickets` | Every ticket as a searchable, paginated **list** or as a **board** with one column per status |
| `/tickets/new` | Create a ticket |
| `/tickets/:id` | One ticket's full details, e.g. `/tickets/3` |
| `/tickets/:id/edit` | Edit a ticket, including its status |
| `/projects` | Project cards with status, team and lead (lazy-loaded) |
| `/teams` | Team summaries and the Employee Directory (search, filter by department, select to see details) |
| `/users` | Users loaded live from the [JSONPlaceholder](https://jsonplaceholder.typicode.com/users) API, with loading, empty and error states (lazy-loaded) |
| anything else | Page not found, with a link back to the dashboard |

### The Tickets page

- **Search and status filter** apply to **both** the list and the board, so both views always show the same tickets.
- **Pagination** applies to the **list only** (10 per page), with "Showing X to Y of Z tickets" and Previous and Next buttons. The board shows every matching ticket in its status column instead.
- Changing the search or the filter goes back to page 1.
- **Reset to sample data** asks you to confirm, then tells the mock API to restore the original sample tickets, and every ticket view refetches.

## Accessibility

Every page was checked with the keyboard only, in light and dark mode, at phone and desktop widths. Every link, button and form field can be reached with Tab and shows a visible focus ring, and each page has exactly one `<h1>`.

### Fixes made in Week 3

| Problem | Fix |
| --- | --- |
| Keyboard users had to Tab past the Main menu button and every navigation link on every page to reach the content. | A **"Skip to main content"** link is now the first thing Tab reaches. It stays hidden until it's focused. |
| After choosing a page in the sidebar, focus stayed on the link, so screen readers didn't announce the new page. | After each page change, **focus moves to the new page's `<h1>`** (or to `<main>` while a page is still loading). |
| Dismissing a notification removed the focused button, and focus fell back to the top of the page. | Focus moves to the **next notification's Dismiss button**, or to the page heading if none are left. |
| Every ticket card on the board had a "Move to …" button and a "Status" dropdown with the same name, so screen reader users couldn't tell which ticket they belonged to. | Both are now **described by the ticket's title** (`aria-describedby`), for example "Move to Resolved, button, Customer cannot reset their password". |
| Headings skipped a level: the Users page went from `<h1>` straight to `<h3>`, and the selected employee's name was an `<h2>` inside the "Employee Directory" `<h2>` section. | User names are now `<h2>`, and the employee name is now `<h3>`. Both look the same as before. |
| In dark mode, placeholder text such as "Search titles and descriptions" had a contrast of only 3.7:1, below the 4.5:1 minimum. | A `--placeholder` colour for each theme: 5.7:1 in dark mode, 4.8:1 in light mode. |

### Already in place

- The **Main menu** button uses `aria-expanded` and `aria-controls`, and collapsed links are `hidden`, so Tab skips them.
- **Notifications** use live regions that are always on the page: `role="status"` for success and info, `role="alert"` for errors. Only new notifications are announced.
- **Form errors:** submitting moves focus to the first field with a problem, and each error is linked to its field with `aria-describedby`, so it's read out with the field.
- **Priority badges** were measured at 6.4:1 or better in both themes. The type of a notification is shown in words ("Success:"), not by colour alone.
- **The search box's built-in clear (×) button** can't be reached with the keyboard, but the text can still be cleared with Delete (or Escape in Chrome), so it was left as it is.

## What changed in Week 2

| Area | What changed |
| --- | --- |
| **Routing** | Every page has its own URL, handled by [React Router](https://reactrouter.com/). The sidebar uses `NavLink`, so the current page is highlighted. Tickets have their own detail pages, and unknown URLs show a Not Found page. |
| **Forms and validation** | Tickets can be created and edited with one shared form. The title is required (at least 3 characters) and so is the description. Each error appears in red under its own field after you first submit, and clears once the field is fixed. |
| **TypeScript** | The whole app is TypeScript with `strict` mode on. Shared types include the `TicketStatus` and `Priority` union types, and `useFetch` is generic (`useFetch<User[]>(url)`). |
| **Feature folders** | Code is grouped by feature (tickets, employees, users, projects) instead of by file type, and pages are kept thin. |
| **Search, filter and pagination** | The Tickets page has a list view with a search box (title and description, case-insensitive), a status filter, and pages of 10 tickets. |
| **Saved tickets** | Tickets were saved in the browser's localStorage, so changes survived a refresh. In Week 3 this moved behind the mock API (see [How ticket data works](#how-ticket-data-works)). |

## Tech

- [React](https://react.dev/) 19 with [TypeScript](https://www.typescriptlang.org/) (strict mode)
- [React Router](https://reactrouter.com/) for pages and URLs
- [Redux Toolkit](https://redux-toolkit.js.org/) for shared UI state, and [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) for ticket data
- [Mock Service Worker](https://mswjs.io/) for the mock ticket API
- [Vite](https://vite.dev/) for the dev server and builds
- [Vitest](https://vitest.dev/) and [Testing Library](https://testing-library.com/) for tests
- Plain CSS (no UI libraries), with automatic light and dark mode
- [Oxlint](https://oxc.rs/) for linting

### All scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the dev server, with the mock API |
| `npm test` | Runs every test once |
| `npm run test:watch` | Runs the tests again whenever a file changes |
| `npm run build` | Checks the types, then builds a production version into `dist/` |
| `npm run typecheck` | Checks the TypeScript types (including the tests) without building |
| `npm run lint` | Checks the code for problems with Oxlint |
| `npm run preview` | Serves the production build locally (no mock API) |

## Folder structure

```
src/
├── main.tsx         Entry point: starts the mock API (in development), then mounts the app
│                    inside the Redux Provider and BrowserRouter
├── App.tsx          Renders the routes
├── index.css        Global styles, colour tokens for light and dark mode, shared button and filter styles
├── setupTests.ts    Runs before every test file: adds the jest-dom matchers
├── store/           store.ts (the Redux store), hooks.ts (typed hooks), uiSlice.ts (sidebar and
│                    notifications), ticketsApi.ts (RTK Query: all ticket requests)
├── mocks/           The mock API: handlers.ts, ticketDb.ts (its localStorage "database"),
│                    browser.ts (for the app) and server.ts (for tests)
├── routes/          AppRoutes.tsx (every route in one place) and navPages.ts (the sidebar links)
├── layouts/         Layout (skip link, sidebar, notifications, and the current page), Sidebar,
│                    Notifications
├── pages/           Thin page components that put feature components together
├── components/      Shared UI that knows nothing about any feature: PageHeader, StatCard,
│                    StatusMessage, BackLink, Pagination
├── hooks/           useFetch (generic data loading, used by the Users page)
├── utils/           Shared helpers: paginate, focusMainHeading
├── test/            renderWithProviders, the helper every component test uses
├── data/            Sample tickets (the mock API's starting data), employees and projects
└── features/
    ├── tickets/     components/ (board, list, filters, form, details...), types.ts,
    │                utils/ (statuses, validation, search, filter and id helpers)
    ├── employees/   components/ (directory, team summary...), types.ts, utils/
    ├── users/       components/, hooks/useUsers.ts, types.ts
    └── projects/    components/, types.ts, utils/
```

Each component's CSS file sits next to it, and so do its tests.

### JavaScript files

None in `src/`: every file there is TypeScript (`.ts` or `.tsx`). `public/mockServiceWorker.js` is generated by MSW (`npx msw init public`) and shouldn't be edited by hand.

## Git workflow

Each piece of work followed the same steps:

1. **Issue:** describe the work and its requirements as a checklist in a GitHub issue.
2. **Branch:** create a branch from the latest `main`, for example `feature/routing`.
3. **Commits:** build it in small, focused commits with clear messages.
4. **Checks:** run `npm run lint`, `npm run typecheck`, `npm run build` and `npm test`, and test in the browser.
5. **Pull request:** open a PR into `main` that explains what changed and how to test it, and links the issue with `Closes #<number>`.
6. **Review:** feedback is fixed with new commits on the same branch.
7. **Merge:** once approved, the PR is merged, the branch is deleted, and the issue closes automatically.

Nothing is committed directly to `main`.
