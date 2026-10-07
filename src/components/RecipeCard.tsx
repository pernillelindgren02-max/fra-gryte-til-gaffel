import { usePantry } from '../context/PantryContext'
import { getIngredientCount, type Recipe } from '../data/recipes'
import { campingStoveLabels, mealTypeLabels } from '../data/filterLabels'
import { trackEvent } from '../lib/analytics'
import {
  formatPantryMatchLabel,
  matchRecipeAgainstPantry,
} from '../utils/matchPantryRecipes'
import { FavoriteButton } from './FavoriteButton'
import { RecipeLink } from './RecipeLink'
import { SafeImage } from './SafeImage'
import { Tag } from './Tag'
import './RecipeCard.css'

interface RecipeCardProps {
  recipe: Recipe
  layout?: 'default' | 'rail' | 'grid' | 'featured'
  /** When set (e.g. explore/search), fires explore_recipe_click on open. */
  analyticsSource?: string | null
  entrySource?: string | null
}

export function RecipeCard({
  recipe,
  layout = 'default',
  analyticsSource = null,
  entrySource = null,
}: RecipeCardProps) {
  const { pantry } = usePantry()
  const ingredientCount = getIngredientCount(recipe)
  const pantryMatch =
    pantry.length > 0 ? matchRecipeAgainstPantry(pantry, recipe) : null
  const pantryLabel = pantryMatch ? formatPantryMatchLabel(pantryMatch) : null
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

  return (
    <article className={`recipe-card${layoutClass}`}>
      <div className="recipe-card__media">
        <RecipeLink
          recipeId={recipe.id}
          className="recipe-card__image-link"
          entrySource={entrySource}
          onClick={() => {
            if (!analyticsSource) return
            trackEvent('explore_recipe_click', {
              recipeId: recipe.id,
              source: analyticsSource,
              properties: { via: analyticsSource },
            })
          }}
        >
          <div className="recipe-card__image">
            <SafeImage src={recipe.image} alt="" loading="lazy" />
          </div>
        </RecipeLink>
        <FavoriteButton recipeId={recipe.id} compact />
      </div>
      <RecipeLink
        recipeId={recipe.id}
        className="recipe-card__link"
        entrySource={entrySource}
        onClick={() => {
          if (!analyticsSource) return
          trackEvent('explore_recipe_click', {
            recipeId: recipe.id,
            source: analyticsSource,
            properties: { via: analyticsSource },
          })
        }}
      >
        <div className="recipe-card__body">
          <h2 className="recipe-card__title">{recipe.name}</h2>
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
        </div>
      </RecipeLink>
    </article>
  )
}
