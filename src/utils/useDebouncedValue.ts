import { useEffect, useState } from 'react'

// The value, but only once it has stopped changing for `delayMs`.
//
// Used for the ticket search: every search is now a request to the server,
// and without this, typing "printer" would send seven requests ("p", "pr",
// "pri", ...) whose answers could even arrive out of order. With it, one
// request goes once the person pauses.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delayMs)
    // A new keystroke before the delay is up cancels the previous timer.
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return settled
}
