# Notes: where state lives

Every piece of state in the app at the end of Week 4, found by searching the code for `useState`, `useRef`, `useAppSelector`, the RTK Query hooks, `useFetch`, the React Router hooks, `localStorage` and class component `state`.

Each item has one of three labels:

- **Local**: only one component (and its children) cares about it. It belongs in `useState` inside that component.
- **Shared-UI**: about how the app *looks or behaves*, and needed by components far apart in the tree. It is not data from a server.
- **Server**: a copy of data that really belongs to a backend. The server is the source of truth, and the app has to load it, keep it fresh, and send changes back.

## Shared-UI state: Redux (`src/store/uiSlice.ts`)

| State | Read by | Changed by | Why it's here |
| --- | --- | --- | --- |
| `sidebarCollapsed` | `Sidebar` (button, `aria-expanded`, hiding the links) and `Layout` (width of the sidebar column) | `toggleSidebar`, from the Main menu button | Two separate components need the same value. |
| `notifications` | `Notifications` and each `Toast`, rendered by `Layout` on every page | `addNotification` from `NewTicketPage`, `EditTicketPage`, `TicketDetailPage` and `TicketsPage` (success and error); `dismissNotification` from each Dismiss button, and from a toast's own timer | Created inside pages, shown in the layout, and kept when you move to another page. |

## Server state: RTK Query (`src/store/api.ts`, with endpoints in `ticketsApi.ts` and `projectsApi.ts`)

| State | Used by | Why it's here |
| --- | --- | --- |
| The ticket list (`getTickets`) | `TicketsPage`, `DashboardPage`, `TeamsPage` | Business data owned by the (mock) API. RTK Query loads it, shares one cached copy between the three pages, and refetches it when a change invalidates its tags. |
| One ticket (`getTicket(id)`) | `TicketDetailPage`, `EditTicketPage` | The same data, one ticket at a time. Refetched when that ticket changes, and marked stale when it's deleted. |
| The project list and one project (`getProjects`, `getProject(id)`) | `ProjectsPage`, `ProjectDetailPage` | Moved behind the mock API in Week 4, so they follow the same pattern as tickets. |
| Request status: `isLoading`, `isError`, `error`, and each mutation's `isLoading` (`isSaving`, `isDeleting`, `isResetting`…) | The same pages | Describes the requests, so it comes with the server data instead of being written by hand. |

The cache lives in the Redux store (under `state.api`), but no hand-written reducer touches it.

## Server state: useFetch (Users page)

| State | Where | Why it's here |
| --- | --- | --- |
| `data`, `status`, `retryCount` | `useFetch`, called through `useUsers` | Users come from the real JSONPlaceholder API. The hand-written hook stays on purpose, as a comparison with RTK Query, until the Week 6 backend serves `/api/v1/users` (see docs/ARCHITECTURE.md). |

## Local state: in the component that owns it

| State | Where | Why it's local |
| --- | --- | --- |
| `searchText`, `statusFilter`, `page` | `TicketBrowser` | Only the Tickets page shows them. Resetting when you leave the page is fine. |
| `values`, `errors` | `TicketForm` | A draft being typed. It only becomes shared when it's submitted. |
| `searchText`, `selectedDepartment`, `selectedEmployeeId` | `EmployeeDirectory` | Only the directory on the Teams page uses them. |
| `isConfirmOpen` | `TicketDetailPage` | Whether the "Delete this ticket?" dialog is showing. Only this page opens it. |
| `isResetConfirmOpen` | `TicketsPage` | Whether the "Reset to sample data?" dialog is showing. |
| `isHovered`, `hasFocus` | each `Toast` | Pause that one toast's timer while it's being read or used. Every toast has its own, so they come and go independently. |
| `hasError`, `resetKey` | `ErrorBoundary` (a class, so `this.state`, not `useState`) | Whether to show the fallback, and the navigation it last saw, so a new navigation clears the error. Each of the two boundaries has its own. |

## Not React state, but worth knowing about

