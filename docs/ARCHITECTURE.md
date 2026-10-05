# Architecture decisions

Short notes on design choices that aren't obvious from the code alone.

## The ticket form includes a Team field

Every ticket belongs to a team, and other parts of the app depend on it: board cards show the team, and the Teams page counts each team's open tickets. A ticket created without a team would show a blank team and never be counted anywhere. So the form includes a Team dropdown, even though the original spec didn't list one. Its options come from the department names in the employee data, so the teams can't drift out of sync with the Teams page. New tickets default to the first team in that list.

## Pagination applies to the list view only

The Tickets page shows the same tickets two ways: as a list and as a board. The search box and the status filter decide *which* tickets are shown, so they apply to both views. That way, switching views never changes the set of tickets you're looking at. Pagination only decides *how many are shown at once*, which suits the list but not the board. The board already groups tickets into status columns, and splitting those columns across pages would hide tickets from columns without any clear signal. So the board shows every matching ticket, and the list shows them 10 at a time.

## Saved tickets are checked before they're trusted

Tickets are saved in the browser's localStorage so they survive a refresh. Anything in localStorage can change outside the app: it can be edited by hand in the browser's developer tools, or left over from an older version of the app with a different ticket shape. `JSON.parse` can return any value, so the saved data is treated as `unknown` and checked by the `isTicketList` type guard (in `src/features/tickets/utils/ticketHelpers.ts`) before the app uses it. The guard confirms the value is an array and that every ticket has the right field types and a known priority and status. If the check fails, the app starts from the sample tickets instead of crashing on bad data later. Because the check is a TypeScript type guard, the compiler only treats the value as `Ticket[]` once it has passed.

## Only the sidebar and notifications are in Redux

Redux is for state that several distant parts of the app need at once. Only two things in OpsDesk fit that. `sidebarCollapsed` is read by both the Sidebar and the Layout. `notifications` are created deep inside different pages but shown in the Layout, and must survive moving to another page. Everything else has one obvious owner: the search box's text belongs to the Tickets page, a half-typed form belongs to the form. That state stays in `useState`. Putting it in Redux would mean actions, reducers and selectors for no benefit. It would also keep things alive that should reset, like a draft form after you've left the page, and let any component change them. NOTES.md lists every piece of state and why it lives where it does.

## Ticket data is RTK Query, not Redux state

Tickets are *server state*: the server owns them, and the app only holds a copy that can go stale. Server state needs loading and error flags, a cache shared between pages, and refetching after changes. Writing that by hand in a Redux slice is a lot of code to get wrong. RTK Query provides it from one description of the API (`src/store/ticketsApi.ts`). Its cache tags say what each cached result contains: the list "provides" a tag for every ticket in it, and `updateTicket` "invalidates" the tag of the ticket it changed. So after a status change, RTK Query refetches exactly the queries that contained that ticket, and no page has to remember to reload. The cache still lives in the Redux store (under `state.ticketsApi`), but no hand-written reducer touches it.

## The mock API persists to localStorage

Until the backend exists, Mock Service Worker answers `/api/tickets` in the browser. A mock that only kept tickets in memory would lose every change on refresh, a step backwards from Week 2. So the mock keeps tickets in memory, like a server would, and also saves them to localStorage under the same `opsdesk.tickets` key Week 2 used, so earlier data carries over. The important difference from Week 2 is *who* touches localStorage: only the mock server (`src/mocks/ticketDb.ts`), never the app. The app only ever calls `/api`, so switching to the real backend means switching the mock off, with no changes to app code. The saved data is still checked with the `isTicketList` type guard before it's trusted, and the mock falls back to the sample tickets if the check fails. The mock also validates incoming data with the same rules as the form, because a real server can't trust the client either.

## The Users page still uses useFetch

The Users page loads from the real JSONPlaceholder API with the hand-written generic `useFetch` hook from Week 2, and that's deliberate. It shows the same ideas RTK Query handles for tickets, done by hand: loading, empty, success and error states, a retry, and cancelling the request when the component unmounts. Having both side by side makes the trade-off visible. `useFetch` is small and easy to read, but it has no shared cache (two components using it would make two requests) and no automatic refetching. RTK Query adds those for data that changes and is shown in many places, which is exactly the situation tickets are in and users aren't.
