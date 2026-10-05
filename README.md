# OpsDesk

OpsDesk is a small internal operations dashboard built during an internship project. It brings the company's tickets, projects, teams and people together in one place.

## What changed in Week 2

| Area | What changed |
| --- | --- |
| **Routing** | Every page has its own URL, handled by [React Router](https://reactrouter.com/). The sidebar uses `NavLink`, so the current page is highlighted. Tickets have their own detail pages, and unknown URLs show a Not Found page. |
| **Forms and validation** | Tickets can be created and edited with one shared form. The title is required (at least 3 characters) and so is the description. Each error appears in red under its own field after you first submit, and clears once the field is fixed. |
| **TypeScript** | The whole app is TypeScript with `strict` mode on. Shared types include the `TicketStatus` and `Priority` union types, and `useFetch` is generic (`useFetch<User[]>(url)`). |
| **Feature folders** | Code is grouped by feature (tickets, employees, users, projects) instead of by file type, and pages are kept thin. |
| **Search, filter and pagination** | The Tickets page has a list view with a search box (title and description, case-insensitive), a status filter, and pages of 10 tickets. |
| **Saved tickets** | Tickets are saved in the browser's localStorage, so changes survive a page refresh. Use **Reset to sample data** on the Tickets page to go back to the original tickets. |

The reasoning behind the less obvious design choices is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Routes

| URL | Page |
| --- | --- |
| `/` | Redirects to `/dashboard` |
| `/dashboard` | Ticket counts by status, people and team counts, and urgent and high priority open tickets |
| `/tickets` | Every ticket as a searchable, paginated **list** or as a **board** with one column per status |
| `/tickets/new` | Create a ticket |
| `/tickets/:id` | One ticket's full details, e.g. `/tickets/3` |
| `/tickets/:id/edit` | Edit a ticket, including its status |
| `/projects` | Project cards with status, team and lead |
| `/teams` | Team summaries and the Employee Directory (search, filter by department, select to see details) |
| `/users` | Users loaded live from the [JSONPlaceholder](https://jsonplaceholder.typicode.com/users) API, with loading, empty and error states |
| anything else | Page not found, with a link back to the dashboard |

### The Tickets page

- **Search and status filter** apply to **both** the list and the board, so both views always show the same tickets.
- **Pagination** applies to the **list only** (10 per page), with "Showing X to Y of Z tickets" and Previous and Next buttons. The board shows every matching ticket in its status column instead.
- Changing the search or the filter goes back to page 1.
- **Reset to sample data** replaces every ticket with the original sample tickets, after asking you to confirm. Use it to undo your changes.

### How tickets are saved

Tickets are saved in localStorage under the key `opsdesk.tickets` every time they change, and loaded again when the app starts. If nothing is saved yet, or the saved data can't be read or doesn't look like a list of tickets, the app starts from the sample tickets in `src/data/tickets.ts` instead. If localStorage is blocked, the app still works; changes just aren't kept after a refresh.

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

## Tech

- [React](https://react.dev/) 19 with [TypeScript](https://www.typescriptlang.org/) (strict mode)
- [React Router](https://reactrouter.com/) for pages and URLs
- [Vite](https://vite.dev/) for the dev server and builds
- Plain CSS (no UI libraries), with automatic light and dark mode
- [Oxlint](https://oxc.rs/) for linting

## Getting started

You need [Node.js](https://nodejs.org/) installed.

```bash
npm install
npm run dev
```

Then open the local address Vite prints (usually http://localhost:5173).

### Other scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Checks the types, then builds a production version into `dist/` |
| `npm run typecheck` | Checks the TypeScript types without building |
| `npm run lint` | Checks the code for problems with Oxlint |
| `npm run preview` | Serves the production build locally |

## Folder structure

```
src/
├── main.tsx         Entry point: mounts the app inside BrowserRouter
├── App.tsx          Holds the ticket state (useTickets) and renders the routes
├── index.css        Global styles, colour tokens for light and dark mode, shared button and filter styles
├── routes/          AppRoutes.tsx (every route in one place) and navPages.ts (the sidebar links)
├── layouts/         Layout (sidebar plus the current page via <Outlet />) and Sidebar
├── pages/           Thin page components that put feature components together
├── components/      Shared UI that knows nothing about any feature: PageHeader, StatCard,
│                    StatusMessage, BackLink, Pagination
├── hooks/           Shared hooks: useFetch (generic data loading) and useLocalStorage
├── utils/           Shared helpers: paginate
├── data/            Mock tickets, employees and projects
└── features/
    ├── tickets/     components/ (board, list, filters, form, details...), hooks/useTickets.ts,
    │                types.ts, utils/ (statuses, validation, search and filter helpers)
    ├── employees/   components/ (directory, team summary...), types.ts, utils/
    ├── users/       components/, hooks/useUsers.ts, types.ts
    └── projects/    components/, types.ts, utils/
```

Each component's CSS file sits next to it.

### JavaScript files

None. Every file in `src/` is TypeScript (`.ts` or `.tsx`).

## Git workflow

Each piece of work followed the same steps:

1. **Issue:** describe the work and its requirements as a checklist in a GitHub issue.
2. **Branch:** create a branch from the latest `main`, for example `feature/routing`.
3. **Commits:** build it in small, focused commits with clear messages.
4. **Checks:** run `npm run lint`, `npm run typecheck` and `npm run build`, and test in the browser.
5. **Pull request:** open a PR into `main` that explains what changed and how to test it, and links the issue with `Closes #<number>`.
6. **Review:** feedback is fixed with new commits on the same branch.
7. **Merge:** once approved, the PR is merged, the branch is deleted, and the issue closes automatically.

Nothing is committed directly to `main`.
