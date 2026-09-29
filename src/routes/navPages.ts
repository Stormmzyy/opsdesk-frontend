// One link in the main navigation.
export interface NavPage {
  path: string
  label: string
}

// The pages in the navigation, in order. The sidebar maps over this list.
export const NAV_PAGES: NavPage[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/tickets', label: 'Tickets' },
  { path: '/projects', label: 'Projects' },
  { path: '/teams', label: 'Teams' },
  { path: '/users', label: 'Users' },
]
