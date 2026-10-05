import { setupWorker } from 'msw/browser'
import { handlers } from './handlers.ts'

// The browser side of the mock API. setupWorker registers the service worker
// in public/mockServiceWorker.js. A service worker sits between the page and
// the network, so it can see every fetch the app makes and hand it to our
// handlers instead of sending it to a real server.
export const worker = setupWorker(...handlers)
