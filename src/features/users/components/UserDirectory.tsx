import SkeletonGroup from '../../../components/SkeletonGroup.tsx'
import StatusMessage from '../../../components/StatusMessage.tsx'
import { readApiError } from '../../../store/apiError.ts'
import { useGetUsersQuery } from '../../../store/usersApi.ts'
import UserList from './UserList.tsx'
import UserListSkeleton from './UserListSkeleton.tsx'

// Loads the users from GET /api/v1/users and shows the right thing for each
// state of the request, the same way the Tickets and Projects pages do.
//
// Only ADMIN and MANAGER may list users, and the page is still routable for
// everyone: hiding it would be convenience, like hiding a button, and the
// server's 403 would still need handling for a typed URL or a role that
// changed since sign-in. So a refusal is said as a refusal.
function UserDirectory() {
  const { data: users, isLoading, isError, error, refetch } = useGetUsersQuery()

  return (
    <>
      {isLoading && (
        <SkeletonGroup label="Loading users">
          <UserListSkeleton />
        </SkeletonGroup>
      )}

      {isError && <LoadFailure error={error} onRetry={refetch} />}

      {/* The directory should never be empty, so this most likely means a
          problem on the API's side: offer Retry rather than a dead end. */}
      {users && !isError && users.length === 0 && (
        <StatusMessage type="empty" onRetry={refetch}>
          The user directory came back empty. This is usually temporary, so try again in a
          moment.
        </StatusMessage>
      )}

      {users && !isError && users.length > 0 && <UserList users={users} />}
    </>
  )
}

interface LoadFailureProps {
  error: unknown
  onRetry: () => void
}

// Three different failures, three different sentences, because each one
// tells the person something different to do:
// - FORBIDDEN: nothing to fix on their side, and asking again gets the same
//   answer, so there is no Retry button.
// - Any other answer from the server (a 500, say): the server had a
//   problem, and a retry may well work. Their connection is fine: the
//   answer arrived.
// - No answer at all (readApiError gives null): only then is the connection
//   the likely cause.
function LoadFailure({ error, onRetry }: LoadFailureProps) {
  const apiError = readApiError(error)
  if (apiError?.error === 'FORBIDDEN') {
    return <StatusMessage type="error">You don't have permission to see the user list.</StatusMessage>
  }
  return (
    <StatusMessage type="error" onRetry={onRetry}>
      {apiError === null
        ? "Sorry, we couldn't load users. Check your connection."
        : "Sorry, we couldn't load users. The server had a problem, so try again in a moment."}
    </StatusMessage>
  )
}

export default UserDirectory
