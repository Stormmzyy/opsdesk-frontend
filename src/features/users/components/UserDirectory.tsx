import SkeletonGroup from '../../../components/SkeletonGroup.tsx'
import StatusMessage from '../../../components/StatusMessage.tsx'
import { useGetUsersQuery } from '../../../store/usersApi.ts'
import UserList from './UserList.tsx'
import UserListSkeleton from './UserListSkeleton.tsx'

// Loads the users from GET /api/v1/users and shows the right thing for each
// state of the request, the same way the Tickets and Projects pages do.
function UserDirectory() {
  const { data: users, isLoading, isError, refetch } = useGetUsersQuery()

  return (
    <>
      {isLoading && (
        <SkeletonGroup label="Loading users">
          <UserListSkeleton />
        </SkeletonGroup>
      )}

      {isError && (
        <StatusMessage type="error" onRetry={refetch}>
          Sorry, we couldn't load users. Check your connection.
        </StatusMessage>
      )}

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

export default UserDirectory
