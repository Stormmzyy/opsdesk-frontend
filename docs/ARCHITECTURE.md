# Architecture decisions

Short notes on design choices that aren't obvious from the code alone.

## The ticket form includes a Team field

Every ticket belongs to a team, and other parts of the app depend on it: board cards show the team, and the Teams page counts each team's open tickets. A ticket created without a team would show a blank team and never be counted anywhere. So the form includes a Team dropdown, even though the original spec didn't list one. Its options come from the department names in the employee data, so the teams can't drift out of sync with the Teams page. New tickets default to the first team in that list.

## Pagination applies to the list view only

The Tickets page shows the same tickets two ways: as a list and as a board. The search box and the status filter decide *which* tickets are shown, so they apply to both views. That way, switching views never changes the set of tickets you're looking at. Pagination only decides *how many are shown at once*, which suits the list but not the board. The board already groups tickets into status columns, and splitting those columns across pages would hide tickets from columns without any clear signal. So the board shows every matching ticket, and the list shows them 10 at a time.

## Saved tickets are checked before they're trusted

Tickets are saved in the browser's localStorage so they survive a refresh. Anything in localStorage can change outside the app: it can be edited by hand in the browser's developer tools, or left over from an older version of the app with a different ticket shape. `JSON.parse` can return any value, so the saved data is treated as `unknown` and checked by the `isTicketList` type guard (in `src/features/tickets/utils/ticketHelpers.ts`) before the app uses it. The guard confirms the value is an array and that every ticket has the right field types and a known priority and status. If the check fails, the app starts from the sample tickets instead of crashing on bad data later. Because the check is a TypeScript type guard, the compiler only treats the value as `Ticket[]` once it has passed.
