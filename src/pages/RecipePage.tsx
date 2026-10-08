import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { RecipePersonalPanel } from '../components/RecipePersonalPanel'
import { RecipeShareSheet } from '../components/RecipeShareSheet'
import { SaveSheet } from '../components/SaveSheet'
import { SafeImage } from '../components/SafeImage'
import { SettStemningen } from '../components/SettStemningen'
import { RecipeDetailSkeleton } from '../components/skeleton'
import { Tag } from '../components/Tag'
import { trackEvent } from '../lib/analytics'
import { getLastAppPath } from '../lib/adminPath'
import {
  getRememberedPortions,
  rememberPortions,
} from '../lib/recipePortions'
import { backLabelForPath, recipePath } from '../lib/recipeLinks'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { usePantry } from '../context/PantryContext'
import { useShoppingList } from '../context/ShoppingListContext'
import { useToast } from '../context/ToastContext'
import { useUserData } from '../context/UserDataContext'
import {
  getCampingStoveLabels,
  getDishwashingLevelLabels,
  getPriceLevelLabels,
  getStorageNeedLabels,
  getWaterNeedLabels,
} from '../data/filterLabels'
import { useRecipes } from '../context/RecipesContext'
import type { DishwashingLevel } from '../data/recipes'
import { evaluateFridgeCoverage } from '../utils/fridgeCoverage'
import { matchRecipeAgainstPantry } from '../utils/matchPantryRecipes'
import {
  MAX_PORTIONS,
  MIN_PORTIONS,
  clampPortions,
  formatScaledIngredient,
  portionMultiplier,
  scaleIngredientQuantity,
} from '../utils/scalePortions'
import './RecipePage.css'

