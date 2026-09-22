import { useEffect, useState } from 'react'
import UserCard from './UserCard.jsx'
import './UserDirectory.css'

const USERS_API_URL = 'https://jsonplaceholder.typicode.com/users'

function UserDirectory() {
  const [users, setUsers] = useState([])
  // One value describes the request: 'loading' | 'success' | 'empty' | 'error'
  const [status, setStatus] = useState('loading')
  // Bumping this number re-runs the effect below, which fetches again.
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Lets us cancel the request if the component unmounts before it finishes.
    const controller = new AbortController()

    async function loadUsers() {
      try {
        const response = await fetch(USERS_API_URL, { signal: controller.signal })

        // fetch only rejects on network failure, so check the HTTP status too.
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data = await response.json()
        setUsers(data)
        setStatus(data.length === 0 ? 'empty' : 'success')
      } catch (error) {
        // We cancelled on purpose, so the component is gone: do nothing.
        if (error.name === 'AbortError') {
          return
        }
        setStatus('error')
      }
    }

    loadUsers()

    // Cleanup: runs when the component unmounts, or before a retry re-runs this.
    return () => controller.abort()
  }, [retryCount])

  function handleRetry() {
    setStatus('loading')
    setRetryCount((count) => count + 1)
  }

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
            onClick={handleRetry}
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
