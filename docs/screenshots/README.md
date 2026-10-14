# Screenshots

The main README shows these five images. Take them from `npm run dev` (where the mock API has data), in a desktop-width browser window, and save them here with exactly these names.

| File | What it should show |
| --- | --- |
| `dashboard.png` | The Dashboard (`/dashboard`) with data loaded: the ticket counts by status, the People numbers, and the urgent and high priority open tickets. |
| `tickets-list.png` | The Tickets page (`/tickets`) in **List** view, with the search box, status filter, the first page of tickets and the pagination below them. A Board view screenshot is optional, but this one is the list. |
| `ticket-detail.png` | One ticket's page, for example `/tickets/1`: its title, description, priority, status and team, the Edit button, and the red "Delete this ticket" section at the bottom. |
| `loading-state.png` | A page **while it loads**, showing the grey skeleton placeholders, for example the Tickets list. The mock answers quickly, so slow it down first: in Chrome DevTools, open the Network tab, choose "Slow 4G" (or "3G") in the throttling menu, then reload. |
| `error-state.png` | A page showing its **error state**: "Sorry, we couldn't load the tickets." with a **Retry** button. Easiest way: run `npm run build` then `npm run preview` (there's no mock API there), and open `/tickets`. Or, in `npm run dev`, use DevTools' Network tab to block requests to `api/v1/tickets` and reload. |

Keep each image under about 500 KB so the README loads quickly (PNG at 1280 px wide is plenty).
