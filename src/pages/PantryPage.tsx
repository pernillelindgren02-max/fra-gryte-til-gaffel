import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { EmptyState } from '../components/EmptyState'
import { RecipeLink } from '../components/RecipeLink'
import { usePantry } from '../context/PantryContext'
import { useRecipes } from '../context/RecipesContext'
import { useSiteContent } from '../context/SiteContentContext'
import { trackEvent } from '../lib/analytics'
import {
  getKnownIngredientNames,
  matchRecipesByPantry,
} from '../utils/matchPantryRecipes'
import { suggestIngredients } from '../utils/suggestIngredients'
import './PantryPage.css'

export function PantryPage() {
  const { recipes } = useRecipes()
  const { getCopy } = useSiteContent()
  const { pantry, addItem, removeItem } = usePantry()
  const [draft, setDraft] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  const knownNames = useMemo(() => getKnownIngredientNames(recipes), [recipes])
  const suggestions = useMemo(
    () => suggestIngredients(knownNames, draft, pantry),
    [knownNames, draft, pantry],
  )
  const showSuggestions = suggestOpen
  const hasQuery = draft.trim().length > 0
  const noMatches = hasQuery && suggestions.length === 0

  const matches = useMemo(
    () => matchRecipesByPantry(pantry, recipes, 3),
    [pantry, recipes],
  )

  useEffect(() => {
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null
      if (wrapRef.current && target && !wrapRef.current.contains(target)) {
        setSuggestOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [])

  function commitName(raw: string) {
    const result = addItem(raw, knownNames)
    if (result === 'empty') return
    if (result === 'duplicate') {
      setMessage('Allerede i listen.')
      setDraft('')
      return
    }
    // Privacy: free-text names never sent. Known vocabulary → ingredient_key only.
    const knownHit = knownNames.find(
      (n) => n.trim().toLowerCase() === raw.trim().toLowerCase(),
    )
    trackEvent('pantry_item_add', {
      source: 'pantry',
      properties: {
        via: knownHit ? 'known' : 'typed',
        ...(knownHit
          ? { ingredient_key: knownHit.trim().toLowerCase().slice(0, 40) }
          : {}),
      },
    })
    setDraft('')
    setMessage(null)
    setSuggestOpen(true)
    inputRef.current?.focus()
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    commitName(draft)
  }

  function onPickSuggestion(name: string, alreadySelected: boolean) {
    if (alreadySelected) {
      setMessage('Allerede i listen.')
      setDraft('')
      return
    }
    commitName(name)
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

      <div className="pantry__compose" ref={wrapRef}>
        <form className="pantry__form" onSubmit={onSubmit}>
          <label className="pantry__field">
            <span className="visually-hidden">Ingrediens</span>
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls={listboxId}
              aria-autocomplete="list"
              placeholder="F.eks. gulrot, egg, feta"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setSuggestOpen(true)
                setMessage(null)
              }}
              onFocus={() => setSuggestOpen(true)}
              autoComplete="off"
              enterKeyHint="done"
              inputMode="text"
            />
            {draft.length > 0 ? (
              <button
                type="button"
                className="pantry__clear"
                aria-label="Tøm felt"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setDraft('')
                  setSuggestOpen(true)
                  inputRef.current?.focus()
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            ) : null}
          </label>
          <button type="submit" className="pantry__add">
            Legg til
          </button>
        </form>

        {showSuggestions ? (
          <div className="pantry__suggest" id={listboxId} role="listbox">
            {noMatches ? (
              <p className="pantry__suggest-empty" role="status">
                Ingen ingredienser funnet
              </p>
            ) : (
              <ul className="pantry__suggest-list">
                {suggestions.map(({ name, selected }) => (
                  <li key={name} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      className={`pantry__suggest-item${selected ? ' pantry__suggest-item--selected' : ''}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => onPickSuggestion(name, selected)}
                      disabled={selected}
                      aria-label={
                        selected
                          ? `${name} (allerede valgt)`
                          : `Legg til ${name}`
                      }
                    >
                      <span>{name}</span>
                      {selected ? (
                        <span className="pantry__suggest-mark">Valgt</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

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
                  onClick={() => {
                    removeItem(item)
                    trackEvent('pantry_item_remove', { source: 'pantry' })
                  }}
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
                      <span className="nav-chevron" aria-hidden="true">
                        ›
                      </span>
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
                  entrySource="pantry"
                  onClick={() =>
                    trackEvent('pantry_match_open', {
                      recipeId: recipe.id,
                      source: 'pantry',
                      properties: {
                        match_count: matchCount,
                        missing_count: missing.length,
                      },
                    })
                  }
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
