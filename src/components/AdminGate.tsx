import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * Never renders admin UI for non-admins.
 * No consumer nav links — route is typed in manually.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const { configured, loading, user, isAdmin, adminChecked } = useAuth()

  if (!configured) {
    return <Navigate to="/" replace />
  }

  if (loading || !adminChecked) {
    return (
      <div className="admin-gate">
        <p>Sjekker tilgang…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/konto" replace state={{ from: '/admin' }} />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
