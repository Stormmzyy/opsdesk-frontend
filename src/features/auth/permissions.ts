import type { User } from '../users/types.ts'

// What the screens offer each role: a copy of the permission table in
// API_CONTRACT.md, used ONLY to decide what to show.
//
// Hiding a control is for convenience, not security. It saves people from
// pressing a button that can only fail. The server is what refuses: it
// checks the caller's role (from its database, not from anything this file
// decides) on every request, and a hidden button's endpoint called directly,
// with curl, still answers 403. That's shown in the README, "Hiding a button
// is not security". So if this file and the server ever disagree, the worst
// case is a button that fails with a clear 403, or a missing button for
// something the person could have done. Never an action the server allowed
// by mistake.

// Deleting a ticket: ADMIN only (the permission table; decision 22's role
// rule, checked before the ticket is even looked up).
export function canDeleteTickets(user: User | null): boolean {
  return user?.role === 'ADMIN'
}

// Assigning and unassigning a ticket: ADMIN and MANAGER (the permission
// table; both assignee endpoints refuse anyone else with a 403).
export function canAssignTickets(user: User | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'MANAGER'
}

// Who the assign picker offers: everyone from GET /users except USERs.
//
// - The list comes from GET /users, which only ADMIN and MANAGER may call.
//   That's exactly the roles that can assign, so the picker works for
//   precisely the people who get to see it. It's also why the backend put
//   `role` on the user response (decision 59): without it, a client couldn't
//   tell who is assignable.
// - This filter is a client-side COPY of a server rule. API_CONTRACT.md (PATCH
//   /tickets/{id}/assignee) records it as a known duplication, not an
//   oversight; the better shape would be a server-side filter. If the two
//   ever disagree, the server wins: assigning a USER is answered with 400
//   "A USER can't be assigned tickets.", which the picker shows under itself.
export function canBeAssigned(candidate: User): boolean {
  return candidate.role !== 'USER'
}
