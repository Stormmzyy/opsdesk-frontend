import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import { dismissNotification, selectNotifications } from '../store/uiSlice.ts'
import type { Notification } from '../store/uiSlice.ts'
import { focusMainHeading } from '../utils/focus.ts'
import Toast from './Toast.tsx'
import './Notifications.css'

// Extra room left between the toasts and whatever is just above them, so a
// focused button's focus ring isn't touching the toasts either.
const TOAST_CLEARANCE_PX = 8

interface NotificationListProps {
  notifications: Notification[]
  // Also passes the Dismiss button that was pressed, so focus can be moved
  // somewhere sensible before that button disappears.
  onDismiss: (id: string, button: HTMLButtonElement) => void
}

function NotificationList({ notifications, onDismiss }: NotificationListProps) {
  if (notifications.length === 0) {
    return null
  }

  // Each Toast runs its own auto-dismiss timer, so they come and go
  // independently of each other.
  return (
    <ul className="notifications__list">
      {notifications.map((notification) => (
        <Toast key={notification.id} notification={notification} onDismiss={onDismiss} />
      ))}
    </ul>
  )
}

// Shows every current notification as a toast, stacked in the bottom-right
// corner of every page (it's rendered by Layout). Success and info toasts
// dismiss themselves after a few seconds; errors stay until dismissed, so
// nobody misses one because it vanished before they finished reading it.
function Notifications() {
  const notifications = useAppSelector(selectNotifications)
  const dispatch = useAppDispatch()
  // The wrapper around both lists, used to find the other Dismiss buttons.
  const containerRef = useRef<HTMLDivElement>(null)

  // The toasts float over the bottom-right corner of the page. An error
  // toast stays until it's dismissed, so without this it could cover a
  // control (like the list's "Next page" button) for as long as it's there.
  //
  // So whenever the toast stack changes size, we measure how much of the
  // bottom of the screen it covers and store it in the --toast-space CSS
  // variable. Layout.css then uses it twice:
  // - as extra padding under the page, so everything can be scrolled up
  //   above the toasts, and
  // - as scroll-padding-bottom, so when keyboard focus moves to something
  //   near the bottom, the browser scrolls it to just above the toasts
  //   instead of leaving it underneath.
  // With no toasts, the stack is 0px tall and so is --toast-space.
  useEffect(() => {
    const container = containerRef.current
    // ResizeObserver tells us whenever an element changes size. Every
    // current browser has it, but the test environment (jsdom) doesn't;
    // there's no screen to cover there anyway.
    if (!container || typeof ResizeObserver === 'undefined') {
      return
    }
    const root = document.documentElement
    const observer = new ResizeObserver(() => {
      const box = container.getBoundingClientRect()
      // From the top of the stack down to the bottom of the screen, which
      // includes the gap the stack keeps from the screen's edge.
      const covered = box.height > 0 ? window.innerHeight - box.top + TOAST_CLEARANCE_PX : 0
      root.style.setProperty('--toast-space', `${Math.ceil(covered)}px`)
    })
    observer.observe(container)
    // Cleanup: stop watching, and give the page its normal spacing back.
    return () => {
      observer.disconnect()
      root.style.removeProperty('--toast-space')
    }
  }, [])

  // Removing a notification removes the focused Dismiss button with it, and
  // the browser would then drop keyboard focus back to the top of the page.
  // So first move focus to the next notification's Dismiss button (or the
  // previous one, if this was the last), or to the page heading when there
  // are no notifications left.
  function handleDismiss(id: string, button: HTMLButtonElement) {
    // The instanceof check (rather than telling TypeScript "trust me, these
    // are buttons") proves to TypeScript that each one really is a button.
    const buttons = Array.from(
      containerRef.current?.querySelectorAll('.notification__dismiss') ?? [],
    ).filter((element) => element instanceof HTMLButtonElement)
    const index = buttons.indexOf(button)
    const nextButton = buttons[index + 1] ?? buttons[index - 1]
    if (nextButton) {
      nextButton.focus()
    } else {
      focusMainHeading()
    }
    dispatch(dismissNotification(id))
  }

  // Errors go in an "alert" region, which screen readers announce straight
  // away. Success and info messages go in a "status" region, which is
  // announced politely, when the screen reader finishes what it's saying.
  const errors = notifications.filter((notification) => notification.type === 'error')
  const messages = notifications.filter((notification) => notification.type !== 'error')

  // Both regions are ALWAYS on the page, even when empty. Screen readers
  // only notice changes inside a live region that already existed, so adding
  // a brand new role="status" element along with its message can go unheard.
  //
  // Both roles normally re-read the WHOLE region whenever anything in it
  // changes. aria-atomic={false} makes screen readers read only the new
  // notification, not every older one again.
  return (
    <div className="notifications" ref={containerRef}>
      <div role="status" aria-atomic={false}>
        <NotificationList notifications={messages} onDismiss={handleDismiss} />
      </div>
      <div role="alert" aria-atomic={false}>
        <NotificationList notifications={errors} onDismiss={handleDismiss} />
      </div>
    </div>
  )
}

export default Notifications
