import { useFetch } from '../hooks/useFetch.js'
import StatusMessage from '../components/common/StatusMessage.jsx'
import UserList from '../components/users/UserList.jsx'
import './UsersPage.css'

const USERS_API_URL = 'https://jsonplaceholder.typicode.com/users'

function UsersPage() {
  const { data: users, status, retry } = useFetch(USERS_API_URL)

  return (
    <section className="users-page">
      <h2>Users</h2>

      {status === 'loading' && (
        <StatusMessage type="loading">Loading users…</StatusMessage>
      )}

      {status === 'error' && (
        <StatusMessage type="error" onRetry={retry}>
          Sorry, we couldn't load users. Check your connection.
        </StatusMessage>
      )}

      {status === 'empty' && <StatusMessage type="empty">No users found.</StatusMessage>}

      {status === 'success' && <UserList users={users} />}
    </section>
  )
}

export default UsersPage
