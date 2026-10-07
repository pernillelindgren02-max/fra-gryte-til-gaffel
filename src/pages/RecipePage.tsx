import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RecipePersonalPanel } from '../components/RecipePersonalPanel'
import { SaveSheet } from '../components/SaveSheet'
import { Tag } from '../components/Tag'
import { useAuth } from '../context/AuthContext'
import { useShoppingList } from '../context/ShoppingListContext'
import { useUserData } from '../context/UserDataContext'
import {
  campingStoveLabels,
  dishwashingLevelLabels,
  mealTypeLabels,
  preparationLevelLabels,
  priceLevelLabels,
  storageNeedLabels,
  waterNeedLabels,
} from '../data/filterLabels'
import { useRecipes } from '../context/RecipesContext'
import { formatIngredient, getIngredientCount } from '../data/recipes'
import './RecipePage.css'

export function RecipePage() {
  const { id } = useParams<{ id: string }>()
  const { getById, loading } = useRecipes()
  const recipe = id ? getById(id) : undefined
  const { addRecipe, hasRecipe } = useShoppingList()
  const { user } = useAuth()
  const { isFavorite, foldersForRecipe } = useUserData()
  const [toast, setToast] = useState<string | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (loading && !recipe) {
    return (
      <div className="recipe-page recipe-page--missing">
        <p>Laster oppskrift…</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="recipe-page recipe-page--missing">
        <p>Fant ikke oppskriften.</p>
        <Link to="/" className="recipe-page__back">
          Tilbake til oversikten
        </Link>
      </div>
    )
  }

  const ingredientCount = getIngredientCount(recipe)
  const alreadyOnList = hasRecipe(recipe.id)
  const savedSomewhere =
    Boolean(user) &&
    (isFavorite(recipe.id) || foldersForRecipe(recipe.id).length > 0)

  function onAddToList() {
    const result = addRecipe(recipe!.id)
    if (result === 'added') {
      setToast('Lagt til i handlelisten.')
    } else if (result === 'duplicate') {
      setToast('Oppskriften er allerede i handlelisten.')
    }
  }

  return (
    <article className="recipe-page">
      <div className="recipe-page__top">
        <Link to="/" className="recipe-page__back">
          ← Alle oppskrifter
        </Link>
        <button
          type="button"
          className={`recipe-page__save-btn${savedSomewhere ? ' recipe-page__save-btn--on' : ''}`}
          onClick={() => setSaveOpen(true)}
        >
          {savedSomewhere ? 'Lagret' : 'Lagre'}
        </button>
      </div>

      <div className="recipe-page__image">
        <img src={recipe.image} alt="" />
      </div>

      <header className="recipe-page__header">
        <h1 className="recipe-page__title">{recipe.name}</h1>
        <p className="recipe-page__description">{recipe.shortDescription}</p>
        <div className="recipe-page__meta">
          <span>{recipe.timeMinutes} min</span>
          <span aria-hidden="true">·</span>
          <span>{ingredientCount} ingredienser</span>
          <span aria-hidden="true">·</span>
          <span>{mealTypeLabels[recipe.mealType]}</span>
          <span aria-hidden="true">·</span>
          <span>{preparationLevelLabels[recipe.preparationLevel]}</span>
        </div>
        <button
          type="button"
          className="recipe-page__list-btn"
          onClick={onAddToList}
          disabled={alreadyOnList}
        >
          {alreadyOnList ? 'I handlelisten' : 'Legg til i handleliste'}
        </button>
      </header>

      <RecipePersonalPanel recipeId={recipe.id} />

      <section className="recipe-page__section">
        <h2 className="recipe-page__section-title">Ingredienser</h2>
        <ul className="recipe-page__ingredients">
          {recipe.ingredients.map((ingredient) => (
            <li
              key={`${ingredient.name}-${ingredient.unit}-${ingredient.quantity}`}
            >
              {formatIngredient(ingredient)}
            </li>
          ))}
        </ul>
      </section>

      <section className="recipe-page__section">
        <h2 className="recipe-page__section-title">Slik gjør du</h2>
        <ol className="recipe-page__steps">
          {recipe.steps.map((step, index) => (
            <li key={step}>
              <span className="recipe-page__step-number">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="recipe-page__section">
        <h2 className="recipe-page__section-title">Praktisk</h2>
        <div className="recipe-page__tags">
          {recipe.practicalTags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
          <Tag>{campingStoveLabels[recipe.campingStoveSuitability]}</Tag>
          <Tag>{storageNeedLabels[recipe.storageNeed]}</Tag>
          <Tag>{priceLevelLabels[recipe.priceLevel]}</Tag>
          <Tag>{dishwashingLevelLabels[recipe.dishwashingLevel]}</Tag>
          <Tag>{waterNeedLabels[recipe.waterNeed]}</Tag>
        </div>
      </section>

      <SaveSheet
        open={saveOpen}
        recipeId={recipe.id}
        onClose={() => setSaveOpen(false)}
      />

      {toast && (
        <div className="recipe-page__toast" role="status">
          {toast}
        </div>
      )}
    </article>
  )
}
