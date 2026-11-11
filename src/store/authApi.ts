import { api } from './api.ts'
import type { User } from '../features/users/types.ts'

// The three auth endpoints (API_CONTRACT.md, "Auth"), added to the one shared
// api like every other feature's.

export interface LoginRequest {
  email: string
  password: string
}

// The login response also carries the user, but the app doesn't read it:
// the user always comes from GET /auth/me (see authSlice.ts for why).
export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterRequest {
  name: string
  username: string
  email: string
  password: string
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Mutations, not queries, even though login creates nothing on the
    // server: a query is cached and can be re-sent on its own (on refocus, on
    // a tag invalidation), and a password must only ever be sent when the
    // person presses the button.
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: builder.mutation<User, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    // Who the token belongs to, as the server sees them right now.
    // authSlice copies every successful answer into state.auth.user.
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
    }),
  }),
})

export const { useLoginMutation, useRegisterMutation, useGetMeQuery } = authApi
