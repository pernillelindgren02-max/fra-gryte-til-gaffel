import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RecipePersonalPanel } from '../components/RecipePersonalPanel'
import { SaveSheet } from '../components/SaveSheet'
import { RecipeDetailSkeleton } from '../components/skeleton'
import { Tag } from '../components/Tag'
import { useAuth } from '../context/AuthContext'
import { useShoppingList } from '../context/ShoppingListContext'
import { useToast } from '../context/ToastContext'
import { useUserData } from '../context/UserDataContext'
import {
  campingStoveLabels,
  dishwashingLevelLabels,
  priceLevelLabels,
  storageNeedLabels,
  waterNeedLabels,
} from '../data/filterLabels'
import { useRecipes } from '../context/RecipesContext'
import type { DishwashingLevel } from '../data/recipes'
import {
  MAX_PORTIONS,
  MIN_PORTIONS,
  clampPortions,
  formatScaledIngredient,
  portionMultiplier,
} from '../utils/scalePortions'
import './RecipePage.css'

const dishwashingCompact: Record<DishwashingLevel, string> = {
  almostNothing: 'Nesten ingen oppvask',
  little: 'Lite oppvask',
  extra: 'Litt ekstra oppvask',
}

export function RecipePage() {
  const { id } = useParams<{ id: string }>()
  const { getById, loading } = useRecipes()
  const recipe = id ? getById(id) : undefined
  const { addRecipe, hasRecipe } = useShoppingList()
  const { showToast } = useToast()
  const { user } = useAuth()
  const { isFavorite, foldersForRecipe } = useUserData()
  const [saveOpen, setSaveOpen] = useState(false)
  const baseServings = recipe && recipe.servings > 0 ? recipe.servings : 2
  const [portions, setPortions] = useState(baseServings)
  const portionsReady = useRef(false)

  useEffect(() => {
    if (!recipe) return
    portionsReady.current = false
    setPortions(clampPortions(recipe.servings > 0 ? recipe.servings : 2))
    const timer = window.setTimeout(() => {
      portionsReady.current = true
    }, 0)
    return () => window.clearTimeout(timer)
  }, [recipe?.id, recipe?.servings])

  useEffect(() => {
    if (!portionsReady.current) return
    showToast(
      `Porsjoner: ${portions} porsjon${portions === 1 ? '' : 'er'}.`,
    )
  }, [portions, showToast])

  const scale = useMemo(
    () => (recipe ? portionMultiplier(portions, baseServings) : 1),
    [recipe, portions, baseServings],
  )

  if (loading && !recipe) {
    return (
      <article className="recipe-page">
        <RecipeDetailSkeleton />
      </article>
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

  const alreadyOnList = hasRecipe(recipe.id)
  const savedSomewhere =
    Boolean(user) &&
    (isFavorite(recipe.id) || foldersForRecipe(recipe.id).length > 0)

  function onAddToList() {
    const result = addRecipe(recipe!.id, scale)
    if (result === 'added') {
      showToast(
        scale === 1
          ? 'Lagt til i handlelisten.'
          : `Lagt til i handlelisten (${portions} porsjoner).`,
      )
    } else if (result === 'duplicate') {
      showToast('Oppskriften er allerede i handlelisten.')
    }
  }

  const facts = [
    `${recipe.timeMinutes} min`,
    priceLevelLabels[recipe.priceLevel],
    dishwashingCompact[recipe.dishwashingLevel],
    campingStoveLabels[recipe.campingStoveSuitability],
    `${portions} porsjon${portions === 1 ? '' : 'er'}`,
  ]

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

        <p className="recipe-page__facts" aria-label="Nøkkelinfo">
          {facts.map((fact, index) => (
            <span key={fact}>
              {index > 0 && (
                <span className="recipe-page__facts-sep" aria-hidden="true">
                  {' '}
                  ·{' '}
                </span>
              )}
              <span>{fact}</span>
            </span>
          ))}
        </p>

        <div
          className="recipe-page__portions"
          role="group"
          aria-label="Antall porsjoner"
        >
          <button
            type="button"
            className="recipe-page__portion-btn"
            aria-label="Færre porsjoner"
            disabled={portions <= MIN_PORTIONS}
            onClick={() => setPortions((prev) => clampPortions(prev - 1))}
          >
            −
          </button>
          <span className="recipe-page__portion-value">
            {portions} porsjon{portions === 1 ? '' : 'er'}
          </span>
          <button
            type="button"
            className="recipe-page__portion-btn"
            aria-label="Flere porsjoner"
            disabled={portions >= MAX_PORTIONS}
            onClick={() => setPortions((prev) => clampPortions(prev + 1))}
          >
            +
          </button>
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
            <li key={`${ingredient.name}-${ingredient.unit}`}>
              {formatScaledIngredient(ingredient, scale)}
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
    </article>
  )
}
