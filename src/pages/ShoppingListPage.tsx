import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useShoppingList } from '../context/ShoppingListContext'
import { getRecipeById, recipes } from '../data/recipes'
import { searchRecipes } from '../utils/searchRecipes'
import './ShoppingListPage.css'

export function ShoppingListPage() {
  const {
    recipeIds,
    combined,
    checkedKeys,
    addRecipe,
    removeRecipe,
    clearAll,
    toggleChecked,
  } = useShoppingList()
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchRecipes(recipes, query).slice(0, 8)
  }, [query])

  const listedRecipes = recipeIds
    .map((id) => getRecipeById(id))
    .filter((recipe): recipe is NonNullable<typeof recipe> => Boolean(recipe))

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(timer)
  }, [toast])

  function onPick(recipeId: string) {
    const result = addRecipe(recipeId)
    if (result === 'added') {
      setToast('Oppskriften er lagt til i handlelisten.')
      setQuery('')
    } else if (result === 'duplicate') {
      setToast('Oppskriften er allerede i handlelisten.')
    }
  }

  return (
    <div className="shopping">
      <header className="shopping__header">
        <h1 className="shopping__title">Handleliste</h1>
        <p className="shopping__lead">
          Legg til oppskrifter, se samlede mengder og huk av det du har kjøpt.
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

      {listedRecipes.length > 0 && (
        <section className="shopping__block">
          <div className="shopping__block-head">
            <h2 className="shopping__subtitle">Oppskrifter</h2>
            <button
              type="button"
              className="shopping__text-btn"
              onClick={clearAll}
            >
              Tøm listen
            </button>
          </div>
          <ul className="shopping__recipes">
            {listedRecipes.map((recipe) => (
              <li key={recipe.id}>
                <Link to={`/oppskrift/${recipe.id}`}>{recipe.name}</Link>
                <button
                  type="button"
                  className="shopping__text-btn"
                  onClick={() => removeRecipe(recipe.id)}
                >
                  Fjern
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="shopping__block">
        <h2 className="shopping__subtitle">Ingredienser</h2>
        {combined.length === 0 ? (
          <p className="shopping__empty">
            Handlelisten er tom. Søk etter en oppskrift, eller åpne en oppskrift
            og trykk «Legg til i handleliste».
          </p>
        ) : (
          <ul className="shopping__items">
            {combined.map((item) => {
              const checked = checkedKeys.has(item.key)
              return (
                <li key={item.key}>
                  <label
                    className={`shopping__item${checked ? ' shopping__item--checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleChecked(item.key)}
                    />
                    <span>{item.label}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {toast && (
        <div className="shopping__toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
