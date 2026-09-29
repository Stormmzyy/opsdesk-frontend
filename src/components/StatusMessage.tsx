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
// - compact (optional): a smaller box, for tight spaces like board columns
interface StatusMessageProps {
  type: StatusMessageType
  children: ReactNode
  onRetry?: () => void
  compact?: boolean
}

function StatusMessage({ type, children, onRetry, compact = false }: StatusMessageProps) {
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
    </div>
  )
}

export default StatusMessage
