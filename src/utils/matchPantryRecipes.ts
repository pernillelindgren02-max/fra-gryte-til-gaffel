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

/**
 * Match via canonical ingredient ids (and normalized NO/EN names for pantry
 * entries typed as free text). Display strings stay language-specific.
 */
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
    const keys = [
      normalizeIngredientName(ingredient.id),
      normalizeIngredientName(ingredient.nameNo),
      normalizeIngredientName(ingredient.nameEn),
      normalizeIngredientName(ingredient.name),
    ].filter(Boolean)
    const hit = keys.some((k) => pantry.has(k))
    if (hit) have.push(ingredient.name)
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

/** Compact label for Explore cards — pass localized strings from caller when possible. */
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

/** Unique ingredient display names from the library (locale-resolved on recipe). */
export function getKnownIngredientNames(recipeList: Recipe[]): string[] {
  const set = new Set<string>()
  for (const recipe of recipeList) {
    for (const ingredient of recipe.ingredients) {
      if (ingredient.name) set.add(ingredient.name)
      if (ingredient.nameNo) set.add(ingredient.nameNo)
      if (ingredient.nameEn) set.add(ingredient.nameEn)
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'nb'))
}
