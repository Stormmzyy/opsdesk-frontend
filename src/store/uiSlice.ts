import { createSlice, nanoid } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
// A type-only import, so it disappears when the code runs. That matters
// because store.ts imports this file too: two files importing real values
// from each other could load in the wrong order.
import type { RootState } from './store.ts'

// Shared UI state: things about how the app looks or behaves that components
// far apart in the tree need to know about. Server data (like tickets) never
// goes in here; see NOTES.md for why.

// The three kinds of notification. The type decides the colour, the label,
// and how urgently screen readers announce it.
export type NotificationType = 'success' | 'error' | 'info'

export interface Notification {
  id: string
  message: string
  type: NotificationType
}

// What a component passes in. The id is added for it in `prepare` below.
export interface NewNotification {
  message: string
  type: NotificationType
}

interface UiState {
  sidebarCollapsed: boolean
  notifications: Notification[]
}

const initialState: UiState = {
  sidebarCollapsed: false,
  notifications: [],
}

export const uiSlice = createSlice({
  // "ui" becomes the start of every action type, e.g. "ui/toggleSidebar",
  // and is the key this state lives under in the store (state.ui).
  name: 'ui',
  initialState,
  reducers: {
    // These LOOK like they change state directly, but they don't.
    // Redux Toolkit runs reducers through a library called Immer, which
    // records the "changes" on a draft copy and then builds a brand new state
    // object from them. The old state is never touched.
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },

    addNotification: {
      reducer(state, action: PayloadAction<Notification>) {
        state.notifications.push(action.payload)
      },
      // `prepare` runs BEFORE the action reaches the reducer, so the reducer
      // stays predictable: the same action always gives the same result.
      // Generating a random id inside the reducer would break that.
      // nanoid() comes with Redux Toolkit, so no extra package is needed.
      prepare(notification: NewNotification) {
        return { payload: { ...notification, id: nanoid() } }
      },
    },

    // The payload is the id of the notification to remove.
    dismissNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload,
      )
    },
  },
})

// createSlice generates one "action creator" per reducer above.
// dispatch(toggleSidebar()) sends { type: 'ui/toggleSidebar' } to the store.
export const { toggleSidebar, addNotification, dismissNotification } = uiSlice.actions

// Selectors: small functions that read one thing out of the whole state.
// Components use them with useAppSelector, so they don't need to know
// exactly where in the state each value lives.
export const selectSidebarCollapsed = (state: RootState) => state.ui.sidebarCollapsed
export const selectNotifications = (state: RootState) => state.ui.notifications

export default uiSlice.reducer
