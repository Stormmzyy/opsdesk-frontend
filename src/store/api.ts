import type { SerializedError } from '@reduxjs/toolkit'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { sessionExpired } from './authActions.ts'
// Type-only: store.ts imports this file, so a real import back would be a
// cycle. getState() is typed `unknown` by RTK Query, which can't know the
// store's shape; this is the cast's target.
import type { RootState } from './store.ts'

// fetchBaseQuery is a small wrapper around fetch. Every endpoint's URL is
// added onto the base URL, so '/tickets' becomes '<this site>/api/v1/tickets'.
//
// The base URL comes from the VITE_API_URL environment variable (see
// .env.example), so pointing the app at the real backend later only means
// changing .env, not this code.
// - "?? '/api/v1'": a fresh clone has no .env file, and then the variable
//   is undefined. The fallback keeps the app (and the tests) working anyway.
// - new URL(..., window.location.origin): turns "/api/v1" into a full URL
//   like http://localhost:5173/api/v1. Browsers fill in the site for a
//   relative URL by themselves, but the tests run in Node, whose fetch
//   rejects relative URLs. A full URL (like https://api.example.com/v1) is
//   left as it is, because the second argument is only used for relative ones.
const rawBaseQuery = fetchBaseQuery({
  baseUrl: new URL(import.meta.env.VITE_API_URL ?? '/api/v1', window.location.origin).href,
  // Runs before every request, so no endpoint has to remember to send the
  // token: if there is one, it goes in the contract's header
  // (API_CONTRACT.md, "Signing in and the token").
  //
  // It reads the token from the store at the moment the request leaves,
  // not when the endpoint was defined, so a token received a moment ago
  // (login, then straight away /auth/me) is already sent.
  //
  // With no token, no header at all, rather than "Bearer null": login and
  // register need none, and the server's answer to a request without one
  // is the plain 401 the contract describes.
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

// The two endpoints where a 401 is an ANSWER, not a verdict on our token.
//
// A wrong email or password makes /auth/login answer 401 ("The email or
// password is incorrect."). Treated as an expired session, it would clear
// the (non-existent) session and send the person to /login, which is the
// page they're on: a redirect loop at worst, and at best the form resets
// and "wrong password" is never shown. The login form handles that 401
// itself. /auth/register is listed for the same reason: it sends no token,
// so a 401 from it can't be about one.
//
// Matched by endpoint name (the key in authApi.ts), not by URL, so a change
// of path or base URL can't silently drop the exclusion.
const ENDPOINTS_WITHOUT_A_SESSION = new Set(['login', 'register'])

// Every request goes through here. On a 401, the server has stopped
// accepting our token (it expired, or the account is gone, see the
// contract's "Signing in and the token"), so the session is over:
// sessionExpired clears the token and the user, and ProtectedRoute, seeing
// no token, sends the person to /login with "Your session expired".
//
// This is the one place that decides a session is over. The routes only
// react to "no token", so there's one guard for each job, and the two can't
// disagree.
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  queryApi,
  extraOptions,
) => {
  // The token this request is about to carry, read before it leaves.
  const sentToken = (queryApi.getState() as RootState).auth.token
  const result = await rawBaseQuery(args, queryApi, extraOptions)

  if (
    result.error?.status === 401 &&
    !ENDPOINTS_WITHOUT_A_SESSION.has(queryApi.endpoint) &&
    // Only if there WAS a session, and it's still the one this request
    // carried. A slow request sent with an old token can answer 401 after
    // the person has signed in again; that 401 is about the old token, and
    // must not sign the new session out.
    sentToken !== null &&
    (queryApi.getState() as RootState).auth.token === sentToken
  ) {
    queryApi.dispatch(sessionExpired())
  }
  return result
}

// The ONE RTK Query api for the whole app: the settings every request
// shares. It starts with no endpoints of its own. Each feature adds its
// endpoints from its own file with api.injectEndpoints(), see ticketsApi.ts
// and projectsApi.ts.
//
// Why one api instead of a createApi() per feature: RTK Query recommends
// one api per server (per base URL). Every endpoint then shares one cache
// and one middleware in the store, and one feature's mutation can refresh
// another feature's data through tags. Two separate apis couldn't do that,
// and each would add its own reducer and middleware to the store.
export const api = createApi({
  // Where the cache lives in the store: state.api.
  reducerPath: 'api',
  baseQuery,
  // Every kind of cache tag any feature uses. TypeScript checks each tag in
  // ticketsApi.ts, projectsApi.ts and usersApi.ts against this list.
  tagTypes: ['Ticket', 'Project', 'User'],
  // Empty on purpose: the features inject their endpoints.
  endpoints: () => ({}),
})

// True when the API said "that item doesn't exist": a 404 status AND the
// contract's error body, { "error": "NOT_FOUND", ... } (see API_CONTRACT.md).
//
// Why the body matters: a 404 with any other body (or none) means the API
// itself wasn't found, not the item. That's what happens in a production
// build with no backend (`npm run preview` answers a bare 404 for every
// /api/v1 request), or when VITE_API_URL points at the wrong place. Checking
// the status alone made those pages say "Ticket not found", which is wrong
// and alarming; now they show the normal "couldn't load" error with Retry.
//
// RTK Query errors come in two shapes: FetchBaseQueryError (the server
// answered, and it has a status) or SerializedError (something in our own
// code threw). The `'status' in error` check tells them apart without a
// cast. error.data is the parsed response body, typed `unknown` because
// the server could send anything, so it's checked step by step.
export function isNotFoundError(error: FetchBaseQueryError | SerializedError | undefined): boolean {
  if (error === undefined || !('status' in error) || error.status !== 404) {
    return false
  }
  const body = error.data
  return typeof body === 'object' && body !== null && 'error' in body && body.error === 'NOT_FOUND'
}
