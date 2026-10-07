import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  fetchAdminRecipe,
  setPublished,
  supabasePublicUrl,
} from '../../lib/adminRecipes'
import { mapRowToRecipe } from '../../lib/recipeMapper'
import type { Recipe } from '../../data/recipes'
import { useRecipes } from '../../context/RecipesContext'
import './Admin.css'

export function AdminRecipePreviewPage() {
  const { id } = useParams<{ id: string }>()
  const { refresh } = useRecipes()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [published, setPublishedFlag] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    void (async () => {
      try {
        const row = await fetchAdminRecipe(id)
        if (!active) return
        if (!row) {
          setMessage('Fant ikke oppskriften.')
          setLoading(false)
          return
        }
        setRecipe(mapRowToRecipe(row, supabasePublicUrl()))
        setPublishedFlag(row.is_published)
      } catch (err) {
        if (active) setMessage(err instanceof Error ? err.message : String(err))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  async function onPublish() {
    if (!id || !recipe) return
    if (
      !window.confirm(
        `Publisere «${recipe.name}»? Den blir synlig for vanlige brukere.`,
      )
    ) {
      return
    }
    setBusy(true)
    try {
      await setPublished(id, true)
      setPublishedFlag(true)
      await refresh()
      setMessage('Publisert.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="admin">
        <p className="admin__muted">Laster forhåndsvisning…</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="admin">
        <p className="admin__message">{message ?? 'Ikke funnet.'}</p>
        <Link to="/admin/oppskrifter" className="admin__link">
          ← Tilbake
        </Link>
      </div>
    )
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <Link to={`/admin/oppskrifter/${id}`} className="admin__link">
            ← Rediger
          </Link>
          <h1 className="admin__title">Forhåndsvisning</h1>
          <p className="admin__muted">
            {published
              ? 'Status: publisert (synlig i appen).'
              : 'Status: utkast — ikke synlig for vanlige brukere.'}
          </p>
        </div>
        <div className="admin__header-actions">
          {!published && (
            <button
              type="button"
              className="admin__btn"
              disabled={busy}
              onClick={() => void onPublish()}
            >
              Publiser nå
            </button>
          )}
          <Link
            to={`/oppskrift/${recipe.id}`}
            className="admin__btn admin__btn--ghost"
            target="_blank"
            rel="noreferrer"
          >
            Åpne i app
            {published ? '' : ' (kun hvis publisert)'}
          </Link>
        </div>
      </header>

      {message && <p className="admin__message">{message}</p>}

      <article className="admin-preview">
        <img
          className="admin-preview__image"
          src={recipe.image}
          alt=""
        />
        <h2 className="admin-preview__name">{recipe.name}</h2>
        <p className="admin-preview__meta">
          {recipe.timeMinutes} min · {recipe.servings} porsjoner ·{' '}
          {recipe.mealType}
        </p>
        <p>{recipe.shortDescription}</p>
        <h3>Ingredienser</h3>
        <ul>
          {recipe.ingredients.map((ing, i) => (
            <li key={i}>
              {ing.quantity != null ? `${ing.quantity} ` : ''}
              {ing.unit ? `${ing.unit} ` : ''}
              {ing.name}
            </li>
          ))}
        </ul>
        <h3>Steg</h3>
        <ol>
          {recipe.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        {recipe.practicalTags.length > 0 && (
          <p className="admin__muted">
            Tagger: {recipe.practicalTags.join(' · ')}
          </p>
        )}
      </article>
    </div>
  )
}
