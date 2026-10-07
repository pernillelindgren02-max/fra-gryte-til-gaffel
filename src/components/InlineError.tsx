import { USER_ERRORS } from '../lib/userErrors'
import './InlineError.css'

type InlineErrorProps = {
  message?: string | null
  onRetry?: () => void
  retryLabel?: string
  compact?: boolean
}

export function InlineError({
  message,
  onRetry,
  retryLabel = USER_ERRORS.retry,
  compact = false,
}: InlineErrorProps) {
  const text = (message ?? USER_ERRORS.load).trim()
  if (!text) return null

  return (
    <div
      className={`inline-error${compact ? ' inline-error--compact' : ''}`}
      role="alert"
    >
      <p className="inline-error__text">{text}</p>
      {onRetry && (
        <button type="button" className="inline-error__retry" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  )
}
