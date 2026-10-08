import { useLocale } from '../context/LocaleContext'
import { usePantry } from '../context/PantryContext'
import { getIngredientCount, type Recipe } from '../data/recipes'
import { campingStoveLabels, mealTypeLabels } from '../data/filterLabels'
import { trackEvent } from '../lib/analytics'
import { matchRecipeAgainstPantry } from '../utils/matchPantryRecipes'
import { FavoriteButton } from './FavoriteButton'
import { RecipeLink } from './RecipeLink'
import { SafeImage } from './SafeImage'
import { ShoppingBagButton } from './ShoppingBagButton'
import { Tag } from './Tag'
import './RecipeCard.css'

interface RecipeCardProps {
  recipe: Recipe
  layout?: 'default' | 'rail' | 'grid' | 'featured'
  /** When set (e.g. explore/search), fires explore_recipe_click on open. */
  analyticsSource?: string | null
  entrySource?: string | null
  /** Show Explore quick-add shopping bag (default true on Explore layouts). */
  showShoppingBag?: boolean
}

export function RecipeCard({
  recipe,
  layout = 'default',
  analyticsSource = null,
  entrySource = null,
  showShoppingBag = true,
}: RecipeCardProps) {
  const { pantry } = usePantry()
  const { t } = useLocale()
  const ingredientCount = getIngredientCount(recipe)
  const pantryMatch =
    pantry.length > 0 ? matchRecipeAgainstPantry(pantry, recipe) : null
  const pantryLabel = pantryMatch
    ? pantryMatch.missing.length === 0
      ? t('pantry.matchAll')
      : pantryMatch.missing.length <= 2
        ? t('pantry.matchFew', { count: pantryMatch.missing.length })
        : t('pantry.matchSome', {
            have: pantryMatch.matchCount,
            total: pantryMatch.totalCount,
          })
    : null
  const isPrimusFriendly =
    recipe.campingStoveSuitability === 'perfect' ||
    recipe.campingStoveSuitability === 'adaptable'
  const layoutClass =
    layout === 'rail'
      ? ' recipe-card--rail'
      : layout === 'grid'
        ? ' recipe-card--grid'
        : layout === 'featured'
          ? ' recipe-card--featured'
          : ''

  function onOpenAnalytics() {
    if (!analyticsSource) return
    trackEvent('explore_recipe_click', {
      recipeId: recipe.id,
      source: analyticsSource,
      properties: { via: analyticsSource },
    })
  }

  return (
    <article className={`recipe-card${layoutClass}`}>
      <div className="recipe-card__media">
        <RecipeLink
          recipeId={recipe.id}
          className="recipe-card__image-link"
          entrySource={entrySource}
          onClick={onOpenAnalytics}
        >
          <div className="recipe-card__image">
            <SafeImage src={recipe.image} alt="" loading="lazy" />
          </div>
        </RecipeLink>
        <FavoriteButton recipeId={recipe.id} compact />
      </div>
      <div className="recipe-card__body">
        <div className="recipe-card__title-row">
          <RecipeLink
            recipeId={recipe.id}
            className="recipe-card__title-link"
            entrySource={entrySource}
            onClick={onOpenAnalytics}
          >
            <h2 className="recipe-card__title">{recipe.name}</h2>
          </RecipeLink>
          {showShoppingBag ? (
            <ShoppingBagButton
              recipe={recipe}
              source={analyticsSource || entrySource || 'explore'}
            />
          ) : null}
        </div>
        <RecipeLink
          recipeId={recipe.id}
          className="recipe-card__link"
          entrySource={entrySource}
          onClick={onOpenAnalytics}
        >
          <div className="recipe-card__meta">
            <span>{recipe.timeMinutes} min</span>
            <span aria-hidden="true">·</span>
            <span>{ingredientCount} ingredienser</span>
            <span aria-hidden="true">·</span>
            <span>{mealTypeLabels[recipe.mealType]}</span>
          </div>
          {pantryLabel && (
            <p className="recipe-card__pantry">{pantryLabel}</p>
          )}
          {isPrimusFriendly && layout !== 'grid' && (
            <div className="recipe-card__tags">
              <Tag variant="primus">
                {campingStoveLabels[recipe.campingStoveSuitability]}
              </Tag>
            </div>
          )}
        </RecipeLink>
      </div>
    </article>
  )
}
