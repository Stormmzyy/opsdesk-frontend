import { users as sampleUsers } from '../data/users.ts'
import type { User } from '../features/users/types.ts'

// The mock API's user "database", like projectDb.ts. Only the MSW handlers use
// this file: the app itself asks /api/v1/users for users.
//
// Read-only for now, so there's nothing to save. Registering (POST /users)
// arrives in Week 8; if the mock ever serves it, copy the load/persist
// pattern from ticketDb.ts.
// The sample users, plus anyone registered since the page loaded. Kept in
// memory only: registering through the mock lasts until a refresh, which is
// enough to try the register page. The sample array itself is never changed.
let users: User[] = [...sampleUsers]

export function getAllUsers(): User[] {
  return users
}

// Adds a newly registered user (POST /auth/register).
export function addUser(user: User): void {
  users = [...users, user]
}

// Back to the six sample users. Tests call it so one test's registrations
// can't leak into the next.
export function resetToSampleUsers(): User[] {
  users = [...sampleUsers]
  return users
}
