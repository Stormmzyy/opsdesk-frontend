import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { api } from './api.ts'
import { sessionExpired } from './authActions.ts'
import authReducer, { signedOut, tokenReceived } from './authSlice.ts'
import type { AuthState } from './authSlice.ts'
import uiReducer from './uiSlice.ts'
import { clearStoredToken, storeToken } from '../features/auth/tokenStorage.ts'

// Builds a new Redux store. It's a function, not just one store, so each test
// can start from a fresh, empty store instead of sharing one between tests.
// configureStore also sets up the Redux DevTools and some safety checks
// (for example, it warns if state is changed outside a reducer).
//
// startingAuth is for tests: a test that renders the signed-in pages starts
// with a token and a user already in place (renderWithProviders' signedInAs),
// instead of logging in through the mock first. The running app passes
// nothing, and the auth slice reads localStorage as usual.
export function makeStore(startingAuth?: AuthState) {
  // Keeps localStorage's copy of the token in step with the store. Reducers
  // can't do it (they must have no side effects, see authSlice.ts), so this
  // listener runs after the reducer, whenever one of the two actions passes
  // through. One per store, so a test's store never writes on behalf of
  // another's.
  const authStorage = createListenerMiddleware()
  authStorage.startListening({
    actionCreator: tokenReceived,
    effect: (action) => storeToken(action.payload),
  })
  // A session ends in one of two ways, and both clean up the same way:
  // - the token leaves localStorage, so a refresh doesn't bring it back;
  // - RTK Query's cache is emptied. It holds the last person's tickets,
  //   users and projects. Without this, the next person to sign in on the
  //   same tab would see the previous person's data on every page until
  //   each page refetched: an AGENT signing in after an ADMIN would briefly
  //   see tickets the server would never send them.
  authStorage.startListening({
    matcher: isAnyOf(signedOut, sessionExpired),
    effect: (_action, listenerApi) => {
      clearStoredToken()
      listenerApi.dispatch(api.util.resetApiState())
    },
  })

  return configureStore({
    reducer: {
      // Who is signed in: the token and the user (authSlice.ts).
      auth: authReducer,
      // Everything from uiSlice lives under state.ui.
      ui: uiReducer,
      // RTK Query's cache of server data (tickets AND projects) lives under
      // state.api. [api.reducerPath] uses the name set in api.ts, so the two
      // can't get out of step.
      [api.reducerPath]: api.reducer,
    },
    preloadedState: startingAuth ? { auth: startingAuth } : undefined,
    // Middleware runs on every dispatched action. RTK Query's middleware does
    // the actual work: sending requests, refetching when tags are
    // invalidated, and removing cached data nobody has used for a while.
    // concat() adds it after Redux Toolkit's default middleware.
    //
    // The listener goes first (prepend), as Redux Toolkit's docs recommend,
    // so it sees every action before anything else can act on it.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(authStorage.middleware).concat(api.middleware),
  })
}

// The one store the running app uses.
export const store = makeStore()

// Types worked out from the store itself, so they update automatically when
// a new slice is added. Nothing here is written out by hand.
export type AppStore = ReturnType<typeof makeStore>
// The shape of the whole state, e.g. { auth: {...}, ui: {...}, api: {...} }.
export type RootState = ReturnType<AppStore['getState']>
// The store's dispatch function, which knows every action it accepts.
export type AppDispatch = AppStore['dispatch']
