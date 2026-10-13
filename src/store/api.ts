import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

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
  baseQuery: fetchBaseQuery({
    baseUrl: new URL(import.meta.env.VITE_API_URL ?? '/api/v1', window.location.origin).href,
  }),
  // Every kind of cache tag any feature uses. TypeScript checks each tag in
  // ticketsApi.ts and projectsApi.ts against this list.
  tagTypes: ['Ticket', 'Project'],
  // Empty on purpose: the features inject their endpoints.
  endpoints: () => ({}),
})

// True when a request failed because the server answered 404 Not Found.
// RTK Query errors come in two shapes: FetchBaseQueryError (the server
// answered, and it has a status) or SerializedError (something in our own
// code threw). The `'status' in error` check tells them apart without a cast.
export function isNotFoundError(error: FetchBaseQueryError | SerializedError | undefined): boolean {
  return error !== undefined && 'status' in error && error.status === 404
}
