import Skeleton from '../../../components/Skeleton.tsx'
import type { TicketView } from '../hooks/useTicketView.ts'
import TicketBoardSkeleton from './TicketBoardSkeleton.tsx'
import TicketListSkeleton from './TicketListSkeleton.tsx'
import './TicketBrowser.css'
import './TicketFilters.css'

interface TicketBrowserSkeletonProps {
  view: TicketView
}

// The loading placeholder for the whole TicketBrowser: the search box, the
// status filter, the List/Board buttons and the "Showing…" line, then the
// list or the board, whichever is selected. With the toolbar included,
// nothing below it moves when the real tickets arrive.
// Wrap it in a SkeletonGroup.
function TicketBrowserSkeleton({ view }: TicketBrowserSkeletonProps) {
  return (
    <>
      <div className="ticket-browser__toolbar">
        <div className="ticket-filters">
          {/* Two "label above an input" placeholders, using the real
              filter-field class so they line up with the real ones. */}
          {[0, 1].map((field) => (
            <div key={field} className="filter-field">
              {/* Wrapped in a span with the label's font size, so it takes
                  up the same height as the real label's line of text. */}
              <span className="ticket-browser__label-skeleton">
                <Skeleton width="6rem" />
              </span>
              {/* 10px padding top and bottom, a 24px line, 1px borders. */}
              <Skeleton height="2.875rem" />
            </div>
          ))}
        </div>
        <div className="ticket-browser__views">
          <Skeleton width="3.5rem" height="2.625rem" />
          <Skeleton width="4.5rem" height="2.625rem" />
        </div>
      </div>

      <p className="ticket-browser__summary">
        <Skeleton width="11rem" />
      </p>

      {view === 'board' ? <TicketBoardSkeleton /> : <TicketListSkeleton />}
    </>
  )
}

export default TicketBrowserSkeleton
