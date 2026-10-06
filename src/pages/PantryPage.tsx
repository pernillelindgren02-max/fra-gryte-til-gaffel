import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  getKnownIngredientNames,
  matchRecipesByPantry,
  normalizeIngredientName,
} from '../utils/matchPantryRecipes'
import './PantryPage.css'

export function PantryPage() {
  const [draft, setDraft] = useState('')
  const [pantry, setPantry] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const knownNames = useMemo(() => getKnownIngredientNames(), [])

  const matches = useMemo(
    () => matchRecipesByPantry(pantry, 3),
    [pantry],
  )

  function addIngredient(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) return
    const key = normalizeIngredientName(trimmed)
    const known = knownNames.find(
      (name) => normalizeIngredientName(name) === key,
    )
    const label = known ?? trimmed
    if (pantry.some((item) => normalizeIngredientName(item) === key)) {
      setMessage('Allerede i listen.')
      return
    }
    setPantry((prev) => [...prev, label])
    setDraft('')
    setMessage(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    addIngredient(draft)
  }

  function removeItem(name: string) {
    setPantry((prev) =>
      prev.filter(
        (item) =>
          normalizeIngredientName(item) !== normalizeIngredientName(name),
      ),
    )
  }

  return (
    <div className="pantry">
      <header className="pantry__header">
        <h1 className="pantry__title">En gryte unna noe godt</h1>
        <p className="pantry__lead">
          Skriv inn hva du har i kjøleskapet eller skapet. Vi foreslår
          oppskrifter som matcher ingrediensnavnene direkte.
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
          <p className="pantry__empty">Ingen ingredienser ennå.</p>
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
            Legg til minst én ingrediens for å se forslag.
          </p>
        ) : matches.length === 0 ? (
          <p className="pantry__empty">
            Ingen oppskrifter matcher disse navnene nøyaktig. Prøv samme
            skrivemåte som i oppskriftene (f.eks. «gulrot», «gul løk»).
          </p>
        ) : (
          <ul className="pantry__results">
            {matches.map(({ recipe, matchCount, have, missing }) => (
              <li key={recipe.id} className="pantry-card">
                <div className="pantry-card__top">
                  <h3 className="pantry-card__title">{recipe.name}</h3>
                  <p className="pantry-card__count">
                    {matchCount} treff
                  </p>
                </div>
                <p className="pantry-card__label">Du har</p>
                <p className="pantry-card__list">{have.join(', ')}</p>
                <p className="pantry-card__label">Mangler</p>
                <p className="pantry-card__list">
                  {missing.length > 0 ? missing.join(', ') : 'Ingenting'}
                </p>
                <Link
                  to={`/oppskrift/${recipe.id}`}
                  className="pantry-card__link"
                >
                  Åpne oppskrift
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
