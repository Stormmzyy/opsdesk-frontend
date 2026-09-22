import { useFetch } from '../../hooks/useFetch.js'
import UserCard from './UserCard.jsx'
import './UserDirectory.css'

const USERS_API_URL = 'https://jsonplaceholder.typicode.com/users'

function UserDirectory() {
  const { data: users, status, retry } = useFetch(USERS_API_URL)

  return (
    <section className="user-directory">
      <h2>Users</h2>

      {status === 'loading' && (
        <p className="user-directory__message" role="status">
          Loading users…
        </p>
      )}

      {status === 'error' && (
        <div className="user-directory__message" role="alert">
          <p>Sorry, we couldn't load users. Check your connection.</p>
          <button
            type="button"
            className="user-directory__retry"
            onClick={retry}
          >
            Retry
          </button>
        </div>
      )}

      {status === 'empty' && (
        <p className="user-directory__message">No users found.</p>
      )}

      {status === 'success' && (
        <ul className="user-directory__list">
          {users.map((user) => (
            <li key={user.id}>
              <UserCard user={user} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default UserDirectory
