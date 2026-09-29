import type { User } from '../../../types.ts'
import UserCard from './UserCard.tsx'
import './UserList.css'

interface UserListProps {
  users: User[]
}

function UserList({ users }: UserListProps) {
  return (
    <ul className="user-list">
      {users.map((user) => (
        <li key={user.id}>
          <UserCard user={user} />
        </li>
      ))}
    </ul>
  )
}

export default UserList