| What | Where | Why |
| --- | --- | --- |
| The URL: `pathname`, `key`, the `:id` param, and `?view=board` | React Router (`useLocation` in `App` and `Layout`, `useParams` in the detail and edit pages, `useSearchParams` in `useTicketView`) | Shared-UI state that React Router already owns. It survives a refresh and can be shared as a link. The list/board view moved here in Week 4, so the Tickets page can draw the right skeleton before the tickets arrive. |
| `previousPathname` | `useRef` in `Layout` | Remembers the last page, so focus only moves to the heading on a real page change. A ref, not state, because changing it shouldn't re-render anything. |
| `remainingMs` | `useRef` in each `Toast` | How much of the 6 seconds is left, kept across pauses. A ref, because changing it shouldn't redraw anything. |
| `containerRef`, `dialogRef`, `cancelRef`, `openerRef`, `headingRef`, `regionRef` | `useRef` in `Notifications`, `ConfirmDialog`, `ErrorBoundary` and `SkeletonGroup` | Handles on DOM elements: to move focus (to the next Dismiss button, Cancel, the opener, the fallback's heading), to open and close the `<dialog>`, and to write the "Loading…" announcement. Not data. |
| `--toast-space` | A CSS variable on `<html>`, set by `Notifications` | How much of the screen the toasts cover, so the page can reserve that space. It's styling information for CSS, not something any component renders from. |
| The mock database | `src/mocks/ticketDb.ts` (memory + localStorage `opsdesk.tickets`) and `src/mocks/projectDb.ts` (read-only seed data) | This is the *server's* storage, not the app's. The app never touches localStorage; only the mock API does. |
| Derived values | `matchingTickets` (memoised) and `ticketPage` in `TicketBrowser`, the "No tickets match…" message, `filteredEmployees`, the status counts, the priority list, the team summaries | Worked out from real state during render, so they can never go stale and never need storing. |
| Employees | `src/data/employees.ts` | Constants that never change while the app runs. They'll become server state when a backend serves them. |
| Light and dark mode, and reduced motion | CSS `prefers-color-scheme` and `prefers-reduced-motion` | No JavaScript state at all. |

## What changed in Week 4

- **Projects** became server state, through RTK Query, instead of a constant imported by the page.
- **One RTK Query api** (`src/store/api.ts`) now holds the cache for both tickets and projects, under `state.api` instead of `state.ticketsApi`.
- The **list/board view** moved from `useState` in `TicketBrowser` into the URL.
- **New local state:** whether each confirmation dialog is open, each toast's hover and focus, and each error boundary's `hasError`.
- **New refs:** for focus management in the dialog and the error boundary, a toast's remaining time, and the loading announcement.
- **Deliberately unchanged:** Redux still holds only the sidebar and notifications, and the Users page still uses `useFetch`.

## What changed in Week 3

At the start of Week 3:
- **Tickets** were server data held in **`useTickets`**, a hook in `App` that saved them to localStorage through **`useLocalStorage`** and passed them to every page as props.
- **Sidebar collapse and notifications** didn't exist.

Over the week:
1. **Part 2:** `sidebarCollapsed` and `notifications` were added to **Redux**, the only shared-UI state that needed it.
2. **Part 3:**
   - The tickets moved to **RTK Query**, backed by a mock API (MSW). The mock keeps its own copy in localStorage, so tickets still survive a refresh.
   - `useTickets`, `useLocalStorage` and the ticket props on `App` and `AppRoutes` were deleted.
3. **Part 4:** two `useRef`s were added for focus management, and the filtered ticket list was memoised.

## Why most state should stay local

State in a component is easy to find, is reset when you leave the page, and can't be changed by code somewhere else. Moving it into a global store would mean every change goes through actions and selectors for no benefit. It would also keep things alive that should reset, like a half-typed form after you've left the page. A global store is only worth it when state is truly shared, which is why Redux holds just two things. Server data is different again: it needs loading, caching and refreshing, which is RTK Query's job rather than a hand-written slice's.
