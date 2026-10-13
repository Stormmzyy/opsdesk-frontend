import { Fragment } from 'react'
import Skeleton from '../../../components/Skeleton.tsx'
import './UserCard.css'
import './UserList.css'

// JSONPlaceholder always sends 10 users, so 10 placeholder cards.
const CARD_COUNT = 10

// The loading placeholder for UserList: a grid of cards with the same
// elements and CSS classes as UserCard (name, @username, then email,
// company and city), with skeletons in place of the text.
// Wrap it in a SkeletonGroup.
function UserListSkeleton() {
  return (
    <ul className="user-list">
      {Array.from({ length: CARD_COUNT }, (_, index) => (
        <li key={index}>
          <div className="user-card">
            <h2 className="user-card__name">
              <Skeleton width="9rem" />
            </h2>
            <p className="user-card__username">
              <Skeleton width="5rem" />
            </p>
            <dl className="user-card__details">
              {/* A Fragment groups each dt and dd without adding an element,
                  because the CSS grid expects them as direct children. A
                  Fragment needs to be written out in full to take a key. */}
              {[0, 1, 2].map((detail) => (
                <Fragment key={detail}>
                  <dt>
                    <Skeleton width="3.5rem" />
                  </dt>
                  <dd>
                    <Skeleton width="8rem" />
                  </dd>
                </Fragment>
              ))}
            </dl>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default UserListSkeleton