export function RecipePage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const { getById, loading } = useRecipes()
  const recipe = id ? getById(decodeURIComponent(id)) : undefined
  const { addRecipe, hasRecipe, getPortions, setPortions: setListPortions } =
    useShoppingList()
  const { pantry } = usePantry()
  const { showToast } = useToast()
  const { user } = useAuth()
  const { locale, t } = useLocale()
  const { isFavorite, foldersForRecipe } = useUserData()
  const navigate = useNavigate()
  const [saveOpen, setSaveOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const campingStoveLabels = getCampingStoveLabels(locale)
  const priceLevelLabels = getPriceLevelLabels(locale)
  const storageNeedLabels = getStorageNeedLabels(locale)
  const dishwashingLevelLabels = getDishwashingLevelLabels(locale)
  const waterNeedLabels = getWaterNeedLabels(locale)
  const dishwashingCompact: Record<DishwashingLevel, string> = {
    almostNothing: dishwashingLevelLabels.almostNothing,
    little: dishwashingLevelLabels.little,
    extra: dishwashingLevelLabels.extra,
  }
  const locState = location.state as {
    from?: string
    entry?: string
  } | null
  const fromState = locState?.from
  const entryHint = locState?.entry
  const backTo =
    fromState && !fromState.startsWith(recipePath(id ?? ''))
      ? fromState
      : getLastAppPath() || '/'
  const backLabel = backLabelForPath(backTo, locale)
  const baseServings = recipe && recipe.servings > 0 ? recipe.servings : 2
  const [portions, setPortions] = useState(baseServings)
  const portionsReady = useRef(false)

  // Always open recipe detail at the top (incl. deep links / id changes).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  useEffect(() => {
    if (!recipe) return
    const entry =
      entryHint &&
      ['search', 'explore', 'category', 'pantry', 'fridge', 'tips', 'favorites'].includes(
        entryHint,
      )
        ? entryHint
        : fromState?.startsWith('/')
          ? fromState.startsWith('/tips')
            ? 'tips'
            : fromState === '/hjemme' || fromState.startsWith('/kjoleskap')
              ? 'fridge'
              : fromState === '/' || fromState.startsWith('/?')
                ? 'explore'
                : fromState.startsWith('/favoritter')
                  ? 'favorites'
                  : 'app'
          : typeof document !== 'undefined' && document.referrer
            ? 'deep_link'
            : 'direct'
    trackEvent('recipe_view', {
      recipeId: recipe.id,
      source: entry,
      properties: entry === 'search' ? { via: 'search' } : undefined,
    })
  }, [recipe?.id])

  function goBack() {
    // Prefer history back so the previous screen can restore its scroll
    // (ScrollRestoration + Explore session). Fallback for deep links.
    if (fromState) {
      navigate(-1)
      return
    }
    navigate(backTo)
  }

  useEffect(() => {
    if (!recipe) return
    portionsReady.current = false
    const base = recipe.servings > 0 ? recipe.servings : 2
    // Prefer shopping-list portions when on list, else remembered, else base.
    const initial = hasRecipe(recipe.id)
      ? getPortions(recipe.id, base)
      : getRememberedPortions(recipe.id, base)
    setPortions(clampPortions(initial))
    const timer = window.setTimeout(() => {
      portionsReady.current = true
    }, 0)
    return () => window.clearTimeout(timer)
  }, [recipe?.id, recipe?.servings])

  useEffect(() => {
    if (!portionsReady.current || !recipe) return
    rememberPortions(recipe.id, portions)
    if (hasRecipe(recipe.id)) {
      setListPortions(recipe.id, portions, baseServings)
      trackEvent('shopping_recipe_portions_changed', {
        recipeId: recipe.id,
        source: 'recipe',
        properties: { portions },
      })
    }
    showToast(
      locale === 'en'
        ? `Servings: ${portions}.`
        : `Porsjoner: ${portions} porsjon${portions === 1 ? '' : 'er'}.`,
    )
    trackEvent('recipe_portions_change', {
      recipeId: recipe.id,
      source: 'recipe',
      properties: { portions },
    })
  }, [portions, showToast, recipe?.id])

  const scale = useMemo(
    () => (recipe ? portionMultiplier(portions, baseServings) : 1),
    [recipe, portions, baseServings],
  )

  const fridgeMatch = useMemo(
    () =>
      recipe && pantry.length > 0
        ? matchRecipeAgainstPantry(pantry, recipe)
        : null,
    [pantry, recipe],
  )

  /** Per-ingredient coverage using the same engine as the shopping list. */
  const ingredientCoverage = useMemo(() => {
    if (!recipe || pantry.length === 0) return null
    return recipe.ingredients.map((ingredient) =>
      evaluateFridgeCoverage(pantry, {
        ingredientId: ingredient.id || ingredient.name,
        name: ingredient.name,
        quantity: scaleIngredientQuantity(ingredient.quantity, scale),
        unit: ingredient.unit,
      }),
    )
  }, [recipe, pantry, scale])

  useEffect(() => {
    if (!fridgeMatch || !recipe) return
    trackEvent('recipe_fridge_match_viewed', {
      recipeId: recipe.id,
      source: 'recipe',
      properties: {
        have: fridgeMatch.matchCount,
        total: fridgeMatch.totalCount,
        missing: fridgeMatch.missing.length,
      },
    })
  }, [recipe?.id, fridgeMatch?.matchCount, fridgeMatch?.totalCount])

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
        <p>Denne oppskriften er ikke tilgjengelig lenger.</p>
        <Link to="/" className="recipe-page__list-btn recipe-page__unavailable-cta">
          Gå til Utforsk
        </Link>
        <button type="button" className="recipe-page__back" onClick={goBack}>
          {backLabel}
        </button>
      </div>
    )
  }

  const alreadyOnList = hasRecipe(recipe.id)
  const savedSomewhere =
    Boolean(user) &&
    (isFavorite(recipe.id) || foldersForRecipe(recipe.id).length > 0)

  function onAddToList() {
    if (alreadyOnList) {
      navigate('/handleliste')
      return
    }
    // Always add FULL recipe requirements — fridge only informs status on the list.
    const result = addRecipe(recipe!.id, scale)
    if (result === 'added') {
      trackEvent('recipe_shopping_add', {
        recipeId: recipe!.id,
        source: 'recipe',
        properties: {
          portions,
          missing_only: 0,
          full_requirements: 1,
        },
      })
      showToast(
        scale === 1
          ? t('shopping.addedToast')
          : locale === 'en'
            ? `Added to shopping list (${portions} servings).`
            : `Lagt til i handlelisten (${portions} porsjoner).`,
      )
    } else if (result === 'duplicate') {
      navigate('/handleliste')
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
        <button type="button" className="recipe-page__back" onClick={goBack}>
          {backLabel}
        </button>
        <div className="recipe-page__top-actions">
          <button
            type="button"
            className="recipe-page__share-btn"
            onClick={() => setShareOpen(true)}
          >
            {t('share.menu')}
          </button>
          <button
            type="button"
            className={`recipe-page__save-btn${savedSomewhere ? ' recipe-page__save-btn--on' : ''}`}
            onClick={() => setSaveOpen(true)}
          >
            {savedSomewhere ? t('recipe.saved') : t('recipe.save')}
          </button>
        </div>
      </div>

      <div className="recipe-page__image">
        <SafeImage src={recipe.image} alt="" loading="eager" />
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
          className={`recipe-page__list-btn${alreadyOnList ? ' recipe-page__list-btn--on' : ''}`}
          onClick={onAddToList}
          aria-label={
            alreadyOnList
              ? t('recipe.inShoppingPortions', { count: portions })
              : t('recipe.addShopping')
          }
        >
          {alreadyOnList
            ? `${t('recipe.inShoppingPortions', { count: portions })} ›`
            : t('recipe.addShopping')}
        </button>
      </header>

      <RecipePersonalPanel recipeId={recipe.id} />

      <SettStemningen recipe={recipe} />

      <section className="recipe-page__section">
        <div className="recipe-page__section-head">
          <h2 className="recipe-page__section-title">{t('recipe.ingredients')}</h2>
          {fridgeMatch ? (
            <p className="recipe-page__fridge-match" aria-live="polite">
              {fridgeMatch.missing.length === 0
                ? t('pantry.matchAll')
                : t('recipe.fridgeMatch', {
                    have: fridgeMatch.matchCount,
                    total: fridgeMatch.totalCount,
                  })}
              {fridgeMatch.missing.length > 0 ? (
                <span className="recipe-page__fridge-missing">
                  {' '}
                  · {t('pantry.missing')} {fridgeMatch.missing.length}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
        <ul className="recipe-page__ingredients">
          {recipe.ingredients.map((ingredient, index) => {
            const coverage = ingredientCoverage?.[index] ?? null
            const kind = coverage?.kind ?? null
            const rowClass =
              kind === 'enough'
                ? 'recipe-page__ingredient--owned'
                : kind === 'absent'
                  ? 'recipe-page__ingredient--missing'
                  : kind === 'partial' || kind === 'unknown'
                    ? 'recipe-page__ingredient--partial'
                    : undefined
            let statusLabel: string | null = null
            let statusClass = 'recipe-page__ownership'
            if (kind === 'enough') {
              statusLabel = t('recipe.coverageEnough')
              statusClass += ' recipe-page__ownership--owned'
            } else if (kind === 'absent') {
              statusLabel = t('recipe.coverageAbsent')
              statusClass += ' recipe-page__ownership--missing'
            } else if (kind === 'unknown') {
              statusLabel = t('recipe.coverageUnknown')
              statusClass += ' recipe-page__ownership--unknown'
            } else if (kind === 'partial') {
              statusLabel = t('recipe.coveragePartial', {
                have: coverage?.haveLabel ?? '—',
                need: coverage?.needLabel ?? '—',
              })
              statusClass += ' recipe-page__ownership--partial'
            }
            return (
              <li
                key={`${ingredient.id}-${ingredient.unit}`}
                className={rowClass}
              >
                <div className="recipe-page__ingredient-main">
                  <span>{formatScaledIngredient(ingredient, scale)}</span>
                  {statusLabel ? (
                    <span className={statusClass}>{statusLabel}</span>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="recipe-page__section">
        <h2 className="recipe-page__section-title">{t('recipe.steps')}</h2>
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
      <RecipeShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        recipe={recipe}
        portions={portions}
      />
    </article>
  )
}
