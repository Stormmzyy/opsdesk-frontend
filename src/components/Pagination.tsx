import './Pagination.css'

interface PaginationProps {
  // The page being shown, starting at 1.
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  // Names this set of controls for screen readers, e.g. "Ticket list pages".
  label: string
}

// Previous and Next buttons with the current page number between them.
// The buttons are disabled on the first and last page.
function Pagination({ currentPage, totalPages, onPageChange, label }: PaginationProps) {
  return (
    <nav className="pagination" aria-label={label}>
      <button
        type="button"
        className="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      <p className="pagination__current">
        Page {currentPage} of {totalPages}
      </p>
      <button
        type="button"
        className="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </nav>
  )
}

export default Pagination
