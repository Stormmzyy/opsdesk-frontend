# Week 3 notes: state audit

Every piece of state in the app at the start of Week 3, found by searching the code for `useState`, `useLocalStorage`, `useFetch` and the React Router hooks.

Each item gets one of three labels:

- **Local**: only one component (and its children) cares about it. It belongs in `useState` inside that component.
- **Shared-UI**: about how the app *looks or behaves*, and needed by components far apart in the tree. It is not data from a server.
- **Server**: a copy of data that really belongs to a backend. The server is the source of truth, and the app has to load it, keep it fresh, and send changes back.

## The audit

### Tickets

| State | Where | Label | Why |
| --- | --- | --- | --- |
| `tickets` (the whole ticket list) | `useTickets` in `App.tsx`, stored through `useLocalStorage` | **Server** | Tickets are business data that a backend will own. localStorage is only standing in for that backend until it exists. |
| `value` inside `useLocalStorage` | `src/hooks/useLocalStorage.ts` | **Server** (as used today) | It's the in-memory copy of the saved tickets, so it follows the label of what it stores. Its only user is `useTickets`. |
| `view` (list or board) | `TicketBrowser` | **Local** | Only the Tickets page shows the list or board, so nothing else needs to know. |
| `searchText` | `TicketBrowser` | **Local** | Only filters what this one page shows. |
| `statusFilter` | `TicketBrowser` | **Local** | Same as the search: it only affects this page. |
| `page` | `TicketBrowser` | **Local** | Pagination for this one list. Resetting it when you leave the page is fine. |
| `values` (the form fields) | `TicketForm` | **Local** | A draft being typed. It only becomes shared once it's submitted. |
| `errors` (validation messages) | `TicketForm` | **Local** | Only the form shows them, and they're worked out from `values`. |

### Employees and teams

| State | Where | Label | Why |
| --- | --- | --- | --- |
| `searchText` | `EmployeeDirectory` | **Local** | Only filters the directory on the Teams page. |
| `selectedDepartment` | `EmployeeDirectory` | **Local** | Same: a filter for this one component. |
| `selectedEmployeeId` | `EmployeeDirectory` | **Local** | Decides which employee the details panel shows, right next to the list. Nothing else uses it. |

### Users

| State | Where | Label | Why |
| --- | --- | --- | --- |
| `data` (the users) | `useFetch`, called through `useUsers` | **Server** | Loaded from the JSONPlaceholder API, which owns the data. |
| `status` (loading, success, empty, error) | `useFetch` | **Server** | It describes the request, so it goes wherever the server data goes. |
| `retryCount` | `useFetch` | **Server** | Internal plumbing that makes `retry()` fetch again. It's part of how the server data is loaded. |

### The URL

| State | Where | Label | Why |
| --- | --- | --- | --- |
| `pathname` (current page) | React Router, read with `useLocation` in `Layout` | **Shared-UI** | The whole app reacts to it (the sidebar highlights the current link, `<Outlet />` picks the page), but React Router already owns it. It stays there. |
| `:id` URL param | React Router, read with `useParams` in `TicketDetailPage` and `EditTicketPage` | **Shared-UI** | Which ticket to show. The URL is the right home because it survives a refresh and can be shared as a link. |

### Things that look like state but aren't

- **Derived values**: `matchingTickets` and `ticketPage` (TicketBrowser), `filteredEmployees` and `selectedEmployee` (EmployeeDirectory), the priority list, the status counts and the team summaries. They're all worked out from real state on every render, so they never need storing and can never go stale.
- **Employees and projects** (`src/data/employees.ts`, `src/data/projects.ts`): fixed arrays that never change while the app runs, so they're constants, not state. When a backend arrives they'll become **server** state.
- **Light and dark mode**: handled entirely in CSS with `prefers-color-scheme`. No JavaScript state is involved.

### Missing today, needed this week

| State | Label | Why |
| --- | --- | --- |
| `sidebarCollapsed` | **Shared-UI** | The toggle lives in the sidebar, but the layout around it also needs to know, so it can give the page more room. |
| `notifications` | **Shared-UI** | Created by forms and buttons on many different pages, but shown in one place in the layout. |

## What moves this week, and what stays

**Moving to Redux (shared-UI only):** `sidebarCollapsed` and `notifications`. Both are needed by components far apart in the tree, and neither is server data.

**Moving to RTK Query (server state):** the ticket list. `useTickets` and its localStorage copy are replaced by API calls to a mock server (MSW). RTK Query will own the loading, error and caching of that data.

**Staying exactly where it is:**

- Every **local** item above: TicketBrowser's view, search, filter and page; TicketForm's values and errors; EmployeeDirectory's search, department and selection.
- The **users** in `useFetch`. They come from a real external API, and `useFetch` stays as a hand-written comparison to RTK Query.
- The **URL** state, which React Router already manages well.

**Why most state should stay local:** state in a component is easy to find, is reset when you leave the page, and can't be changed by code somewhere else. Moving it into a global store would make every change go through actions and selectors for no benefit, and would keep things like a half-typed form alive after you've left the page. Global stores are only worth it when state is truly shared, so only `sidebarCollapsed` and `notifications` go into Redux.

## Update: Redux is in (Part 2)

**Moved into Redux** (`src/store/uiSlice.ts`, under `state.ui`):

| State | Read by | Changed by | Why Redux |
| --- | --- | --- | --- |
| `sidebarCollapsed` | `Sidebar` (button label direction, `aria-expanded`, hiding the links) and `Layout` (narrows the grid column) | `toggleSidebar` from the Main menu button | Two separate components need the same value. Without Redux it would have to live in `Layout` and be passed down as props. |
| `notifications` | `Notifications`, rendered by `Layout` on every page | `addNotification` from `NewTicketPage`, `EditTicketPage` and `TicketsPage`; `dismissNotification` from each Dismiss button | Created deep inside pages, shown in the layout, and kept when you move to another page (creating a ticket takes you to its detail page, and the message is still there). |

**Stayed local**, unchanged: TicketBrowser's `view`, `searchText`, `statusFilter` and `page`; TicketForm's `values` and `errors`; EmployeeDirectory's `searchText`, `selectedDepartment` and `selectedEmployeeId`.

**Not in Redux on purpose:** the tickets (server state, moving to RTK Query in Part 3), the users from `useFetch` (server state from a real API), and the URL (React Router owns it).

Redux state lives in memory, so a page refresh expands the sidebar again and clears the notifications. That's fine for both: neither needs to survive a refresh.
