import Skeleton from '../../../components/Skeleton.tsx'
import { TICKET_STATUSES, getNextStatus } from '../utils/ticketStatus.ts'
import './TicketBoard.css'
import './TicketCard.css'
import './TicketColumn.css'

// How many placeholder cards each column gets: roughly what the sample data
// spreads across the four statuses, so the board doesn't grow or shrink much
// when the real cards arrive.
const CARDS_PER_COLUMN = [4, 3, 3, 2]

// The loading placeholder for TicketBoard: four columns of placeholder cards,
// using the board's, columns' and cards' own CSS classes so everything is the
// same size as the real thing. The column names are known before any data
// arrives, but they're drawn as skeletons too, so the whole board reads as
// "still loading". Wrap it in a SkeletonGroup.
function TicketBoardSkeleton() {
  return (
    <div className="ticket-board__columns">
      {TICKET_STATUSES.map((status, columnIndex) => (
        <div key={status.value} className="ticket-column">
          <div className="ticket-column__header">
            <Skeleton width="6rem" />
            <Skeleton width="1.75rem" height="1.5rem" shape="pill" />
          </div>
          <div className="ticket-column__list">
            {Array.from({ length: CARDS_PER_COLUMN[columnIndex] ?? 2 }, (_, cardIndex) => (
              <div key={cardIndex} className="ticket-card">
                {/* Two bars with a space between, like two words: on a wide
                    card they share one line, and on a narrow one the second
                    wraps onto a new line, just as a real title's text would. */}
                <p className="ticket-card__title">
                  <Skeleton width="10rem" /> <Skeleton width={cardIndex % 2 === 0 ? '6rem' : '4rem'} />
                </p>
                <div className="ticket-card__meta">
                  <Skeleton width="3.75rem" height="1.25rem" shape="pill" />
                  <Skeleton width="5rem" />
                </div>
                <div className="ticket-card__actions">
                  {/* Real cards in the last column (Closed) have no "Move
                      to…" button, so neither do these. */}
                  {getNextStatus(status.value) && <Skeleton width="9.5rem" height="2.1875rem" />}
                  <Skeleton width="8rem" height="1.75rem" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default TicketBoardSkeleton
