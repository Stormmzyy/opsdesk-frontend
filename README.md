# OpsDesk

OpsDesk is a small internal operations dashboard built during an internship project. It brings the company's tickets, projects, teams and people together in one place.

> **Ticket data is mocked for now.** There is no backend yet. In development, [Mock Service Worker (MSW)](https://mswjs.io/) answers the app's `/api/v1/tickets` requests inside the browser, and keeps the tickets in localStorage so they survive a refresh. The app itself talks to `/api/v1` exactly as it will talk to the real backend when it arrives, so that switch won't need changes to the app's code. The mock only runs under `npm run dev`. A production build (`npm run build`) has no mock, and shows "couldn't load the tickets" until a real API exists.

## Getting started

You need [Node.js](https://nodejs.org/) installed.

```bash
npm install
cp .env.example .env   # optional: the app falls back to /api/v1 without it
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
| `pages/TicketsPage.test.tsx` | Integration tests with the real page, RTK Query and mock API (MSW running in Node): moving a ticket on the board makes the list refresh by itself; when `GET /api/v1/tickets` answers **500**, an error is announced (`role="alert"`) with a **Retry** button; when it answers with an **empty list**, the page says so and links to "Create a ticket" |
| `pages/TicketFlows.test.tsx` | Whole journeys through the real app (routes, Layout, toasts, RTK Query, mock API): **creating** a ticket lands on its page with a success toast, and a search on the list finds it; **deleting** opens the confirmation dialog, **Cancel** sends no DELETE request, changes nothing and returns focus to the Delete button, then **confirming** returns to the list with a success toast and the ticket gone |
| `pages/DashboardPage.test.tsx` | When the tickets fail to load, the Dashboard shows exactly **one** alert and one Retry button (not one per section), and the People section still shows |
| `components/ErrorBoundary.test.tsx` | A component that throws while rendering is replaced by the fallback (heading, Try again, Reload page, a link to the dashboard), the raw error is **not** shown, and it **is** logged. The expected `console.error` is silenced for this test only and restored afterwards |

Two helpers support them:
- `src/test/renderWithProviders.tsx` renders a component inside a router and a fresh Redux store, like the real app.
- `src/mocks/server.ts` runs the same mock API handlers in Node. A test can swap in a different answer for one request with `server.use(...)`; `server.resetHandlers()` after each test puts the normal handlers back.

`src/setupTests.ts` also stands in for two things jsdom doesn't implement: the `<dialog>` element's `showModal()` and `close()`, and `window.scrollTo()`.

Every test was checked by breaking the feature on purpose and confirming the test fails. For example, the integration test fails if `updateTicket` stops invalidating its cache tag, the delete test fails if Cancel triggers the delete, and the error boundary test fails if `getDerivedStateFromError` stops switching to the fallback.

**Covered:** moving a ticket, the ticket list's error and empty states, the Dashboard's single error message, creating a ticket, deleting a ticket (including Cancel), form validation, the error boundary, the ticket card, and the search and id helpers.
**Not covered yet:** editing a ticket, the "Clear filters" button, pagination, the toast timer (auto-dismiss, pause and resume) and the space reserved for toasts, "Reset to sample data", the rest of the Dashboard, the Teams, Projects and Users pages, and anything that needs a real browser, such as the dialog's focus trap and Escape key, which jsdom can't do. Those were checked by hand.

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
Page  ->  RTK Query hook  ->  fetch('/api/v1/tickets')  ->  MSW  ->  src/mocks/handlers.ts  ->  src/mocks/ticketDb.ts
```

- **`src/store/ticketsApi.ts`**: one RTK Query api slice with `getTickets`, `getTicket`, `addTicket`, `updateTicket` and `resetTickets`.
- **Cache tags keep the list up to date.** The list says it contains every ticket it holds, and moving ticket 3 marks "ticket 3" as changed. So RTK Query refetches the list (and ticket 3's page) automatically, with no manual refresh.
- **`src/mocks/handlers.ts`**: the mock API. `GET /api/v1/tickets`, `GET /api/v1/tickets/:id`, `POST /api/v1/tickets`, `PATCH /api/v1/tickets/:id`, and `POST /api/v1/tickets/reset` for the Reset button.
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

### Week 4 check

Everything added this week (skeletons, empty states, toasts, the confirmation dialog, the error boundary fallback, the project pages) was checked on top of the Week 3 fixes below.

**What was checked, and how**

- **Keyboard only, on every page:** `/dashboard`, `/tickets` (list and board), `/tickets/1`, `/tickets/1/edit`, `/tickets/new`, `/projects`, `/projects/1`, `/teams`, `/users` and an unknown URL. Every link, button and field (up to 47 on the board) shows a visible focus indicator when reached with the keyboard, and no element has a positive `tabindex` that would scramble the order. A real Tab walk through a ticket's page goes: skip link, Main menu, the five pages, Back, Edit, then Delete, last and far from Edit. Tab then leaves the page for the browser's toolbar, so nothing traps focus.
- **The confirmation dialog:** opening it moves focus to **Cancel**; Tab stays inside it (the page behind can't be reached); **Escape** closes it; and Escape, Cancel and confirming all return focus to the button that opened it. It's named by its heading (`aria-labelledby`) and described by its message (`aria-describedby`). The delete test checks the focus return automatically.
- **Labels:** every visible `<input>`, `<select>` and `<textarea>` on every page has a real `<label>`.
- **Images:** the app has **no `<img>` elements and no `<svg>` icons at all**, so there's no alt text to add. The arrows and chevrons are text characters.
- **Headings:** every page and every state has exactly one `<h1>`, and no page skips a level (for example Teams goes h1, h2, h3, h2). Skeletons use real heading elements to keep their size, but they're inside `aria-hidden`, so screen readers don't see them.
- **Colour contrast** of this week's additions, in both themes:

| What | Light | Dark | Needs |
| --- | --- | --- | --- |
| Toast text | 17.7:1 | 15.4:1 | 4.5:1 |
| Toast success / error stripe | 5.0:1 / 6.5:1 | 12.1:1 / 8.9:1 | 3:1 |
| Solid red "Delete ticket" button text | 6.5:1 | 9.9:1 | 4.5:1 |
| Outlined red "Delete ticket" button text | 6.5:1 | 8.9:1 | 4.5:1 |
| Dialog and error fallback text | 7.6:1 | 6.7:1 | 4.5:1 |
| Focus ring against the surface | 7.1:1 | 6.2:1 | 3:1 |
| Skeleton blocks | 1.2:1 | 1.3:1 | none: decorative and hidden from screen readers, which hear "Loading…" instead |

The focus ring on the red button sits 2px away from it, on the dialog's background, so it's measured against the surface, not the red.

**What was changed**

| Problem | Fix |
| --- | --- |
| The toast **Dismiss** button's border was about 1.3:1 against the toast, so its edge was barely visible. (Not strictly a failure, because the word "Dismiss" identifies it, but toasts are new this week.) | The border now uses the `--placeholder` grey: 4.8:1 in light mode, 5.7:1 in dark. |
| **Toasts could cover controls for good.** They float over the bottom-right corner, and error toasts never dismiss themselves, so a control underneath could stay unreachable until the toast was dismissed. On a phone, where toasts span the full width, an error toast on the Tickets page covered **Previous** and **Next** even when scrolled right to the bottom, and focusing Next with the keyboard left it hidden underneath. | **Space is reserved for the toasts.** `Notifications` measures how much of the screen the toast stack covers (with a `ResizeObserver`) and stores it in a `--toast-space` CSS variable, 0px when there are no toasts. `Layout.css` adds that much padding under the page, so everything can be scrolled above the toasts, and sets it as `scroll-padding-bottom`, so the browser scrolls a keyboard-focused element to just above the toasts rather than leaving it behind them. Checked on the Tickets page with an error toast showing, by focusing every control in turn: with the fix switched off, 3 controls ended up covered at 375px; with it on, none at 375px or 1280px. I chose this over moving the toasts: at the top they would cover the page's header buttons instead, and putting them back in the page flow would lose the toast pattern. |
| **The Dashboard announced a failed load twice.** Both ticket sections showed their own "couldn't load the tickets" message, and each is a `role="alert"`, so a screen reader read the same error out twice. | **One error for the page.** When the tickets fail to load, the Dashboard shows a single message with one Retry button under its heading, and leaves out the two ticket sections until the tickets load. The People section, which doesn't need tickets, still shows. `DashboardPage.test.tsx` checks there is exactly one alert. |

Everything else above was already fine, so nothing else needed changing. Two problems were found and fixed earlier in the week, while building:
- After a failed delete, focus was left inside the closed dialog, because the Delete button was `disabled` while the request ran and a disabled button can't take focus. It now uses `aria-disabled`.
- On the error fallback, "Go to the dashboard" didn't recover when the dashboard itself had crashed. The boundaries now reset on every navigation.

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

## Security

These notes are about **this** app as it is today: a frontend with a mock API, no sign-in, and no real backend yet.

### What was checked

| Check | Result |
| --- | --- |
| `dangerouslySetInnerHTML` anywhere in `src/` or `index.html` | **No matches.** Every piece of text, including ticket titles and descriptions that people type in, reaches the page through normal JSX like `{ticket.title}`, which React always escapes. |
| Other ways to put raw HTML or run code from a string (`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`) | **No matches.** The one place the app writes to the page directly, the "Loading…" announcement in `SkeletonGroup`, uses `textContent`, which only ever inserts plain text. |
| Secrets, API keys, passwords or tokens in the source, `.env.example` or the Git history | **None.** A search of every tracked file finds only harmless words: CSS colour "tokens", RTK Query's `skipToken`, a sample ticket about a password reset, the warning in `.env.example`, and field names (plus one made-up example password) in `API_CONTRACT.md`. No `.env` file has ever been committed (`git log --all -- .env` is empty). |
| A real attack attempt | A ticket created through the API with the title `<img src=x onerror="…">Hacked` and the description `<script>…</script>` was **shown as that exact text**: no `<img>` or `<script>` element was created, and the code inside never ran. |

**Anything in frontend code or a `.env` file ends up in the files the browser downloads.** Vite copies every `VITE_` variable's value into the built JavaScript (the production bundle literally contains `/api/v1`), and anyone can read that JavaScript with the browser's developer tools. So neither the source code nor `.env` is ever a place for a secret. Only variables starting with `VITE_` are exposed at all, which stops a server-only value from leaking by accident; but that's no protection for a value given a `VITE_` name. Real secrets, such as database passwords and signing keys, belong on the backend.

### XSS, and why React's escaping helps

Cross-site scripting (XSS) is when an attacker gets their own JavaScript to run inside our page, for example by typing `<script>…</script>` as a ticket title and waiting for someone else to open it. Code that runs inside our page can do anything the user can do there. OpsDesk shows text that people type (titles and descriptions) to everyone who opens the ticket, so this matters here. React protects us by default: when we write `{ticket.title}` in JSX, React inserts it as plain text, and the browser shows the `<` and `>` characters instead of treating them as HTML. That's exactly what happened in the test above. The protection only switches off if we choose to bypass it with `dangerouslySetInnerHTML` (or put a user's text into an `href` that starts with `javascript:`), and the codebase does neither.

### localStorage, and what it means for Week 8

Anything saved in `localStorage` can be read by **any** JavaScript running on the page: ours, a third-party script, a browser extension, or an attacker's code if an XSS hole ever slipped through. In OpsDesk, only the mock API uses it (`src/mocks/ticketDb.ts` keeps the tickets under `opsdesk.tickets`), and those are sample tickets, so nothing sensitive is stored there today. When sign-in arrives in Week 8, that changes: a login token kept in `localStorage` could be stolen by a single XSS bug and used to act as that person until it expires. That's why `API_CONTRACT.md` leaves the token decision to Week 8. The usual safer choice is an `httpOnly` cookie set by the server, which the browser sends automatically but JavaScript cannot read at all.

### CORS, and where a CORS error is fixed

CORS (Cross-Origin Resource Sharing) is the browser rule that stops a page on one origin (scheme, host and port, like `http://localhost:5173`) from reading responses from another origin, unless that other server says it's allowed. Today OpsDesk never runs into it for tickets and projects: the app asks its own origin for `/api/v1/...` and MSW answers inside the browser. The Users page already crosses origins, though. It reads from `jsonplaceholder.typicode.com`, which works only because that server sends back `Access-Control-Allow-Origin: http://localhost:5173` (checked with a real request). When the real backend arrives on a different origin, through `VITE_API_URL`, it must send the same kind of header for the OpsDesk frontend's origin. **A CORS error is fixed on the backend, not in the frontend.** The browser is enforcing the server's answer, so no frontend change can safely work around it: `mode: 'no-cors'` only hides the response from our code, and turning off browser security is not a fix.

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
