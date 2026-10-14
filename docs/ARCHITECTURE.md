# Architecture decisions

Short notes on design choices that aren't obvious from the code alone. Weeks 2 and 3 come first, then this week's (Week 4) decisions.

## The ticket form includes a Team field

Every ticket belongs to a team, and other parts of the app depend on it: board cards show the team, and the Teams page counts each team's open tickets. A ticket created without a team would show a blank team and never be counted anywhere. So the form includes a Team dropdown, even though the original spec didn't list one. Its options come from the department names in the employee data, so the teams can't drift out of sync with the Teams page. New tickets default to the first team in that list. Since Week 4 the mock API also rejects any team that isn't one of those five, as the API contract requires.

## Pagination applies to the list view only

The Tickets page shows the same tickets two ways: as a list and as a board. The search box and the status filter decide *which* tickets are shown, so they apply to both views. That way, switching views never changes the set of tickets you're looking at. Pagination only decides *how many are shown at once*, which suits the list but not the board. The board already groups tickets into status columns, and splitting those columns across pages would hide tickets from columns without any clear signal. So the board shows every matching ticket, and the list shows them 10 at a time.

## Saved tickets are checked before they're trusted

Tickets are saved in the browser's localStorage so they survive a refresh. Anything in localStorage can change outside the app: it can be edited by hand in the browser's developer tools, or left over from an older version of the app with a different ticket shape. `JSON.parse` can return any value, so the saved data is treated as `unknown` and checked by the `isTicketList` type guard (in `src/features/tickets/utils/ticketHelpers.ts`) before the app uses it. The guard confirms the value is an array and that every ticket has the right field types and a known priority and status. If the check fails, the app starts from the sample tickets instead of crashing on bad data later. Because the check is a TypeScript type guard, the compiler only treats the value as `Ticket[]` once it has passed.

## Only the sidebar and notifications are in Redux

Redux is for state that several distant parts of the app need at once. Only two things in OpsDesk fit that. `sidebarCollapsed` is read by both the Sidebar and the Layout. `notifications` are created deep inside different pages but shown in the Layout, and must survive moving to another page. Everything else has one obvious owner: the search box's text belongs to the Tickets page, a half-typed form belongs to the form. That state stays in `useState` (or, for the list/board choice, in the URL; see below). Putting it in Redux would mean actions, reducers and selectors for no benefit. It would also keep things alive that should reset, like a draft form after you've left the page, and let any component change them. NOTES.md lists every piece of state and why it lives where it does.

## Server data is RTK Query, not Redux state

Tickets and projects are *server state*: the server owns them, and the app only holds a copy that can go stale. Server state needs loading and error flags, a cache shared between pages, and refetching after changes. Writing that by hand in a Redux slice is a lot of code to get wrong. RTK Query provides it from one description of the API. Its cache tags say what each cached result contains: the list "provides" a tag for every ticket in it, and `updateTicket` "invalidates" the tag of the ticket it changed. So after a status change, RTK Query refetches exactly the queries that contained that ticket, and no page has to remember to reload. The cache still lives in the Redux store (under `state.api`), but no hand-written reducer touches it.

## The mock API persists to localStorage

Until the backend exists, Mock Service Worker answers `/api/v1/...` in the browser. A mock that only kept tickets in memory would lose every change on refresh, a step backwards from Week 2. So the mock keeps tickets in memory, like a server would, and also saves them to localStorage under the same `opsdesk.tickets` key Week 2 used, so earlier data carries over. The important difference from Week 2 is *who* touches localStorage: only the mock server (`src/mocks/ticketDb.ts`), never the app. The app only ever calls `/api/v1`, so switching to the real backend means switching the mock off, with no changes to app code. The saved data is still checked with the `isTicketList` type guard before it's trusted, and the mock falls back to the sample tickets if the check fails. The mock also validates incoming data with the same rules as the form (they share `validateTitle` and `validateDescription`), because a real server can't trust the client either. Projects are read-only, so `projectDb.ts` just serves its seed data and saves nothing.

## The Users page still uses useFetch

The Users page loads from the real JSONPlaceholder API with the hand-written generic `useFetch` hook from Week 2, and that's deliberate. It shows the same ideas RTK Query handles for tickets, done by hand: loading, empty, success and error states, a retry, and cancelling the request when the component unmounts. Having both side by side makes the trade-off visible. `useFetch` is small and easy to read, but it has no shared cache (two components using it would make two requests) and no automatic refetching. RTK Query adds those for data that changes and is shown in many places, which is exactly the situation tickets are in and users aren't. In Week 4, moving users to RTK Query would only have meant pointing a new endpoint at JSONPlaceholder, a server that isn't ours and doesn't follow our contract. So the API contract specifies `GET /api/v1/users` for the real backend, with field names matching what the page already reads, and the page switches to it, and to RTK Query, in Week 6, when there's something real to switch to.

## Week 4

### Two error boundaries, not one

An error boundary catches errors thrown while the components **inside** it render. It can't catch an error in itself or in anything above it. So where it sits decides what survives a crash.

