import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { sessionExpired } from './authActions.ts'
import { authApi } from './authApi.ts'
import { readStoredToken } from '../features/auth/tokenStorage.ts'
import type { User } from '../features/users/types.ts'
// Type-only, so it disappears at runtime; store.ts imports this file.
import type { RootState } from './store.ts'

// Who is signed in: the token every request sends, and the user it belongs to.
//
// The two arrive separately, and there's a moment with a token but no user
// yet: just after login, and on every page load with a stored token, while
// GET /auth/me is on its way. ProtectedRoute covers that moment.
export interface AuthState {
  token: string | null
  user: User | null
  // Why there's no token, when there was one: the person logged out, or the
  // server stopped accepting it. The login page says which. null when
  // nobody has signed in yet in this tab.
  signOutReason: SignOutReason | null
}

export type SignOutReason = 'signed-out' | 'expired'

export const authSlice = createSlice({
  name: 'auth',
  // A function, not an object: Redux Toolkit calls it each time a store is
  // created, so every store (one per test) reads localStorage afresh. An
  // object here would be built once, when this file is first imported, and
  // every later store would share whatever the token was at that moment.
  //
  // Only the token is restored. The user is never stored: it's always
  // fetched again (ProtectedRoute), so a stale copy can't outlive a role change.
  initialState: (): AuthState => ({ token: readStoredToken(), user: null, signOutReason: null }),
  reducers: {
    // These only change the state. The side effects (localStorage, clearing
    // RTK Query's cache) are in store.ts, in a listener that reacts to these
    // actions: a reducer must not have any, so that the same action always
    // gives the same state.
    tokenReceived(state, action: PayloadAction<string>) {
      state.token = action.payload
      state.user = null
      state.signOutReason = null
    },
    // The Log out button.
    signedOut(state) {
      state.token = null
      state.user = null
      state.signOutReason = 'signed-out'
    },
  },
  extraReducers: (builder) => {
    // A 401 on a request that carried the current token (api.ts).
    builder.addCase(sessionExpired, (state) => {
      state.token = null
      state.user = null
      state.signOutReason = 'expired'
    })

    // The ONLY way a user gets into this state: a successful GET /auth/me,
    // whether the login page asked for it or ProtectedRoute did on start-up.
    //
    // The role in particular is never decoded from the token, even though
    // the token carries a role claim. The server doesn't trust that claim:
    // it loads the user from the database on every request and uses the
    // role stored there (opsdesk-backend NOTES.md, decision 28), so a role
    // changed by an administrator applies at once, with the old token. A
    // client that decoded the claim would be trusting something the server
    // itself doesn't, and would show the old role until the token expired.
    // That's why the backend puts `role` on the user response (decision 59).
    //
    // Why /auth/me even straight after login, when the login response has a
    // `user` in it too: so the client depends on ONE response shape for the
    // user, not two. Start-up has only a token, so /auth/me is needed anyway.
    // If login also fed the slice, the two shapes would have to stay
    // identical forever. Suppose the login response's user were ever trimmed,
    // say `role` dropped because "the client has /auth/me for that": a client
    // reading it would quietly lose the role on every fresh login, while
    // every page refresh (through /auth/me) still worked. That's the kind of
    // break nobody notices until someone asks why their buttons vanish only
    // after signing in. One extra request per login is the price.
    builder.addMatcher(authApi.endpoints.getMe.matchFulfilled, (state, action) => {
      state.user = action.payload
    })
  },
})

export const { tokenReceived, signedOut } = authSlice.actions

export const selectToken = (state: RootState) => state.auth.token
export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectSignOutReason = (state: RootState) => state.auth.signOutReason

export default authSlice.reducer
