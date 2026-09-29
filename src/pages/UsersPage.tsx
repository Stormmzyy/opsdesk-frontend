import type { User } from '../types.ts'
import { useFetch } from '../hooks/useFetch.ts'
import PageHeader from '../components/common/PageHeader.tsx'
import StatusMessage from '../components/common/StatusMessage.tsx'
import UserList from '../components/users/UserList.tsx'

const USERS_API_URL = 'https://jsonplaceholder.typicode.com/users'

function UsersPage() {
  // <User[]> tells useFetch what the JSON will look like, so `users` is
  // typed as User[] | null.
  const { data: users, status, retry } = useFetch<User[]>(USERS_API_URL)

  return (
    <>
      <PageHeader
        title="Users"
        description="People loaded live from the JSONPlaceholder API."
      />

      {status === 'loading' && (
        <StatusMessage type="loading">Loading users…</StatusMessage>
      )}

      {status === 'error' && (
        <StatusMessage type="error" onRetry={retry}>
          Sorry, we couldn't load users. Check your connection.
        </StatusMessage>
      )}

      {status === 'empty' && <StatusMessage type="empty">No users found.</StatusMessage>}

      {/* users is null until data arrives, so check it as well as the status. */}
      {status === 'success' && users && <UserList users={users} />}
    </>
  )
}

export default UsersPage
