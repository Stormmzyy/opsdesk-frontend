import { users as sampleUsers } from '../data/users.ts'
import type { User } from '../features/users/types.ts'

// The mock API's user "database", like projectDb.ts. Only the MSW handlers use
// this file: the app itself asks /api/v1/users for users.
//
// Read-only for now, so there's nothing to save. Registering (POST /users)
// arrives in Week 8; if the mock ever serves it, copy the load/persist
// pattern from ticketDb.ts.
export function getAllUsers(): User[] {
  return sampleUsers
}
