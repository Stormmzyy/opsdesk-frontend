# OpsDesk

OpsDesk is a small internal operations dashboard, built as a Week 1 internship project. It brings together the company's tickets, teams and people in one place.

## Pages

| Page | What it does |
| --- | --- |
| **Dashboard** | Shows ticket counts by status, total employees and number of teams, plus a list of urgent and high priority open tickets. Every number is calculated from the data. |
| **Tickets** | A board with one column per status (Open, In progress, Resolved, Closed). Move a ticket to the next column with its button, or pick a status from its dropdown. |
| **Teams** | A summary of each team with its member count and open ticket count. Below it is the Employee Directory, where you can search by name, filter by department and select someone to see their details. |
| **Users** | Users loaded live from the [JSONPlaceholder](https://jsonplaceholder.typicode.com/users) API, with loading, empty and error states and a Retry button. |

Ticket changes are kept in memory while the app is open, so they show up on every page. They reset when you reload.

## Tech

- [React](https://react.dev/) 19
- [Vite](https://vite.dev/)
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
| `npm run build` | Builds a production version into `dist/` |
| `npm run lint` | Checks the code for problems with Oxlint |
| `npm run preview` | Serves the production build locally |

## Folder structure

```
src/
├── components/   Small reusable pieces, grouped by feature. Each CSS file sits next to its component.
│   ├── common/     Shared across the app: Layout, Sidebar, PageHeader, StatCard, StatusMessage
│   ├── employees/  The Employee Directory and its parts
│   ├── tickets/    The Ticket Board, its columns and cards
│   └── users/      User cards and the list of users
├── pages/        Full screens, one per navigation item (Dashboard, Tickets, Teams, Users)
├── hooks/        Reusable React hooks, such as useFetch for loading data from an API
├── utils/        Small pure helper functions and constants, such as ticket statuses and filtering
├── data/         Mock data used until a real API is available
├── App.jsx       Holds the shared state and decides which page to show
├── main.jsx      The entry point that mounts the app
└── index.css     Global styles and colour tokens for light and dark mode
```

## Git workflow

Each piece of work followed the same steps:

1. **Issue:** describe the work and its requirements as a checklist in a GitHub issue.
2. **Branch:** create a branch from the latest `main`, for example `feature/ticket-board`.
3. **Commits:** build it in small, focused commits with clear messages.
4. **Pull request:** open a PR into `main` that explains what changed and how to test it, and links the issue with `Closes #<number>`.
5. **Review:** a teammate reviews the PR. Feedback is fixed with new commits on the same branch.
6. **Merge:** once approved, the PR is merged, the branch is deleted, and the issue closes automatically.

Nothing is committed directly to `main`.
