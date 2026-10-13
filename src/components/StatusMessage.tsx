import type { ReactNode } from 'react'
import './StatusMessage.css'

type StatusMessageType = 'loading' | 'empty' | 'error'

// Tells screen readers how to announce each type of message:
// 'status' is read out politely, 'alert' is read out straight away.
const ROLES: Record<StatusMessageType, 'status' | 'alert' | undefined> = {
  loading: 'status',
  empty: undefined,
  error: 'alert',
}

// A dashed box for loading, empty, and error messages.
// - type: 'loading' | 'empty' | 'error'
// - onRetry (optional): shows a Retry button that calls it
// - action (optional): a way out, e.g. a "Clear filters" button or a
//   "Create a ticket" link, so an empty state isn't a dead end
// - compact (optional): a smaller box, for tight spaces like board columns
interface StatusMessageProps {
  type: StatusMessageType
  children: ReactNode
  onRetry?: () => void
  action?: ReactNode
  compact?: boolean
}

function StatusMessage({ type, children, onRetry, action, compact = false }: StatusMessageProps) {
  const className = compact
    ? 'status-message status-message--compact'
    : 'status-message'

  return (
    <div className={className} role={ROLES[type]}>
      <p>{children}</p>
      {onRetry && (
        <button type="button" className="status-message__retry" onClick={onRetry}>
          Retry
        </button>
      )}
      {action}
    </div>
  )
}

export default StatusMessage
