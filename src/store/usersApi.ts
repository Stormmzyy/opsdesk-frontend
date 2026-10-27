import { api } from './api.ts'
import type { User } from '../features/users/types.ts'

// The user endpoint, added to the one shared api (see api.ts for why there's
// only one), like the ticket and project ones. Until this week the Users page
// fetched JSONPlaceholder with the useFetch hook; API_CONTRACT.md planned the
// move to GET /users and to RTK Query together, so the page now gets the same
// base URL, cache, and loading and error flags as every other page.

// A cache tag for users, like TicketTag in ticketsApi.ts.
type UserTag = { type: 'User'; id: number | 'LIST' }

const LIST_TAG: UserTag = { type: 'User', id: 'LIST' }

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      // Nothing changes users yet. The tags are here so registering a user
      // (POST /users, Week 8) only has to invalidate LIST_TAG to refresh the
      // directory.
      providesTags: (result) =>
        result
          ? [...result.map((user): UserTag => ({ type: 'User', id: user.id })), LIST_TAG]
          : [LIST_TAG],
    }),
  }),
})

export const { useGetUsersQuery } = usersApi
