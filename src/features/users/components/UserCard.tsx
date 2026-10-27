import type { User } from '../types.ts'
import './UserCard.css'

interface UserCardProps {
  user: User
}

// One user from GET /api/v1/users. The company name and city are nested one
// level down, as in the contract's User object.
// The name is an <h2> because the cards sit directly under the page's <h1>.
// Skipping to <h3> would make screen reader users think a level was missing.
function UserCard({ user }: UserCardProps) {
  // The backend sends "" for fields OpsDesk has no data for yet (opsdesk-backend
  // NOTES.md, decision 15). A row with a label and nothing next to it reads as
  // broken, so a row is shown only when it has a value. Nothing is made up to
  // fill the gap.
  const company = user.company.name.trim()
  const city = user.address.city.trim()

  return (
    <article className="user-card">
      <h2 className="user-card__name">{user.name}</h2>
      <p className="user-card__username">@{user.username}</p>
      <dl className="user-card__details">
        <dt>Email</dt>
        <dd>
          <a href={`mailto:${user.email}`}>{user.email}</a>
        </dd>

        {company !== '' && (
          <>
            <dt>Company</dt>
            <dd>{company}</dd>
          </>
        )}

        {city !== '' && (
          <>
            <dt>City</dt>
            <dd>{city}</dd>
          </>
        )}
      </dl>
    </article>
  )
}

export default UserCard
