import type { Recipe } from '../data/recipes'

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const term = normalize(query)
  if (!term) return recipes

  return recipes.filter((recipe) => {
    const inName = normalize(recipe.name).includes(term)
    const inIngredients = recipe.ingredients.some((ingredient) =>
      normalize(ingredient.name).includes(term),
    )
    const inDescription = normalize(recipe.shortDescription).includes(term)
    return inName || inIngredients || inDescription
  })
}
