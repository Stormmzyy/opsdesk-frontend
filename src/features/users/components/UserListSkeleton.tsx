import { Fragment } from 'react'
import Skeleton from '../../../components/Skeleton.tsx'
import './UserCard.css'
import './UserList.css'

// The sample data has 6 users, so 6 placeholder cards: close enough to the
// real list that the page doesn't jump when it arrives.
const CARD_COUNT = 6

// Every card shows email; company and city appear only when the backend has
// them, which it doesn't yet (decision 15 in opsdesk-backend's NOTES.md).
// So the placeholder has one detail row, matching the cards that arrive.
const DETAIL_ROWS = 1

// The loading placeholder for UserList: a grid of cards with the same
// elements and CSS classes as UserCard (name, @username, then the detail
// rows), with skeletons in place of the text.
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
              {Array.from({ length: DETAIL_ROWS }, (_, detail) => (
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
