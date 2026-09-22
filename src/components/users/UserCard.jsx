import './UserCard.css'

// "user" comes straight from the JSONPlaceholder API, so the company name
// and city are nested one level down.
function UserCard({ user }) {
  return (
    <article className="user-card">
      <h3 className="user-card__name">{user.name}</h3>
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
