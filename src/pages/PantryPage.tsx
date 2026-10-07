import { useMemo, useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import { RecipeLink } from '../components/RecipeLink'
import { usePantry } from '../context/PantryContext'
import { useRecipes } from '../context/RecipesContext'
import { useSiteContent } from '../context/SiteContentContext'
import {
  getKnownIngredientNames,
  matchRecipesByPantry,
} from '../utils/matchPantryRecipes'
import './PantryPage.css'

export function PantryPage() {
  const { recipes } = useRecipes()
  const { getCopy } = useSiteContent()
  const { pantry, addItem, removeItem } = usePantry()
  const [draft, setDraft] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const knownNames = useMemo(() => getKnownIngredientNames(recipes), [recipes])

  const matches = useMemo(
    () => matchRecipesByPantry(pantry, recipes, 3),
    [pantry, recipes],
  )

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const result = addItem(draft, knownNames)
    if (result === 'empty') return
    if (result === 'duplicate') {
      setMessage('Allerede i listen.')
      return
    }
    setDraft('')
    setMessage(null)
  }

  return (
    <div className="pantry">
      <header className="pantry__header">
        <h1 className="pantry__title">Hva har du hjemme?</h1>
        <p className="pantry__lead">
          Skriv inn ingredienser du har. Vi foreslår oppskrifter som matcher
          navnene direkte fra oppskriftslisten.
        </p>
      </header>

      <form className="pantry__form" onSubmit={onSubmit}>
        <label className="pantry__field">
          <span className="visually-hidden">Ingrediens</span>
          <input
            type="text"
            list="pantry-known-ingredients"
            placeholder="F.eks. gulrot, egg, feta"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoComplete="off"
          />
        </label>
        <datalist id="pantry-known-ingredients">
          {knownNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <button type="submit" className="pantry__add">
          Legg til
        </button>
      </form>

      {message && <p className="pantry__message">{message}</p>}

      <section className="pantry__block">
        <h2 className="pantry__subtitle">Dine ingredienser</h2>
        {pantry.length === 0 ? (
          <EmptyState
            lead={getCopy(
              'hjemme.empty',
              'Ingen ingredienser ennå. Skriv inn noe du har hjemme — for eksempel egg eller gulrot — og trykk Legg til.',
            )}
            actionLabel="Utforsk oppskrifter"
            to="/"
          />
        ) : (
          <ul className="pantry__chips">
            {pantry.map((item) => (
              <li key={item}>
                <span>{item}</span>
                <button
                  type="button"
                  aria-label={`Fjern ${item}`}
                  onClick={() => removeItem(item)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="pantry__block">
        <h2 className="pantry__subtitle">Forslag</h2>
        {pantry.length === 0 ? (
          <p className="pantry__empty">
            Når du har lagt til ingredienser, foreslår vi oppskrifter her.
          </p>
        ) : matches.length === 0 ? (
          <EmptyState
            lead="Ingen oppskrifter matcher disse navnene nøyaktig. Prøv samme skrivemåte som i oppskriftene."
            actionLabel="Utforsk alle oppskrifter"
            to="/"
          />
        ) : (
          <ul className="pantry__results">
            {matches.map(({ recipe, matchCount, have, missing }) => (
              <li key={recipe.id} className="pantry-card">
                <div className="pantry-card__top">
                  <h3 className="pantry-card__title">
                    <RecipeLink
                      recipeId={recipe.id}
                      className="pantry-card__title-link"
                    >
                      {recipe.name}
                    </RecipeLink>
                  </h3>
                  <p className="pantry-card__count">{matchCount} treff</p>
                </div>
                <p className="pantry-card__label">Du har</p>
                <p className="pantry-card__list">{have.join(', ')}</p>
                <p className="pantry-card__label">Mangler</p>
                <p className="pantry-card__list">
                  {missing.length > 0 ? missing.join(', ') : 'Ingenting'}
                </p>
                <RecipeLink
                  recipeId={recipe.id}
                  className="pantry-card__link"
                >
                  Åpne oppskrift
                </RecipeLink>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
