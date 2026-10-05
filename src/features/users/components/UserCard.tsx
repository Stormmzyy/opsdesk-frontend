import type { User } from '../types.ts'
import './UserCard.css'

interface UserCardProps {
  user: User
}

// "user" comes straight from the JSONPlaceholder API, so the company name
// and city are nested one level down.
// The name is an <h2> because the cards sit directly under the page's <h1>.
// Skipping to <h3> would make screen reader users think a level was missing.
function UserCard({ user }: UserCardProps) {
  return (
    <article className="user-card">
      <h2 className="user-card__name">{user.name}</h2>
      <p className="user-card__username">@{user.username}</p>
      <dl className="user-card__details">
        <dt>Email</dt>
        <dd>
          <a href={`mailto:${user.email}`}>{user.email}</a>
        </dd>

        <dt>Company</dt>
        <dd>{user.company.name}</dd>

        <dt>City</dt>
        <dd>{user.address.city}</dd>
      </dl>
    </article>
  )
}

export default UserCard
