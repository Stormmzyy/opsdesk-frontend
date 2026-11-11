# Architecture decisions

Short notes on frontend design choices that aren't obvious from the code alone: the **why**, not the what. The README's [Architecture](../README.md#architecture) section says how the app is put together today, and the [opsdesk-system README](https://github.com/Stormmzyy/opsdesk-system#how-it-fits-together) shows how it fits with the backend and the database. API decisions are in the backend's [NOTES.md](https://github.com/Stormmzyy/opsdesk-backend/blob/main/NOTES.md), referred to below by number.

The entries are in the order they were decided, Weeks 2 to 8. Where a later week changed an earlier decision, the entry says so.

## The ticket form includes a Team field

Every ticket belongs to a team, and other parts of the app depend on it: board cards show the team, and the Teams page counts each team's open tickets. A ticket created without a team would show a blank team and never be counted anywhere. So the form includes a Team dropdown, even though the original spec didn't list one. Its options come from the department names in the employee data, so the teams can't drift out of sync with the Teams page. New tickets default to the first team in that list. The backend accepts exactly those five teams, as the API contract requires.

## The list pages; the board shows one large page

The Tickets page shows the same tickets two ways: as a list and as a board. The search box and the filters decide *which* tickets are shown, so they apply to both views, and switching views never changes the set you're looking at. Paging only decides *how many are shown at once*. That suits the list, 10 at a time. Splitting the board's status columns across pages would hide tickets from columns without any clear signal, so the board asks for one page of 100, the contract's maximum.

**Changed in Week 8:** the server does the searching, filtering, sorting and paging, so past 100 matching tickets the board can't show them all. It says so ("Showing the first 100 of …"), and the list is the way to see the rest. That's a known limitation (README).

## Saved tickets are checked before they're trusted

The mock API (below) saves tickets in the browser's localStorage so they survive a refresh. Anything in localStorage can change outside the app: it can be edited by hand in the browser's developer tools, or left over from an older version with a different ticket shape. `JSON.parse` can return any value, so the saved data is treated as `unknown` and checked by the `isTicketList` type guard (in `src/features/tickets/utils/ticketHelpers.ts`) before it's used. If the check fails, the mock starts from the sample tickets instead of crashing on bad data later. Because the check is a TypeScript type guard, the compiler only treats the value as `Ticket[]` once it has passed.

## Only the sidebar and notifications are in Redux

Redux is for state that several distant parts of the app need at once. Only two things in OpsDesk fit that. `sidebarCollapsed` is read by both the Sidebar and the Layout. `notifications` are created deep inside different pages but shown in the Layout, and must survive moving to another page. Everything else has one obvious owner: the search box's text belongs to the Tickets page, a half-typed form belongs to the form. That state stays in `useState` (or, for the list/board choice, in the URL; see below). Putting it in Redux would mean actions, reducers and selectors for no benefit. It would also keep things alive that should reset, like a draft form after you've left the page, and let any component change them. NOTES.md lists every piece of state and why it lives where it does.

(The signed-in session, the token and the current user, is the one later addition to the store: every page and the request wrapper need it. See Week 8 below.)

## Server data is RTK Query, not Redux state

Tickets, projects and users are *server state*: the server owns them, and the app only holds a copy that can go stale. Server state needs loading and error flags, a cache shared between pages, and refetching after changes. Writing that by hand in a Redux slice is a lot of code to get wrong. RTK Query provides it from one description of the API. Its cache tags say what each cached result contains: the list "provides" a tag for every ticket in it, and `updateTicket` "invalidates" the tag of the ticket it changed. So after a status change, RTK Query refetches exactly the queries that contained that ticket, and no page has to remember to reload. The cache still lives in the Redux store (under `state.api`), but no hand-written reducer touches it.

## The mock API persists to localStorage

With `VITE_USE_MOCK_API=true`, Mock Service Worker answers `/api/v1/...` in the browser, for working on the frontend without the backend. A mock that only kept tickets in memory would lose every change on refresh. So it keeps tickets in memory, like a server would, and also saves them to localStorage under the `opsdesk.tickets` key. Only the mock server (`src/mocks/ticketDb.ts`) touches localStorage, never the app: the app only ever calls `/api/v1`, so switching between the mock and the real backend needs no change to app code. The mock validates incoming data with the same rules as the form (they share `validateTitle` and `validateDescription`), because a real server can't trust the client either. It checks no permissions; the real backend does.

## Users moved from a hand-written hook to RTK Query (Week 6)

Until Week 6 the Users page loaded from JSONPlaceholder with the hand-written `useFetch` hook from Week 2, on purpose: it showed by hand what RTK Query does for tickets (loading, empty, success and error states, retry, cancelling on unmount), and the trade-off was visible side by side. There was no point moving it to RTK Query while the only server was one that isn't ours and doesn't follow our contract. Once the backend served `GET /api/v1/users`, the page moved to RTK Query like every other page, and `useFetch` was removed.

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

### Numeric ids and a plain array, with paging added later without breaking them

The API contract was written to describe the API the frontend **already** used, so the backend could be built against it and the frontend keep working unchanged.

- **Numeric ids.** Every part of the frontend already used whole-number ids (`/tickets/3`, `parseId`, the cache tags). They're short and readable in a URL, and a SQL backend gives them away for free. UUIDs would hide how many tickets exist, but that doesn't matter for an internal tool.
- **A plain array from `GET /tickets`.** With a dozen tickets, the frontend loaded them all and worked on them in the browser.
- **Paging was specified up front, as an addition.** The envelope (`items`, `page`, `size`, `totalItems`, `totalPages`) is returned only when a paging, filtering or sorting parameter is sent, so it could be added without breaking a client that reads the plain array. **Changed in Weeks 7 and 8:** the backend implemented it within v1, and the Tickets page now uses it, with the server doing the work. The Dashboard and Teams pages still read the plain array, because they summarise every ticket.

### One RTK Query api, with endpoints injected per feature

Instead of a `createApi` per feature, there's one api (`src/store/api.ts`, holding the base URL, the cache and the tag types), and `ticketsApi.ts`, `projectsApi.ts` and `usersApi.ts` each *inject* their endpoints into it. RTK Query recommends one api per server: it means one cache, one reducer and one middleware in the store, and a mutation in one feature can invalidate another feature's tags, which separate apis can't do. Each feature still keeps its endpoints in its own file.

### The list/board choice lives in the URL

The Tickets page's view (`/tickets?view=board`) lives in the URL, not in `useState`. The page needs to know the view **while the tickets are still loading**, to show a skeleton of the right shape, and the component that would own that state isn't on screen until they arrive. The URL is readable from anywhere on the page, and it also means a refresh or a shared link keeps the board. Switching uses `replace`, so it doesn't fill the browser history.

### "Not found" needs the API's own NOT_FOUND body

A page says "Ticket not found" only when the response is a 404 **and** the body is the contract's `{ "error": "NOT_FOUND", … }`. Testing the production build showed why the body matters. With no backend, the preview server answers a bare 404 for every API request, and checking the status alone made every ticket page claim the ticket didn't exist. A bare 404 means "the API isn't there" (no backend, or a wrong `VITE_API_URL`), so it shows the normal "couldn't load" error with Retry instead.

## Week 8

### The token is kept in localStorage, and a 401 ends the session in one place

The token from sign-in is kept in `localStorage` so a session survives a refresh, which means any script on the page could read it. That's accepted only under backend decision 70's conditions (no way to inject script, no third-party scripts, a 60-minute token, low-stakes data); if one stops being true, the token moves to an `HttpOnly` cookie.

Every response passes through one wrapper in `src/store/api.ts`, and a 401 there dispatches `sessionExpired`, which clears the token and the user; the route then sends the person to sign in, and back to where they were afterwards. Two guards:

- **`login` and `register` are excluded by endpoint name.** There a 401 is an answer ("The email or password is incorrect."), not a verdict on a token. Matching by name rather than URL means a change of path or base URL can't silently drop the exclusion.
- **Only the token that got the 401 ends the session.** A slow request from an old session, answering after a fresh sign-in, would otherwise sign the new one out.

The screens show each role only the controls it can use, from the cached `/auth/me` answer. That's convenience, not security: the server checks every request against the role in its database (backend decision 28), so a role changed on the server applies at once, and an open tab shows it after a reload.

### Editing sends only what changed, compared with a fresh snapshot

A PATCH that carries the whole form sends the values the page *loaded*, which may no longer be the ticket's, so a save could undo someone else's change to a field the person never touched (backend decisions 40 and 71). So the edit form takes a snapshot of the ticket when it opens, and sends only the fields that differ from it.

The snapshot must be fresh, not the cached copy: going from a ticket's page to its edit page would otherwise reuse a ticket that could be minutes old, and the person would decide what to change from out-of-date values. So the edit page refetches on open, and the form mounts only on an answer that arrived *after* the page opened (`fulfilledTimeStamp`). "Has data and isn't fetching" isn't enough: on the first render the hook still returns the cached copy with `isFetching` false. Once mounted, the form stays, so a later refetch can't lose the person's typing.

### A production build refuses to run without `VITE_API_URL`

Vite writes `VITE_API_URL` into the bundle when `npm run build` runs. Without it, the app fell back to `/api/v1` on its own origin, the build succeeded, and the deployed app answered 404 to every request. In Docker the value is a build argument, so a typo in the compose file would have produced that image silently. So a build-only check in `vite.config.ts` stops the build, naming the variable, when it's missing, blank, or neither an `http(s)://` URL nor a path starting with `/`. A path is still allowed on purpose: "same server, which forwards `/api` to the backend" is a real deployment choice. The dev server and the tests don't run the check, so a fresh clone still starts with `npm run dev`.

Every `VITE_` value is public by definition: it's in the JavaScript anyone can download. So none may hold a secret, and that's why `.env.production` doesn't need to be ignored by Git.

### The mock is kept out of production builds

`enableMocking()` returns first on `!import.meta.env.DEV`. A build turns that into a literal `if (true) return`, so the bundler can see that the dynamic import of the mock never runs, and drops it. `isMockApiEnabled()` returned false in a build too, but the bundler doesn't look inside another module's function to find that out, so the 404 kB mock chunk was still being shipped. `mockServiceWorker.js` is copied from `public/` like every public file, so a build-only plugin removes it from the output. The production bundle went from 810 kB of JavaScript to 405 kB.

### The image serves every route with the app

nginx serves the built files, and `try_files … /index.html` hands the app's `index.html` to any path that isn't a file, so a refresh on `/tickets/12` loads the app instead of nginx's own 404. Missing files under `/assets/` stay a real 404, so a missing script fails visibly instead of arriving as HTML. CI builds the image and runs `nginx -t` inside it, because a build only copies `nginx.conf`: a config with a syntax error builds fine and only fails when nginx starts.
