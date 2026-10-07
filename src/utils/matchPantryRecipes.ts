import type { Recipe } from '../data/recipes'

export function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase()
}

export interface PantryMatch {
  recipe: Recipe
  matchCount: number
  totalCount: number
  have: string[]
  missing: string[]
}

/** Exact match on normalized ingredient name only (one recipe). */
export function matchRecipeAgainstPantry(
  pantryNames: string[],
  recipe: Recipe,
): PantryMatch | null {
  const pantry = new Set(
    pantryNames.map(normalizeIngredientName).filter(Boolean),
  )
  if (pantry.size === 0) return null

  const have: string[] = []
  const missing: string[] = []
  for (const ingredient of recipe.ingredients) {
    const key = normalizeIngredientName(ingredient.name)
    if (pantry.has(key)) have.push(ingredient.name)
    else missing.push(ingredient.name)
  }
  if (have.length === 0) return null

  return {
    recipe,
    matchCount: have.length,
    totalCount: recipe.ingredients.length,
    have,
    missing,
  }
}

/** Compact label for Explore cards — same match rules as Hjemme. */
export function formatPantryMatchLabel(match: PantryMatch): string {
  const { matchCount, totalCount, missing } = match
  if (missing.length === 0) return 'Du har alt du trenger'
  if (missing.length <= 2) {
    return `Du mangler bare ${missing.length} ingrediens${missing.length === 1 ? '' : 'er'}`
  }
  return `Du har ${matchCount} av ${totalCount} ingredienser`
}

/** Exact match on normalized ingredient name only. */
export function matchRecipesByPantry(
  pantryNames: string[],
  recipeList: Recipe[],
  limit = 3,
): PantryMatch[] {
  if (pantryNames.length === 0) return []

  const scored: PantryMatch[] = []
  for (const recipe of recipeList) {
    const match = matchRecipeAgainstPantry(pantryNames, recipe)
    if (match) scored.push(match)
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
