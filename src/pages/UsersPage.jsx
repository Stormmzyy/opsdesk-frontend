import { useFetch } from '../hooks/useFetch.js'
import UserList from '../components/users/UserList.jsx'
import './UsersPage.css'

const USERS_API_URL = 'https://jsonplaceholder.typicode.com/users'

function UsersPage() {
  const { data: users, status, retry } = useFetch(USERS_API_URL)

  return (
    <section className="users-page">
      <h2>Users</h2>

      {status === 'loading' && (
        <p className="users-page__message" role="status">
          Loading users…
        </p>
      )}

      {status === 'error' && (
        <div className="users-page__message" role="alert">
          <p>Sorry, we couldn't load users. Check your connection.</p>
          <button type="button" className="users-page__retry" onClick={retry}>
            Retry
          </button>
        </div>
      )}

      {status === 'empty' && (
        <p className="users-page__message">No users found.</p>
      )}

      {status === 'success' && <UserList users={users} />}
    </section>
  )
}

export default UsersPage
