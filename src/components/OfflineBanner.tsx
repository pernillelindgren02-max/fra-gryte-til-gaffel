import { USER_ERRORS } from '../lib/userErrors'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import './ErrorBoundary.css'

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <p className="offline-banner" role="status">
      {USER_ERRORS.network}
    </p>
  )
}
