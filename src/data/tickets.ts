import type { Ticket } from '../features/tickets/types.ts'

// Mock support tickets for the board.
// "team" uses the same department names as employees.js.
export const tickets: Ticket[] = [
  {
    id: 1,
    title: 'Login page times out on slow networks',
    description:
      'Users on mobile data report that the login page spins for over 30 seconds and then shows a timeout error. It works fine on office Wi-Fi.',
    priority: 'URGENT',
    status: 'OPEN',
    team: 'Engineering',
  },
  {
    id: 2,
    title: 'Order new laptops for the March starters',
    description:
      'Four new starters join on 3 March. Order laptops with the standard developer setup and have them ready the Friday before.',
    priority: 'MEDIUM',
    status: 'OPEN',
    team: 'Operations',
  },
  {
    id: 3,
    title: 'Customer cannot reset their password',
    description:
      'A customer says the password reset email never arrives. We checked their spam folder with them. Their account email looks correct.',
    priority: 'HIGH',
    status: 'OPEN',
    team: 'Support',
  },
  {
    id: 4,
    title: 'Update the holiday policy document',
    description:
      "The holiday policy still lists last year's public holidays. Update the dates and the carry-over rules agreed at the last meeting.",
    priority: 'LOW',
    status: 'OPEN',
    team: 'HR',
  },
  {
    id: 5,
    title: 'Fix rounding error in monthly invoices',
    description:
      'Some invoices are off by one cent because tax is rounded per line instead of on the total. Finance needs this fixed before month end.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    team: 'Finance',
  },
  {
    id: 6,
    title: 'Add dark mode to the admin panel',
    description:
      'Several staff have asked for a dark theme in the admin panel. Reuse the colour tokens from the main app where possible.',
    priority: 'LOW',
    status: 'IN_PROGRESS',
    team: 'Engineering',
  },
  {
    id: 7,
    title: 'Office air conditioning is broken',
    description:
      'The air conditioning on the second floor stopped working this morning and the room is over 30°C. The repair company has been called.',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    team: 'Operations',
  },
  {
    id: 8,
    title: 'Reply to the backlog of refund emails',
    description:
      'Around 40 refund emails built up over the holiday weekend. Reply to each one and log any refunds that still need approval.',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    team: 'Support',
  },
  {
    id: 9,
    title: 'Schedule onboarding for new hires',
    description:
      "Book onboarding sessions for this month's new hires, covering IT setup, security training and a team introduction.",
    priority: 'MEDIUM',
    status: 'RESOLVED',
    team: 'HR',
  },
  {
    id: 10,
    title: 'Rotate the expired API keys',
    description:
      'The payment provider API keys expired on Friday. Generate new keys, update the server settings and revoke the old keys.',
    priority: 'HIGH',
    status: 'RESOLVED',
    team: 'Engineering',
  },
  {
    id: 11,
    title: 'Close the Q3 expense reports',
    description:
      'Check the remaining Q3 expense reports against their receipts, approve them, and send the summary to the finance director.',
    priority: 'MEDIUM',
    status: 'CLOSED',
    team: 'Finance',
  },
  {
    id: 12,
    title: 'Replace the broken meeting room screen',
    description:
      'The screen in the large meeting room has a cracked panel. Order a replacement of the same size and book a time to mount it.',
    priority: 'LOW',
    status: 'CLOSED',
    team: 'Operations',
  },
]
