import { configureStore } from '@reduxjs/toolkit'
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
    },
  })
}

// The one store the running app uses.
export const store = makeStore()

// Types worked out from the store itself, so they update automatically when
// a new slice is added. Nothing here is written out by hand.
export type AppStore = ReturnType<typeof makeStore>
// The shape of the whole state, e.g. { ui: { sidebarCollapsed, notifications } }.
export type RootState = ReturnType<AppStore['getState']>
// The store's dispatch function, which knows every action it accepts.
export type AppDispatch = AppStore['dispatch']
