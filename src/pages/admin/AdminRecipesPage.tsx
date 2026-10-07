import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteRecipeRow,
  duplicateRecipeRow,
  fetchAllRecipesForAdmin,
  importLocalRecipes,
  setPublished,
} from '../../lib/adminRecipes'
import type { RecipeRow } from '../../lib/recipeMapper'
import { useRecipes } from '../../context/RecipesContext'
import './Admin.css'

export function AdminRecipesPage() {
  const { refresh: refreshPublished } = useRecipes()
  const [rows, setRows] = useState<RecipeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

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

  const visible = rows.filter((row) => {
    if (filter === 'published') return row.is_published
    if (filter === 'draft') return !row.is_published
    return true
  })

  async function onTogglePublish(row: RecipeRow) {
    const next = !row.is_published
    if (
      next &&
      !window.confirm(
        `Publisere «${row.name}»? Den blir synlig for alle brukere.`,
      )
    ) {
      return
    }
    if (
      !next &&
      !window.confirm(`Avpublisere «${row.name}»? Den skjules for vanlige brukere.`)
    ) {
      return
    }
    setBusy(true)
    try {
      await setPublished(row.id, next)
      await load()
      await refreshPublished()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(row: RecipeRow) {
    if (
      !window.confirm(
        `Slette «${row.name}» for godt? Dette kan ikke angres.`,
      )
    ) {
      return
    }
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

  async function onDuplicate(row: RecipeRow) {
    setBusy(true)
    try {
      const id = await duplicateRecipeRow(row.id)
      await load()
      setMessage(`Duplisert som utkast: ${id}`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function onImport() {
    if (
      !window.confirm(
        'Importere de lokale oppskriftene (og laste opp bilder)? Eksisterende rader med samme id oppdateres.',
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
          <p className="admin__eyebrow">Oppskrifter</p>
          <h1 className="admin__title">Alle oppskrifter</h1>
        </div>
        <div className="admin__header-actions">
          <button
            type="button"
            className="admin__btn admin__btn--ghost"
            onClick={() => void onImport()}
            disabled={busy}
          >
            Importer lokale
          </button>
          <Link to="/admin/oppskrifter/new" className="admin__btn">
            Ny oppskrift
          </Link>
        </div>
      </header>

      <div className="admin-filter-tabs" role="tablist">
        {(
          [
            ['all', 'Alle'],
            ['published', 'Publisert'],
            ['draft', 'Utkast'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            className={
              filter === id
                ? 'admin-filter-tabs__btn admin-filter-tabs__btn--active'
                : 'admin-filter-tabs__btn'
            }
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {message && <p className="admin__message">{message}</p>}
      {loading ? (
        <p className="admin__muted">Laster…</p>
      ) : visible.length === 0 ? (
        <p className="admin__muted">
          Ingen oppskrifter her. Kjør SQL og bruk «Importer lokale» om
          databasen er tom.
        </p>
      ) : (
        <ul className="admin-list">
          {visible.map((row) => (
            <li key={row.id} className="admin-list__item">
              <div className="admin-list__main">
                <Link
                  to={`/admin/oppskrifter/${row.id}`}
                  className="admin-list__name"
                >
                  {row.name}
                </Link>
                <p className="admin-list__meta">
                  {row.id} · {row.time_minutes} min ·{' '}
                  {row.servings ?? 2} pors. ·{' '}
                  {row.is_published ? 'Publisert' : 'Utkast'}
                </p>
              </div>
              <div className="admin-list__actions">
                <Link
                  to={`/admin/oppskrifter/${row.id}/forhandsvis`}
                  className="admin__btn admin__btn--ghost"
                >
                  Forhåndsvis
                </Link>
                <button
                  type="button"
                  className="admin__btn admin__btn--ghost"
                  disabled={busy}
                  onClick={() => void onTogglePublish(row)}
                >
                  {row.is_published ? 'Avpubliser' : 'Publiser'}
                </button>
                <button
                  type="button"
                  className="admin__btn admin__btn--ghost"
                  disabled={busy}
                  onClick={() => void onDuplicate(row)}
                >
                  Dupliser
                </button>
                <Link
                  to={`/admin/oppskrifter/${row.id}`}
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
