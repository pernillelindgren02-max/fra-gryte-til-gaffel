import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchAllRecipesForAdmin,
  importLocalRecipes,
  setPublished,
  deleteRecipeRow,
} from '../../lib/adminRecipes'
import type { RecipeRow } from '../../lib/recipeMapper'
import { useRecipes } from '../../context/RecipesContext'
import './Admin.css'

export function AdminHomePage() {
  const { refresh: refreshPublished } = useRecipes()
  const [rows, setRows] = useState<RecipeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAllRecipesForAdmin()
      setRows(data)
      setMessage(null)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function onTogglePublish(row: RecipeRow) {
    setBusy(true)
    try {
      await setPublished(row.id, !row.is_published)
      await load()
      await refreshPublished()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(row: RecipeRow) {
    if (!window.confirm(`Slette «${row.name}» for godt?`)) return
    setBusy(true)
    try {
      await deleteRecipeRow(row.id)
      await load()
      await refreshPublished()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function onImport() {
    if (
      !window.confirm(
        'Importere de 15 lokale oppskriftene (og laste opp bilder)? Eksisterende rader med samme id oppdateres.',
      )
    ) {
      return
    }
    setBusy(true)
    try {
      const result = await importLocalRecipes()
      await load()
      await refreshPublished()
      setMessage(
        `Importert ${result.imported}. ${
          result.errors.length
            ? `Feil: ${result.errors.join(' · ')}`
            : 'OK.'
        }`,
      )
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <p className="admin__eyebrow">Privat</p>
          <h1 className="admin__title">Oppskriftsadmin</h1>
        </div>
        <div className="admin__header-actions">
          <Link to="/" className="admin__link">
            ← Til appen
          </Link>
          <button
            type="button"
            className="admin__btn admin__btn--ghost"
            onClick={() => void onImport()}
            disabled={busy}
          >
            Importer lokale
          </button>
          <Link to="/admin/recipes/new" className="admin__btn">
            Ny oppskrift
          </Link>
        </div>
      </header>

      {message && <p className="admin__message">{message}</p>}
      {loading ? (
        <p className="admin__muted">Laster…</p>
      ) : rows.length === 0 ? (
        <p className="admin__muted">
          Ingen oppskrifter i databasen ennå. Kjør SQL, og bruk «Importer
          lokale».
        </p>
      ) : (
        <ul className="admin-list">
          {rows.map((row) => (
            <li key={row.id} className="admin-list__item">
              <div className="admin-list__main">
                <Link
                  to={`/admin/recipes/${row.id}`}
                  className="admin-list__name"
                >
                  {row.name}
                </Link>
                <p className="admin-list__meta">
                  {row.id} · {row.time_minutes} min ·{' '}
                  {row.is_published ? 'Publisert' : 'Utkast'}
                </p>
              </div>
              <div className="admin-list__actions">
                <button
                  type="button"
                  className="admin__btn admin__btn--ghost"
                  disabled={busy}
                  onClick={() => void onTogglePublish(row)}
                >
                  {row.is_published ? 'Avpubliser' : 'Publiser'}
                </button>
                <Link
                  to={`/admin/recipes/${row.id}`}
                  className="admin__btn admin__btn--ghost"
                >
                  Rediger
                </Link>
                <button
                  type="button"
                  className="admin__btn admin__btn--danger"
                  disabled={busy}
                  onClick={() => void onDelete(row)}
                >
                  Slett
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
