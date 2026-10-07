import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllRecipesForAdmin } from '../../lib/adminRecipes'
import type { RecipeRow } from '../../lib/recipeMapper'
import './Admin.css'

export function AdminOverviewPage() {
  const [rows, setRows] = useState<RecipeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const data = await fetchAllRecipesForAdmin()
        if (active) {
          setRows(data)
          setError(null)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : String(err))
          setRows([])
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const published = rows.filter((r) => r.is_published).length
  const drafts = rows.length - published
  const recent = rows.slice(0, 8)

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <p className="admin__eyebrow">Oversikt</p>
          <h1 className="admin__title">Kontrollsenter</h1>
        </div>
        <Link to="/admin/oppskrifter/new" className="admin__btn">
          Ny oppskrift
        </Link>
      </header>

      {error && <p className="admin__message">{error}</p>}
      {loading ? (
        <p className="admin__muted">Laster…</p>
      ) : (
        <>
          <div className="admin-stats">
            <div className="admin-stat">
              <p className="admin-stat__value">{rows.length}</p>
              <p className="admin-stat__label">Oppskrifter</p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat__value">{published}</p>
              <p className="admin-stat__label">Publisert</p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat__value">{drafts}</p>
              <p className="admin-stat__label">Utkast</p>
            </div>
          </div>

          <section>
            <h2 className="admin__section-title">Sist endret</h2>
            {recent.length === 0 ? (
              <p className="admin__muted">
                Ingen oppskrifter ennå. Gå til Oppskrifter → Importer lokale.
              </p>
            ) : (
              <ul className="admin-list">
                {recent.map((row) => (
                  <li key={row.id} className="admin-list__item">
                    <div className="admin-list__main">
                      <Link
                        to={`/admin/oppskrifter/${row.id}`}
                        className="admin-list__name"
                      >
                        {row.name}
                      </Link>
                      <p className="admin-list__meta">
                        {row.is_published ? 'Publisert' : 'Utkast'} ·{' '}
                        {row.updated_at
                          ? new Date(row.updated_at).toLocaleString('nb-NO')
                          : '—'}
                      </p>
                    </div>
                    <Link
                      to={`/admin/oppskrifter/${row.id}`}
                      className="admin__btn admin__btn--ghost"
                    >
                      Rediger
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
