import type { User } from '../features/users/types.ts'

// Sample users for the mock API, in the contract's User shape.
//
// The same six people, in the same order (so the same ids), as the real
// backend seeds: the project leads from employees.ts. With the mock or the
// real backend, the Users page shows the same directory.
//
// phone, address and company are empty strings, exactly as the backend sends
// them: OpsDesk has no source for those fields (opsdesk-backend NOTES.md,
// decision 15), and the mock mustn't make up data the backend doesn't have.
function sampleUser(id: number, name: string, email: string): User {
  return {
    id,
    name,
    // The part of the email before the @, as the backend's seeder does.
    username: email.slice(0, email.indexOf('@')),
    email,
    phone: '',
    address: { street: '', suite: '', city: '', zipcode: '' },
    company: { name: '' },
  }
}

export const users: User[] = [
  sampleUser(1, 'Priya Sharma', 'priya.sharma@opsdesk.com'),
  sampleUser(2, 'Daniel Mensah', 'daniel.mensah@opsdesk.com'),
  sampleUser(3, 'Kwame Asante', 'kwame.asante@opsdesk.com'),
  sampleUser(4, 'Liam Carter', 'liam.carter@opsdesk.com'),
  sampleUser(5, 'Fatima Bello', 'fatima.bello@opsdesk.com'),
  sampleUser(6, 'Marco Silva', 'marco.silva@opsdesk.com'),
]
