import { Link } from 'react-router-dom'
import {
  getIngredientCount,
  type Recipe,
} from '../data/recipes'
import { campingStoveLabels, mealTypeLabels } from '../data/filterLabels'
import { Tag } from './Tag'
import './RecipeCard.css'

interface RecipeCardProps {
  recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const ingredientCount = getIngredientCount(recipe)
  const isPrimusFriendly =
    recipe.campingStoveSuitability === 'perfect' ||
    recipe.campingStoveSuitability === 'adaptable'

  return (
    <article className="recipe-card">
      <Link to={`/oppskrift/${recipe.id}`} className="recipe-card__link">
        <div className="recipe-card__image" aria-hidden="true">
          <span className="recipe-card__image-label">Bildekommer</span>
        </div>
        <div className="recipe-card__body">
          <h2 className="recipe-card__title">{recipe.name}</h2>
          <div className="recipe-card__meta">
            <span>{recipe.timeMinutes} min</span>
            <span aria-hidden="true">·</span>
            <span>{ingredientCount} ingredienser</span>
            <span aria-hidden="true">·</span>
            <span>{mealTypeLabels[recipe.mealType]}</span>
          </div>
          {isPrimusFriendly && (
            <div className="recipe-card__tags">
              <Tag variant="primus">
                {campingStoveLabels[recipe.campingStoveSuitability]}
              </Tag>
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}
