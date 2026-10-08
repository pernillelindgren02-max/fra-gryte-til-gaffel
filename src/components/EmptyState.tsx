import { Link } from 'react-router-dom'
import './EmptyState.css'

type EmptyStateProps = {
  title?: string
  lead: string
  actionLabel: string
  /** When omitted, action renders as a button (use with onActionClick). */
  to?: string
  onActionClick?: () => void
  secondaryLabel?: string
  onSecondaryClick?: () => void
}

export function EmptyState({
  title,
  lead,
  actionLabel,
  to,
  onActionClick,
  secondaryLabel,
  onSecondaryClick,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      {title ? <h2 className="empty-state__title">{title}</h2> : null}
      <p className="empty-state__lead">{lead}</p>
      <div className="empty-state__actions">
        {to ? (
          <Link
            to={to}
            className="empty-state__action"
            onClick={onActionClick}
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            className="empty-state__action"
            onClick={onActionClick}
          >
            {actionLabel}
          </button>
        )}
        {secondaryLabel && onSecondaryClick ? (
          <button
            type="button"
            className="empty-state__secondary"
            onClick={onSecondaryClick}
          >
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}
