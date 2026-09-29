import PageHeader from '../components/PageHeader.tsx'
import UserDirectory from '../features/users/components/UserDirectory.tsx'

function UsersPage() {
  return (
    <>
      <PageHeader
        title="Users"
        description="People loaded live from the JSONPlaceholder API."
      />
      <UserDirectory />
    </>
  )
}

export default UsersPage
