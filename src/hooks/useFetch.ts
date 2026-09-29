import { useEffect, useState } from 'react'

// The four states a request can be in.
export type FetchStatus = 'loading' | 'success' | 'empty' | 'error'

export interface FetchResult<T> {
  // null until the first successful response arrives.
  data: T | null
  status: FetchStatus
  retry: () => void
}

// Fetches JSON from `url` and tracks the request with a single status.
// Returns { data, status, retry }. Call retry() to fetch again.
//
// <T> is a type parameter: the caller says what shape the JSON will be,
// e.g. useFetch<User[]>(url), and then `data` is typed as User[] | null.
export function useFetch<T>(url: string): FetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [status, setStatus] = useState<FetchStatus>('loading')
  // Bumping this number re-runs the effect below, which fetches again.
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Lets us cancel the request if the component unmounts before it finishes.
    const controller = new AbortController()

    async function loadData() {
      try {
        const response = await fetch(url, { signal: controller.signal })

        // fetch only rejects on network failure, so check the HTTP status too.
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        // TypeScript can't check data that arrives over the network: it only
        // exists once the app is running. So here we TRUST that the API sends
        // the shape the caller asked for (T). If the API changed its format,
        // TypeScript would not catch it.
        const json: T = await response.json()
        setData(json)
        // An empty list is its own state, so the UI can say "nothing found".
        setStatus(Array.isArray(json) && json.length === 0 ? 'empty' : 'success')
      } catch {
        // We cancelled on purpose, so the component is gone: do nothing.
        if (controller.signal.aborted) {
          return
        }
        setStatus('error')
      }
    }

    loadData()

    // Cleanup: runs when the component unmounts, or before the effect re-runs.
    return () => controller.abort()
  }, [url, retryCount])

  function retry() {
    setStatus('loading')
    setRetryCount((count) => count + 1)
  }

  return { data, status, retry }
}
