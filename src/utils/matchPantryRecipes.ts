import type { Recipe } from '../data/recipes'

export function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase()
}

export interface PantryMatch {
  recipe: Recipe
  matchCount: number
  have: string[]
  missing: string[]
}

/** Exact match on normalized ingredient name only. */
export function matchRecipesByPantry(
  pantryNames: string[],
  recipeList: Recipe[],
  limit = 3,
): PantryMatch[] {
  const pantry = new Set(
    pantryNames.map(normalizeIngredientName).filter(Boolean),
  )
  if (pantry.size === 0) return []

  const scored: PantryMatch[] = []

  for (const recipe of recipeList) {
    const have: string[] = []
    const missing: string[] = []
    for (const ingredient of recipe.ingredients) {
      const key = normalizeIngredientName(ingredient.name)
      if (pantry.has(key)) have.push(ingredient.name)
      else missing.push(ingredient.name)
    }
    if (have.length === 0) continue
    scored.push({
      recipe,
      matchCount: have.length,
      have,
      missing,
    })
  }

  return scored
    .sort((a, b) => {
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount
      return a.recipe.name.localeCompare(b.recipe.name, 'nb')
    })
    .slice(0, limit)
}

/** Unique ingredient names from the library (for optional typing hints). */
export function getKnownIngredientNames(recipeList: Recipe[]): string[] {
  const set = new Set<string>()
  for (const recipe of recipeList) {
    for (const ingredient of recipe.ingredients) {
      set.add(ingredient.name)
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'nb'))
}
