import { useMemo, useState } from 'react'
import {
  useShoppingList,
  type ShoppingMultiplier,
} from '../context/ShoppingListContext'
import { useRecipes } from '../context/RecipesContext'
import { useSiteContent } from '../context/SiteContentContext'
import { EmptyState } from '../components/EmptyState'
import { RecipeLink } from '../components/RecipeLink'
import { useToast } from '../context/ToastContext'
import { searchRecipes } from '../utils/searchRecipes'
import './ShoppingListPage.css'

const MULTIPLIERS: ShoppingMultiplier[] = [1, 2, 3, 4]

export function ShoppingListPage() {
  const {
    entries,
    combined,
    checkedKeys,
    addRecipe,
    removeRecipe,
    setMultiplier,
    clearAll,
    toggleChecked,
  } = useShoppingList()
  const { recipes, getById } = useRecipes()
  const { getCopy } = useSiteContent()
  const { showToast } = useToast()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchRecipes(recipes, query).slice(0, 8)
  }, [query, recipes])

  const listed = entries
    .map((entry) => {
      const recipe = getById(entry.recipeId)
      if (!recipe) return null
      return { recipe, multiplier: entry.multiplier }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  function onPick(recipeId: string) {
    const result = addRecipe(recipeId)
    if (result === 'added') {
      showToast('Oppskriften er lagt til i handlelisten.')
      setQuery('')
    } else if (result === 'duplicate') {
      showToast('Oppskriften er allerede i handlelisten.')
    }
  }

  function onRemoveRecipe(recipeId: string, name: string) {
    removeRecipe(recipeId)
    showToast(`Fjernet «${name}» fra handlelisten.`)
  }

  function onClearAll() {
    if (entries.length === 0) return
    if (!window.confirm('Tøm hele handlelisten?')) return
    clearAll()
    showToast('Handlelisten er tømt.')
  }

  function onSetMultiplier(recipeId: string, value: ShoppingMultiplier) {
    setMultiplier(recipeId, value)
    showToast(`Handleliste oppdatert (${value}x).`)
  }

  return (
    <div className="shopping">
      <header className="shopping__header">
        <h1 className="shopping__title">Handleliste</h1>
        <p className="shopping__lead">
          Legg til oppskrifter, juster antall porsjoner (1x–4x) og se samlede
          mengder.
        </p>
      </header>

      <label className="shopping__search">
        <span className="visually-hidden">Søk etter oppskrift</span>
        <input
          type="search"
          placeholder="Søk etter oppskrift"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          enterKeyHint="search"
        />
      </label>

      {results.length > 0 && (
        <ul className="shopping__suggest" role="listbox">
          {results.map((recipe) => (
            <li key={recipe.id}>
              <button type="button" onClick={() => onPick(recipe.id)}>
                {recipe.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {listed.length > 0 && (
        <section className="shopping__block">
          <div className="shopping__block-head">
            <h2 className="shopping__subtitle">Oppskrifter</h2>
            <button
              type="button"
              className="shopping__text-btn"
              onClick={onClearAll}
            >
              Tøm listen
            </button>
          </div>
          <ul className="shopping__recipes">
            {listed.map(({ recipe, multiplier }) => (
              <li key={recipe.id} className="shopping__recipe-card">
                <div className="shopping__recipe-row">
                  <RecipeLink recipeId={recipe.id}>{recipe.name}</RecipeLink>
                  <button
                    type="button"
                    className="shopping__text-btn"
                    onClick={() => onRemoveRecipe(recipe.id, recipe.name)}
                  >
                    Fjern
                  </button>
                </div>
                <div
                  className="shopping__multipliers"
                  role="group"
                  aria-label={`Antall for ${recipe.name}`}
                >
                  {MULTIPLIERS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`shopping__multiplier${multiplier === value ? ' shopping__multiplier--on' : ''}`}
                      aria-pressed={multiplier === value}
                      onClick={() => onSetMultiplier(recipe.id, value)}
                    >
                      {value}x
                    </button>
                  ))}
                  {!MULTIPLIERS.includes(
                    multiplier as (typeof MULTIPLIERS)[number],
                  ) && (
                    <span className="shopping__multiplier shopping__multiplier--on">
                      {Number.isInteger(multiplier)
                        ? `${multiplier}x`
                        : `${String(multiplier).replace('.', ',')}x`}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="shopping__block">
        <h2 className="shopping__subtitle">Ingredienser</h2>
        {combined.length === 0 ? (
          <EmptyState
            lead={getCopy(
              'handleliste.empty',
              'Handlelisten er tom. Finn en oppskrift du vil lage, og legg den til herfra.',
            )}
            actionLabel="Finn en oppskrift"
            to="/"
          />
        ) : (
          <ul className="shopping__items">
            {combined.map((item) => {
              const checked = checkedKeys.has(item.key)
              return (
                <li key={item.key}>
                  <div
                    className={`shopping__item${checked ? ' shopping__item--checked' : ''}`}
                  >
                    <label className="shopping__item-check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleChecked(item.key)}
                      />
                      <span className="shopping__item-label">{item.label}</span>
                    </label>
                    {item.fromRecipes.length > 0 && (
                      <p className="shopping__item-from">
                        Fra:{' '}
                        {item.fromRecipes.map((source, index) => (
                          <span key={source.id}>
                            {index > 0 && ', '}
                            <RecipeLink
                              recipeId={source.id}
                              className="shopping__item-recipe"
                            >
                              {source.name}
                            </RecipeLink>
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
