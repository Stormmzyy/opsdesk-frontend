import PageHeader from '../components/PageHeader.tsx'
import UserDirectory from '../features/users/components/UserDirectory.tsx'

function UsersPage() {
  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone with an OpsDesk account."
      />
      <UserDirectory />
    </>
  )
}

export default UsersPage
