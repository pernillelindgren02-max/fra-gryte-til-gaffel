import { Link, useParams } from 'react-router-dom'
import { FavoriteButton } from '../components/FavoriteButton'
import { RecipePersonalPanel } from '../components/RecipePersonalPanel'
import { Tag } from '../components/Tag'
import {
  campingStoveLabels,
  dishwashingLevelLabels,
  mealTypeLabels,
  preparationLevelLabels,
  priceLevelLabels,
  storageNeedLabels,
  waterNeedLabels,
} from '../data/filterLabels'
import { getIngredientCount, getRecipeById } from '../data/recipes'
import './RecipePage.css'

export function RecipePage() {
  const { id } = useParams<{ id: string }>()
  const recipe = id ? getRecipeById(id) : undefined

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

  return (
    <article className="recipe-page">
      <div className="recipe-page__top">
        <Link to="/" className="recipe-page__back">
          ← Alle oppskrifter
        </Link>
        <FavoriteButton recipeId={recipe.id} />
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
      </header>

      <RecipePersonalPanel recipeId={recipe.id} />

      <section className="recipe-page__section">
        <h2 className="recipe-page__section-title">Ingredienser</h2>
        <ul className="recipe-page__ingredients">
          {recipe.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
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
    </article>
  )
}
