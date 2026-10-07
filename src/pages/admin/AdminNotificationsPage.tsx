import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  adminListNotifications,
  adminSendNotification,
  type AdminNotificationRow,
} from '../../lib/notificationsApi'
import { fetchAllRecipesForAdmin } from '../../lib/adminRecipes'
import type { RecipeRow } from '../../lib/recipeMapper'
import './Admin.css'

export function AdminNotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const preselect = searchParams.get('recipe') ?? ''

  const [recipes, setRecipes] = useState<RecipeRow[]>([])
  const [history, setHistory] = useState<AdminNotificationRow[]>([])
  const [recipeId, setRecipeId] = useState(preselect)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [previewing, setPreviewing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const published = useMemo(
    () => recipes.filter((r) => r.is_published),
    [recipes],
  )

  const selected = published.find((r) => r.id === recipeId) ?? null

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const [rows, past] = await Promise.all([
          fetchAllRecipesForAdmin(),
          adminListNotifications().catch(() => [] as AdminNotificationRow[]),
        ])
        if (!active) return
        setRecipes(rows)
        setHistory(past)
        if (preselect) {
          const recipe = rows.find((r) => r.id === preselect && r.is_published)
          if (recipe) {
            setRecipeId(recipe.id)
            setTitle((t) => t || `Ny oppskrift: ${recipe.name}`)
            setBody(
              (b) =>
                b ||
                recipe.short_description ||
                `${recipe.name} er klar i Utforsk.`,
            )
          }
        }
      } catch (err) {
        if (active) {
          setMessage(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [preselect])

  function onPickRecipe(id: string) {
    setRecipeId(id)
    const recipe = published.find((r) => r.id === id)
    if (recipe) {
      setTitle(`Ny oppskrift: ${recipe.name}`)
      setBody(
        recipe.short_description || `${recipe.name} er klar i Utforsk.`,
      )
    }
    setPreviewing(false)
    if (id) setSearchParams({ recipe: id })
    else setSearchParams({})
  }

  async function onSend() {
    if (!title.trim()) {
      setMessage('Tittel er påkrevd.')
      return
    }
    if (
      !window.confirm(
        `Sende varslet til brukere som har varsler på?\n\n«${title.trim()}»`,
      )
    ) {
      return
    }
    setBusy(true)
    try {
      const result = await adminSendNotification({
        recipeId: recipeId || null,
        title: title.trim(),
        body: body.trim(),
      })
      const past = await adminListNotifications()
      setHistory(past)
      setMessage(
        `Sendt til ${result.recipient_count} bruker${result.recipient_count === 1 ? '' : 'e'} (kun i appen — ingen push ennå).`,
      )
      setPreviewing(false)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="admin">
        <p className="admin__muted">Laster…</p>
      </div>
    )
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <p className="admin__eyebrow">Varsler</p>
          <h1 className="admin__title">Send in-app-varsel</h1>
          <p className="admin__muted">
            Sendes bare når du trykker Send. Ingen auto-send ved publisering.
            Native push kommer senere via Edge Function + push_tokens.
          </p>
        </div>
      </header>

      {message && <p className="admin__message">{message}</p>}

      <div className="admin-form">
        <label className="admin-form__field">
          <span>Publisert oppskrift</span>
          <select
            value={recipeId}
            onChange={(e) => onPickRecipe(e.target.value)}
          >
            <option value="">— Velg —</option>
            {published.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field">
          <span>Tittel</span>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setPreviewing(false)
            }}
            placeholder="Ny oppskrift: …"
          />
        </label>

        <label className="admin-form__field">
          <span>Kort melding</span>
          <textarea
            rows={3}
            value={body}
            onChange={(e) => {
              setBody(e.target.value)
              setPreviewing(false)
            }}
            placeholder="Kort tekst brukerne ser i innboksen"
          />
        </label>

        <div className="admin-form__footer">
          <button
            type="button"
            className="admin__btn admin__btn--ghost"
            onClick={() => setPreviewing(true)}
            disabled={!title.trim()}
          >
            Forhåndsvis
          </button>
          <button
            type="button"
            className="admin__btn"
            disabled={busy || !title.trim() || !previewing}
            onClick={() => void onSend()}
          >
            {busy ? 'Sender…' : 'Send'}
          </button>
        </div>
        {!previewing && title.trim() && (
          <p className="admin__muted">
            Forhåndsvis før du kan sende (eksplisitt Send).
          </p>
        )}
      </div>

      {previewing && (
        <article className="admin-preview">
          <p className="admin__eyebrow">Forhåndsvisning</p>
          <h2 className="admin-preview__name">{title.trim()}</h2>
          <p>{body.trim() || '—'}</p>
          {selected && (
            <p className="admin-preview__meta">
              Lenke til oppskrift: {selected.name} ({selected.id})
            </p>
          )}
        </article>
      )}

      <section>
        <h2 className="admin__section-title">Tidligere sendinger</h2>
        {history.length === 0 ? (
          <p className="admin__muted">Ingen sendinger ennå.</p>
        ) : (
          <ul className="admin-list">
            {history.map((row) => (
              <li key={row.id} className="admin-list__item">
                <div className="admin-list__main">
                  <p className="admin-list__name">{row.title}</p>
                  <p className="admin-list__meta">
                    {new Date(row.sent_at).toLocaleString('nb-NO')} ·{' '}
                    {row.recipient_count} mottakere · {row.read_count} lest
                    {row.recipe_id ? ` · ${row.recipe_id}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
