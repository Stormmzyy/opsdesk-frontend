// One page cut out of a longer list, plus the numbers needed to describe it,
// e.g. "Showing 11 to 12 of 12".
export interface PageOf<T> {
  items: T[]
  // The page actually shown, starting at 1.
  currentPage: number
  totalPages: number
  totalItems: number
  // Position of the first and last item on this page, counting from 1.
  // Both are 0 when the list is empty.
  firstItemNumber: number
  lastItemNumber: number
}

// Works for a list of anything: <T> is the type of the items.
// If the requested page is past the end (for example because the list got
// shorter), it shows the last page instead of an empty one.
export function paginate<T>(items: T[], requestedPage: number, pageSize: number): PageOf<T> {
  const totalItems = items.length
  // Always at least one page, even when the list is empty.
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages)

  // slice() copies part of the array; it doesn't change the original.
  const startIndex = (currentPage - 1) * pageSize
  const pageItems = items.slice(startIndex, startIndex + pageSize)

  return {
    items: pageItems,
    currentPage,
    totalPages,
    totalItems,
    firstItemNumber: totalItems === 0 ? 0 : startIndex + 1,
    lastItemNumber: startIndex + pageItems.length,
  }
}
