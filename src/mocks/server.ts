import { setupServer } from 'msw/node'
import { handlers } from './handlers.ts'

// The Node version of browser.ts, for tests. Tests run in Node, which has no
// service workers, so MSW intercepts requests inside Node instead. It uses
// the very same handlers, so tests talk to the same mock API as the browser.
export const server = setupServer(...handlers)