- **The inner boundary** wraps only the page area inside `Layout` (around the `<Suspense>` and `<Outlet>`). When a page crashes, the fallback replaces just that page: the sidebar and toasts keep working, so the user can simply go somewhere else. It also catches a lazy page whose code fails to download.
- **The outer boundary** wraps every route in `App`. It's the safety net for a crash in the Layout itself (the sidebar, the toasts). The inner boundary can't help there, because it's part of what crashed. Without the outer one, a Layout crash would leave a blank white page. Its fallback brings its own `<main>`, since the Layout's is gone.

Both reset on every navigation (they use React Router's `location.key`, which changes even when you navigate to the same path again), so one crash never leaves the app stuck. Boundaries don't catch errors in event handlers or async code; those are handled where they happen, by RTK Query's `isError` flags and the `try`/`catch` around each mutation's `unwrap()`.

### The confirmation dialog uses the native `<dialog>` element

`ConfirmDialog` is a `<dialog>` opened with `showModal()`, rather than a `<div>` styled to look like a modal, or `window.confirm`. `showModal()` gives us, from the browser itself, the parts of a modal that are easy to get wrong by hand:

- focus is trapped inside it;
- the rest of the page becomes inert (it can't be clicked, and screen readers skip it);
- Escape closes it;
- it sits in the "top layer" above everything, with a `::backdrop`;
- screen readers announce it as a modal dialog.

A `<div>` modal would need a focus-trap loop, `aria-hidden` on everything else, a key listener and z-index management, each a place for bugs. `window.confirm` can't be styled, can't say "Delete ticket" on its button, and blocks the whole page. On top of what the browser gives us, the component only has to start focus on **Cancel** (so pressing Enter by reflex never deletes anything), return focus to the button that opened it, and wire up `aria-labelledby` and `aria-describedby`.

### Error toasts never dismiss themselves

Success and info toasts disappear after 6 seconds (`AUTO_DISMISS_MS`), and the timer pauses while the pointer is over the toast or focus is inside it. Error toasts stay until someone dismisses them. A success message confirms something the user can already see happened; missing it costs nothing. An error is the one message that asks the user to do something (try again, check their input), and it's often longer. People who read slowly, use a screen reader or a magnifier, or simply looked away for a moment would lose it if it vanished. WCAG's "Timing adjustable" rule is about exactly this. The cost of an error that stays is that it covers part of the page, which is why the page reserves space below its content while toasts are showing, so no control is ever stuck underneath.

### The contract keeps numeric ids and a plain array, with pagination specified for v1.1

The API contract describes the API the frontend **already** uses, so the backend can be built against it and the frontend keeps working unchanged.

- **Numeric ids.** Every part of the frontend already uses whole-number ids (`/tickets/3`, `parseId`, the cache tags). They're short and readable in a URL, and an in-memory or SQL backend gives them away for free. UUIDs would hide how many tickets exist, but that doesn't matter for an internal tool, and switching now would change every page and test for no user-visible gain.
- **A plain array from `GET /tickets`.** With a dozen tickets, the frontend loads them all and searches, filters and paginates in the browser. Wrapping the list in an envelope today would add a shape nobody uses yet.
- **Pagination specified for v1.1.** Server-side paging will be needed as the data grows, so the contract specifies it in full now (`page`, `size`, `status`, `search`, and the `items`/`page`/`size`/`totalItems`/`totalPages` envelope) so the backend can plan for it. It's marked as not implemented, and it only applies when one of those parameters is sent. That way it can be added later without breaking v1 clients, and the contract still matches the mock exactly today.

### One RTK Query api for tickets and projects

Projects moved behind the mock API this week. Instead of a second `createApi` for them, there's one api (`src/store/api.ts`, holding the base URL, the cache and the tag types), and `ticketsApi.ts` and `projectsApi.ts` each *inject* their endpoints into it. RTK Query recommends one api per server: it means one cache, one reducer and one middleware in the store, and a mutation in one feature can invalidate another feature's tags, which separate apis can't do. Each feature still keeps its endpoints in its own file.

### The list/board choice lives in the URL

The Tickets page's view (`/tickets?view=board`) moved from `useState` into the URL. The page needs to know the view **while the tickets are still loading**, to show a skeleton of the right shape, and the component that owned that state isn't on screen until they arrive. The URL is readable from anywhere on the page, and it also means a refresh or a shared link keeps the board. Switching uses `replace`, so it doesn't fill the browser history.

### "Not found" needs the API's own NOT_FOUND body

A page says "Ticket not found" only when the response is a 404 **and** the body is the contract's `{ "error": "NOT_FOUND", … }`. Testing the production build showed why the body matters. With no backend, the preview server answers a bare 404 for every API request, and checking the status alone made every ticket page claim the ticket didn't exist. A bare 404 means "the API isn't there" (no backend, or a wrong `VITE_API_URL`), so it now shows the normal "couldn't load" error with Retry instead.
