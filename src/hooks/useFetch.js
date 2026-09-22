import { useEffect, useState } from 'react'

// Fetches JSON from `url` and tracks the request with a single status:
// 'loading' | 'success' | 'empty' | 'error'
// Returns { data, status, retry }. Call retry() to fetch again.
export function useFetch(url) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
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

        const json = await response.json()
        setData(json)
        // An empty list is its own state, so the UI can say "nothing found".
        setStatus(Array.isArray(json) && json.length === 0 ? 'empty' : 'success')
      } catch (error) {
        // We cancelled on purpose, so the component is gone: do nothing.
        if (error.name === 'AbortError') {
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
