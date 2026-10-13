// Turns the :id part of a URL (e.g. "3" in /tickets/3 or /projects/3) into a
// numeric id. URL params are always strings, but our ids are numbers.
// Returns undefined for anything that isn't a whole number made only of
// digits, e.g. "abc", "3.5", "-1", "" or a missing param, because
// Number() alone would happily turn "" into 0 and " 3 " into 3.
// Used by the pages (to read the URL) and by the mock API (to read the
// request URL), so both agree on what a valid id looks like.
export function parseId(idParam: string | undefined): number | undefined {
  if (idParam === undefined || !/^\d+$/.test(idParam)) {
    return undefined
  }
  return Number(idParam)
}
