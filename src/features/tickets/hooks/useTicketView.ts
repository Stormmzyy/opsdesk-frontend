import { useSearchParams } from 'react-router-dom'

export type TicketView = 'list' | 'board'

// Which way the Tickets page shows its tickets: as a list or as a board.
//
// The choice lives in the URL (/tickets?view=board) rather than in useState:
// - The Tickets page can read it while the tickets are still loading, and
//   show a skeleton of the right view (TicketBrowser, which owns the
//   buttons, isn't on screen yet at that point).
// - Refreshing the page, or sharing the link, keeps the board.
//
// Returns [view, setView], like useState does.
export function useTicketView(): [TicketView, (nextView: TicketView) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  // Anything other than "board" (including no ?view at all) means the list.
  const view: TicketView = searchParams.get('view') === 'board' ? 'board' : 'list'

  function setView(nextView: TicketView) {
    // Copy the current parameters so any others in the URL are kept.
    const nextParams = new URLSearchParams(searchParams)
    if (nextView === 'board') {
      nextParams.set('view', 'board')
    } else {
      // The list is the default, so it needs no parameter: plain /tickets.
      nextParams.delete('view')
    }
    // replace: switching views shouldn't add a history entry, so the
    // browser's Back button still leaves the Tickets page in one step.
    setSearchParams(nextParams, { replace: true })
  }

  return [view, setView]
}
