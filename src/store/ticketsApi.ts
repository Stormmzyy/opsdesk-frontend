import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Ticket, TicketFormValues } from '../features/tickets/types.ts'

// Everything the app knows about talking to the ticket API, in one place.
//
// RTK Query handles the work useFetch does by hand: it sends the request,
// tracks isLoading and isError, and keeps the result in a cache inside the
// Redux store. Two components asking for the same data share ONE request
// and one cached copy.
//
// Tickets are server state: the API owns them, and this cache is just our
// latest copy. That's why they live here, not in a normal Redux slice.

// The arguments for updateTicket: which ticket, plus only the fields to
// change, e.g. { id: 3, status: 'RESOLVED' } or a whole edited form.
export type TicketUpdate = Pick<Ticket, 'id'> & Partial<Omit<Ticket, 'id'>>

// A cache "tag": a label saying what a piece of cached data contains.
// - { type: 'Ticket', id: 3 } means "this data includes ticket 3".
// - { type: 'Ticket', id: 'LIST' } means "this is THE list of tickets".
// Writing the type out lets TypeScript check every tag below.
type TicketTag = { type: 'Ticket'; id: number | 'LIST' }

const LIST_TAG: TicketTag = { type: 'Ticket', id: 'LIST' }

export const ticketsApi = createApi({
  // Where this api's cache lives in the store: state.ticketsApi.
  reducerPath: 'ticketsApi',
  // fetchBaseQuery is a small wrapper around fetch. Every endpoint's URL is
  // added onto the base URL, so '/tickets' becomes '<this site>/api/tickets'.
  // The base is built from the page's own address (e.g.
  // http://localhost:5173/api) instead of just "/api": browsers fill in the
  // site for a relative URL, but the tests run in Node, whose fetch rejects
  // relative URLs. In the browser both versions mean exactly the same URL.
  baseQuery: fetchBaseQuery({ baseUrl: new URL('/api', window.location.origin).href }),
  // The kinds of tag this api uses. We only have one kind: tickets.
  tagTypes: ['Ticket'],

  endpoints: (builder) => ({
    // builder.query<Result, Argument>: reads data. void means "no argument".
    getTickets: builder.query<Ticket[], void>({
      query: () => '/tickets',
      // "This cached list contains these tickets, and it is THE list."
      // The per-id tags mean a change to ANY ticket in it marks it stale.
      providesTags: (result) =>
        result
          ? [...result.map((ticket): TicketTag => ({ type: 'Ticket', id: ticket.id })), LIST_TAG]
          : [LIST_TAG],
    }),

    getTicket: builder.query<Ticket, number>({
      query: (id) => `/tickets/${id}`,
      // "This cached entry contains ticket <id>."
      // (Unused parameters start with _ so TypeScript doesn't complain.)
      providesTags: (_result, _error, id) => [{ type: 'Ticket', id }],
    }),

    // builder.mutation<Result, Argument>: changes data on the server.
    addTicket: builder.mutation<Ticket, TicketFormValues>({
      query: (values) => ({ url: '/tickets', method: 'POST', body: values }),
      // A new ticket only changes the list. No cached single ticket can
      // contain it yet, so only the LIST tag needs refreshing.
      invalidatesTags: [LIST_TAG],
    }),

    updateTicket: builder.mutation<Ticket, TicketUpdate>({
      // Pull the id out for the URL; send everything else as the body.
      query: ({ id, ...changes }) => ({ url: `/tickets/${id}`, method: 'PATCH', body: changes }),
      // "Ticket <id> changed." RTK Query then refetches every cached query
      // that PROVIDED this tag: the list (it contains ticket <id>) and
      // getTicket(<id>). Other single tickets in the cache are left alone.
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Ticket', id }],
      // Also put the saved ticket straight into the getTicket(<id>) cache as
      // soon as the server answers. Without this, going from the edit page to
      // the detail page would briefly show the OLD ticket while the refetch
      // above is still on its way.
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: savedTicket } = await queryFulfilled
          dispatch(ticketsApi.util.upsertQueryData('getTicket', id, savedTicket))
        } catch {
          // The request failed. The page that sent it shows the error.
        }
      },
    }),

    // Restores the sample tickets on the mock API. Invalidating the plain
    // 'Ticket' type (no id) refetches EVERY ticket query: the list and every
    // single ticket, since all of them may have changed.
    resetTickets: builder.mutation<Ticket[], void>({
      query: () => ({ url: '/tickets/reset', method: 'POST' }),
      invalidatesTags: ['Ticket'],
    }),
  }),
})

// createApi generates a React hook for every endpoint, named after it:
// getTickets -> useGetTicketsQuery, addTicket -> useAddTicketMutation, etc.
export const {
  useGetTicketsQuery,
  useGetTicketQuery,
  useAddTicketMutation,
  useUpdateTicketMutation,
  useResetTicketsMutation,
} = ticketsApi

// True when a request failed because the server answered 404 Not Found.
// RTK Query errors come in two shapes: FetchBaseQueryError (the server
// answered, and it has a status) or SerializedError (something in our own
// code threw). The `'status' in error` check tells them apart without a cast.
export function isNotFoundError(error: FetchBaseQueryError | SerializedError | undefined): boolean {
  return error !== undefined && 'status' in error && error.status === 404
}
