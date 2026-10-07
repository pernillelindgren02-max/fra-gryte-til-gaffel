import { useEffect, useState } from 'react'
import { fetchAdminUsers, type AdminUserRow } from '../../lib/siteContentApi'
import './Admin.css'

function maskEmail(email: string | null): string {
  if (!email) return '—'
  const [user, domain] = email.split('@')
  if (!domain) return email
  const shown = user.slice(0, 2)
  return `${shown}…@${domain}`
}

export function AdminUsersPage() {
  const [rows, setRows] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFull, setShowFull] = useState(false)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const data = await fetchAdminUsers()
        if (active) {
          setRows(data)
          setError(null)
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <p className="admin__eyebrow">Brukere</p>
          <h1 className="admin__title">Kontooversikt</h1>
          <p className="admin__muted">
            Kun e-post og opprettet-dato. Ingen favoritter, mapper eller
            notater. Admin-flagg settes kun via SQL (ingen selvpromotering).
          </p>
        </div>
        <label className="admin-form__check">
          <input
            type="checkbox"
            checked={showFull}
            onChange={(e) => setShowFull(e.target.checked)}
          />
          Vis full e-post
        </label>
      </header>

      {error && <p className="admin__message">{error}</p>}
      {loading ? (
        <p className="admin__muted">Laster…</p>
      ) : rows.length === 0 ? (
        <p className="admin__muted">Ingen brukere funnet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>E-post</th>
              <th>Opprettet</th>
              <th>Admin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  {showFull ? row.email ?? '—' : maskEmail(row.email)}
                </td>
                <td>
                  {row.created_at
                    ? new Date(row.created_at).toLocaleString('nb-NO')
                    : '—'}
                </td>
                <td>{row.is_admin ? 'Ja' : 'Nei'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
