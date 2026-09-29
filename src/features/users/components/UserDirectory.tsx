import StatusMessage from '../../../components/StatusMessage.tsx'
import { useUsers } from '../hooks/useUsers.ts'
import UserList from './UserList.tsx'

// Loads the users and shows the right thing for each state of the request.
function UserDirectory() {
  const { data: users, status, retry } = useUsers()

  return (
    <>
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

export default UserDirectory
