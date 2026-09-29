// Mock projects. "team" uses the same department names as employees.js,
// and "lead" is an employee from that team.
export const projects = [
  {
    id: 1,
    name: 'Customer portal redesign',
    description: 'A faster, mobile-friendly customer portal with a simpler login.',
    status: 'ACTIVE',
    team: 'Engineering',
    lead: 'Priya Sharma',
  },
  {
    id: 2,
    name: 'New office move',
    description: 'Plan and run the move to the new Accra office, including desks and network.',
    status: 'PLANNING',
    team: 'Operations',
    lead: 'Kwame Asante',
  },
  {
    id: 3,
    name: 'Help centre articles',
    description: 'Write clear guides for the twenty most common customer questions.',
    status: 'ACTIVE',
    team: 'Support',
    lead: 'Liam Carter',
  },
  {
    id: 4,
    name: 'Onboarding checklist',
    description: 'One shared checklist so every new hire gets the same first week.',
    status: 'COMPLETED',
    team: 'HR',
    lead: 'Fatima Bello',
  },
  {
    id: 5,
    name: 'Automated invoicing',
    description: 'Send monthly invoices automatically instead of preparing them by hand.',
    status: 'ON_HOLD',
    team: 'Finance',
    lead: 'Marco Silva',
  },
  {
    id: 6,
    name: 'API monitoring',
    description: 'Alerts that warn the team before the public API slows down or fails.',
    status: 'PLANNING',
    team: 'Engineering',
    lead: 'Daniel Mensah',
  },
]

// Display labels for each project status.
export const PROJECT_STATUS_LABELS = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
}
