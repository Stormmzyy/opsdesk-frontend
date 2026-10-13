import { api } from './api.ts'
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
//
// The shared settings (the base URL, the cache, the kinds of tag) live in
// api.ts. This file "injects" the ticket endpoints into that one api, the
// same way projectsApi.ts adds the project endpoints.

// The arguments for updateTicket: which ticket, plus only the fields to
// change, e.g. { id: 3, status: 'RESOLVED' } or a whole edited form.
export type TicketUpdate = Pick<Ticket, 'id'> & Partial<Omit<Ticket, 'id'>>

// A cache "tag": a label saying what a piece of cached data contains.
// - { type: 'Ticket', id: 3 } means "this data includes ticket 3".
// - { type: 'Ticket', id: 'LIST' } means "this is THE list of tickets".
// Writing the type out lets TypeScript check every tag below.
type TicketTag = { type: 'Ticket'; id: number | 'LIST' }

const LIST_TAG: TicketTag = { type: 'Ticket', id: 'LIST' }

export const ticketsApi = api.injectEndpoints({
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

    // builder.mutation<void, number>: takes a ticket id, and returns nothing,
    // because the server answers 204 No Content.
    deleteTicket: builder.mutation<void, number>({
      query: (id) => ({ url: `/tickets/${id}`, method: 'DELETE' }),
      // Two tags, because deleting changes two kinds of cached data:
      // - LIST: the list no longer contains this ticket. (Its per-id tag
      //   would refetch the list too, but LIST says what we mean.)
      // - { type: 'Ticket', id }: any cached copy of THIS ticket is now wrong.
      //   RTK Query keeps getTicket(<id>) in its cache for a while after the
      //   page that used it closes. Without this tag, opening the old link
      //   again within that time would show the deleted ticket from the
      //   cache; with it, the next visit asks the server and gets a 404,
      //   so the page says "Ticket not found".
      invalidatesTags: (_result, _error, id) => [{ type: 'Ticket', id }, LIST_TAG],
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

// RTK Query generates a React hook for every endpoint, named after it:
// getTickets -> useGetTicketsQuery, deleteTicket -> useDeleteTicketMutation, etc.
export const {
  useGetTicketsQuery,
  useGetTicketQuery,
  useAddTicketMutation,
  useUpdateTicketMutation,
  useDeleteTicketMutation,
  useResetTicketsMutation,
} = ticketsApi
