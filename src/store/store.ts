import { configureStore } from '@reduxjs/toolkit'
import { ticketsApi } from './ticketsApi.ts'
import uiReducer from './uiSlice.ts'

// Builds a new Redux store. It's a function, not just one store, so each test
// can start from a fresh, empty store instead of sharing one between tests.
// configureStore also sets up the Redux DevTools and some safety checks
// (for example, it warns if state is changed outside a reducer).
export function makeStore() {
  return configureStore({
    reducer: {
      // Everything from uiSlice lives under state.ui.
      ui: uiReducer,
      // RTK Query's cache of server data lives under state.ticketsApi.
      // [ticketsApi.reducerPath] uses the name set in ticketsApi.ts, so the
      // two can't get out of step.
      [ticketsApi.reducerPath]: ticketsApi.reducer,
    },
    // Middleware runs on every dispatched action. RTK Query's middleware does
    // the actual work: sending requests, refetching when tags are
    // invalidated, and removing cached data nobody has used for a while.
    // concat() adds it after Redux Toolkit's default middleware.
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(ticketsApi.middleware),
  })
}

// The one store the running app uses.
export const store = makeStore()

// Types worked out from the store itself, so they update automatically when
// a new slice is added. Nothing here is written out by hand.
export type AppStore = ReturnType<typeof makeStore>
// The shape of the whole state, e.g. { ui: {...}, ticketsApi: {...} }.
export type RootState = ReturnType<AppStore['getState']>
// The store's dispatch function, which knows every action it accepts.
export type AppDispatch = AppStore['dispatch']
