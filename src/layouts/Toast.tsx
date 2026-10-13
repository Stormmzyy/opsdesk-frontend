import { useEffect, useRef, useState } from 'react'
import type { FocusEvent } from 'react'
import { useAppDispatch } from '../store/hooks.ts'
import { dismissNotification } from '../store/uiSlice.ts'
import type { Notification, NotificationType } from '../store/uiSlice.ts'

// How long a success or info toast stays before it dismisses itself.
// Six seconds is enough to read a one-line message. Error toasts never
// dismiss themselves (see below).
export const AUTO_DISMISS_MS = 6000

// The visible word in front of each message, so the type isn't shown by
// colour alone (some people can't tell the colours apart).
const TYPE_LABELS: Record<NotificationType, string> = {
  success: 'Success',
  error: 'Error',
  info: 'Info',
}

interface ToastProps {
  notification: Notification
  // Also passes the Dismiss button that was pressed, so focus can be moved
  // somewhere sensible before that button disappears.
  onDismiss: (id: string, button: HTMLButtonElement) => void
}

// One notification, shown as a toast.
function Toast({ notification, onDismiss }: ToastProps) {
  const dispatch = useAppDispatch()
  const messageId = `notification-${notification.id}`

  // Errors stay until someone dismisses them: they're the messages people
  // most need time to read, and act on.
  const autoDismisses = notification.type !== 'error'

  // The timer pauses while the pointer is over the toast or focus is inside
  // it, so it can't vanish while someone is reading it or about to press
  // Dismiss.
  const [isHovered, setIsHovered] = useState(false)
  const [hasFocus, setHasFocus] = useState(false)
  const isPaused = isHovered || hasFocus

  // How much time is left. A ref, not state: changing it shouldn't redraw
  // anything, and it must survive the pauses below.
  const remainingMs = useRef(AUTO_DISMISS_MS)

  // Starts the timer whenever the toast isn't paused.
  useEffect(() => {
    if (!autoDismisses || isPaused) {
      return
    }
    const startedAt = Date.now()
    const timerId = window.setTimeout(() => {
      dispatch(dismissNotification(notification.id))
    }, remainingMs.current)

    // The cleanup runs when the toast pauses AND when it disappears (for
    // example, dismissed by hand). Either way the timer is cancelled, so
    // nothing fires for a toast that's gone. On a pause, it also remembers
    // how much time was left, so resuming carries on from there instead of
    // starting the full six seconds again.
    return () => {
      window.clearTimeout(timerId)
      remainingMs.current -= Date.now() - startedAt
    }
  }, [autoDismisses, isPaused, dispatch, notification.id])

  // React's onBlur fires when focus leaves ANY element inside the toast,
  // including moving from one part of it to another. relatedTarget is where
  // focus is going: only resume if that's outside the toast. The instanceof
  // check is needed because relatedTarget could be any kind of EventTarget,
  // and contains() only accepts page elements (Nodes).
  function handleBlur(event: FocusEvent<HTMLLIElement>) {
    const nextFocused = event.relatedTarget
    if (!(nextFocused instanceof Node) || !event.currentTarget.contains(nextFocused)) {
      setHasFocus(false)
    }
  }

  return (
    <li
      className={`notification notification--${notification.type}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setHasFocus(true)}
      onBlur={handleBlur}
    >
      <p id={messageId} className="notification__message">
        <strong>{TYPE_LABELS[notification.type]}:</strong> {notification.message}
      </p>
      {/* aria-describedby reads the message after "Dismiss" when the
          button is focused, so it's clear which one it dismisses. */}
      <button
        type="button"
        className="notification__dismiss"
        aria-describedby={messageId}
        onClick={(event) => onDismiss(notification.id, event.currentTarget)}
      >
        Dismiss
      </button>
    </li>
  )
}

export default Toast
