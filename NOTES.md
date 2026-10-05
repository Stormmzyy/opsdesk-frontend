# Week 3 notes: where state lives

Every piece of state in the app at the end of Week 3, found by searching the code for `useState`, `useRef`, `useAppSelector`, the RTK Query hooks, `useFetch`, the React Router hooks and `localStorage`.

Each item has one of three labels:

- **Local**: only one component (and its children) cares about it. It belongs in `useState` inside that component.
- **Shared-UI**: about how the app *looks or behaves*, and needed by components far apart in the tree. It is not data from a server.
- **Server**: a copy of data that really belongs to a backend. The server is the source of truth, and the app has to load it, keep it fresh, and send changes back.

## Shared-UI state: Redux (`src/store/uiSlice.ts`)

| State | Read by | Changed by | Why it's here |
| --- | --- | --- | --- |
| `sidebarCollapsed` | `Sidebar` (button, `aria-expanded`, hiding the links) and `Layout` (width of the sidebar column) | `toggleSidebar`, from the Main menu button | Two separate components need the same value. |
| `notifications` | `Notifications`, rendered by `Layout` on every page | `addNotification` from `NewTicketPage`, `EditTicketPage` and `TicketsPage` (success and error); `dismissNotification` from each Dismiss button | Created inside pages, shown in the layout, and kept when you move to another page. |

## Server state: RTK Query (`src/store/ticketsApi.ts`)

| State | Used by | Why it's here |
| --- | --- | --- |
| The ticket list (`getTickets`) | `TicketsPage`, `DashboardPage`, `TeamsPage` | Business data owned by the (mock) API. RTK Query loads it, shares one cached copy between the three pages, and refetches it when a change invalidates its tags. |
| One ticket (`getTicket(id)`) | `TicketDetailPage`, `EditTicketPage` | The same data, one ticket at a time. Refetched when that ticket changes. |
| Request status: `isLoading`, `isError`, the mutations' `isLoading` | The same pages | Describes the requests, so it comes with the server data instead of being written by hand. |

The cache lives in the Redux store (under `state.ticketsApi`), but no hand-written reducer touches it.

## Server state: useFetch (Users page)

| State | Where | Why it's here |
| --- | --- | --- |
| `data`, `status`, `retryCount` | `useFetch`, called through `useUsers` | Users come from the real JSONPlaceholder API. The hand-written hook stays on purpose, as a comparison with RTK Query (see docs/ARCHITECTURE.md). |

## Local state: `useState` in the component that owns it

| State | Where | Why it's local |
| --- | --- | --- |
| `view`, `searchText`, `statusFilter`, `page` | `TicketBrowser` | Only the Tickets page shows them. Resetting when you leave the page is fine. |
| `values`, `errors` | `TicketForm` | A draft being typed. It only becomes shared when it's submitted. |
| `searchText`, `selectedDepartment`, `selectedEmployeeId` | `EmployeeDirectory` | Only the directory on the Teams page uses them. |

## Not React state, but worth knowing about

| What | Where | Why |
| --- | --- | --- |
| The URL (`pathname`, the `:id` param) | React Router (`useLocation` in `Layout`, `useParams` in the ticket pages) | Shared-UI state that React Router already owns. It survives a refresh and can be shared as a link. |
| `previousPathname` | `useRef` in `Layout` | Remembers the last page, so focus only moves to the heading on a real page change. A ref, not state, because changing it shouldn't re-render anything. |
| `containerRef` | `useRef` in `Notifications` | A handle on the DOM, used to find the next Dismiss button to focus. Not data. |
| The mock database | `src/mocks/ticketDb.ts` (memory + localStorage `opsdesk.tickets`) | This is the *server's* storage, not the app's. The app never touches localStorage; only the mock API does. |
| Derived values | `matchingTickets` (memoised) and `ticketPage` in `TicketBrowser`, `filteredEmployees`, the status counts, the priority list, the team summaries | Worked out from real state during render, so they can never go stale and never need storing. |
| Employees and projects | `src/data/*.ts` | Constants that never change while the app runs. They'll become server state when a backend serves them. |
| Light and dark mode | CSS `prefers-color-scheme` | No JavaScript state at all. |

## What changed during the week

At the start of Week 3:
- **Tickets** were server data held in **`useTickets`**, a hook in `App` that saved them to localStorage through **`useLocalStorage`** and passed them to every page as props.
- **Sidebar collapse and notifications** didn't exist.

Over the week:
1. **Part 2:** `sidebarCollapsed` and `notifications` were added to **Redux**, the only shared-UI state that needed it.
2. **Part 3:**
   - The tickets moved to **RTK Query**, backed by a mock API (MSW). The mock keeps its own copy in localStorage, so tickets still survive a refresh.
   - `useTickets`, `useLocalStorage` and the ticket props on `App` and `AppRoutes` were deleted.
3. **Part 4:** two `useRef`s were added for focus management, and the filtered ticket list was memoised.

**Deliberately unchanged:** every local item above, the Users page's `useFetch`, and the URL.

## Why most state should stay local

State in a component is easy to find, is reset when you leave the page, and can't be changed by code somewhere else. Moving it into a global store would mean every change goes through actions and selectors for no benefit. It would also keep things alive that should reset, like a half-typed form after you've left the page. A global store is only worth it when state is truly shared, which is why Redux holds just two things. Server data is different again: it needs loading, caching and refreshing, which is RTK Query's job rather than a hand-written slice's.
