import { slugifyIngredientId } from '../i18n/content'
import type { Ingredient, Recipe } from '../data/recipes'

export function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase()
}

/** Staples that must not dominate ranking (weight 0 for score). */
const ZERO_WEIGHT_IDS = new Set([
  'salt',
  'pepper',
  'sort-pepper',
  'salt-og-pepper',
  'vann',
  'water',
  'nudelvann',
  'pastavann',
])

/** Useful but common — lower weight so they don't outrank real food. */
const LOW_WEIGHT_IDS = new Set([
  'olje',
  'oil',
  'olivenolje',
  'smor',
  'butter',
  'smor-til-steking',
])

export function ingredientMatchWeight(ingredient: Ingredient): number {
  const id = (ingredient.id || slugifyIngredientId(ingredient.nameNo || ingredient.name)).trim()
  const nameKey = slugifyIngredientId(ingredient.nameNo || ingredient.name)
  if (ZERO_WEIGHT_IDS.has(id) || ZERO_WEIGHT_IDS.has(nameKey)) return 0
  if (LOW_WEIGHT_IDS.has(id) || LOW_WEIGHT_IDS.has(nameKey)) return 0.25
  return 1
}

export type FridgePantryRef = {
  id?: string
  name: string
}

export interface PantryMatch {
  recipe: Recipe
  /** Count of matched ingredients (any weight). */
  matchCount: number
  totalCount: number
  /** Weighted match score for ranking. */
  meaningfulMatch: number
  /** Weighted total of recipe ingredients. */
  meaningfulTotal: number
  /** meaningfulMatch / meaningfulTotal (0–1). */
  meaningfulRatio: number
  have: string[]
  missing: string[]
  haveIds: string[]
  missingIds: string[]
}

function pantryKeySet(pantry: Array<string | FridgePantryRef>): Set<string> {
  const set = new Set<string>()
  for (const item of pantry) {
    if (typeof item === 'string') {
      const n = normalizeIngredientName(item)
      if (n) set.add(n)
      const id = slugifyIngredientId(item)
      if (id) set.add(id)
    } else {
      if (item.id) set.add(normalizeIngredientName(item.id))
      if (item.id) set.add(slugifyIngredientId(item.id))
      const n = normalizeIngredientName(item.name)
      if (n) set.add(n)
      const id = slugifyIngredientId(item.name)
      if (id) set.add(id)
    }
  }
  return set
}

function ingredientKeys(ingredient: Ingredient): string[] {
  return [
    normalizeIngredientName(ingredient.id),
    slugifyIngredientId(ingredient.id),
    normalizeIngredientName(ingredient.nameNo),
    slugifyIngredientId(ingredient.nameNo),
    normalizeIngredientName(ingredient.nameEn),
    slugifyIngredientId(ingredient.nameEn),
    normalizeIngredientName(ingredient.name),
    slugifyIngredientId(ingredient.name),
  ].filter(Boolean)
}

/**
 * Match via canonical ingredient ids (and normalized NO/EN names for pantry
 * entries typed as free text). Display strings stay language-specific.
 */
export function matchRecipeAgainstPantry(
  pantryNames: Array<string | FridgePantryRef>,
  recipe: Recipe,
): PantryMatch | null {
  const pantry = pantryKeySet(pantryNames)
  if (pantry.size === 0) return null

  const have: string[] = []
  const missing: string[] = []
  const haveIds: string[] = []
  const missingIds: string[] = []
  let meaningfulMatch = 0
  let meaningfulTotal = 0

  for (const ingredient of recipe.ingredients) {
    const weight = ingredientMatchWeight(ingredient)
    meaningfulTotal += weight
    const keys = ingredientKeys(ingredient)
    const hit = keys.some((k) => pantry.has(k))
    const display = ingredient.name || ingredient.nameNo || ingredient.id
    const id = ingredient.id || slugifyIngredientId(display)
    if (hit) {
      have.push(display)
      haveIds.push(id)
      meaningfulMatch += weight
    } else {
      missing.push(display)
      missingIds.push(id)
    }
  }

  if (have.length === 0) return null

  return {
    recipe,
    matchCount: have.length,
    totalCount: recipe.ingredients.length,
    meaningfulMatch,
    meaningfulTotal,
    meaningfulRatio:
      meaningfulTotal > 0 ? meaningfulMatch / meaningfulTotal : 0,
    have,
    missing,
    haveIds,
    missingIds,
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

/**
 * Rank: meaningful match count → meaningful % → name.
 * When `requireMatch` (Explore fridge filter), zero-match recipes are excluded.
 */
export function matchRecipesByPantry(
  pantryNames: Array<string | FridgePantryRef>,
  recipeList: Recipe[],
  limit = Infinity,
): PantryMatch[] {
  if (pantryNames.length === 0) return []

  const scored: PantryMatch[] = []
  for (const recipe of recipeList) {
    const match = matchRecipeAgainstPantry(pantryNames, recipe)
    if (match) scored.push(match)
  }

  return scored
    .sort((a, b) => {
      if (b.meaningfulMatch !== a.meaningfulMatch) {
        return b.meaningfulMatch - a.meaningfulMatch
      }
      if (b.meaningfulRatio !== a.meaningfulRatio) {
        return b.meaningfulRatio - a.meaningfulRatio
      }
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount
      return a.recipe.name.localeCompare(b.recipe.name, 'nb')
    })
    .slice(0, Number.isFinite(limit) ? limit : scored.length)
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

/** Resolve a typed/selected name to a canonical id using the recipe library. */
export function resolveCanonicalIngredientId(
  rawName: string,
  recipeList: Recipe[],
): string {
  const key = normalizeIngredientName(rawName)
  const slug = slugifyIngredientId(rawName)
  for (const recipe of recipeList) {
    for (const ingredient of recipe.ingredients) {
      const keys = ingredientKeys(ingredient)
      if (keys.includes(key) || keys.includes(slug)) {
        return ingredient.id || slugifyIngredientId(ingredient.nameNo || ingredient.name)
      }
    }
  }
  return slug
}
