import type { Recipe } from '../data/recipes'

/**
 * Keep 2-column grids even: if odd, prefer filling with a stable pick from
 * the pool; otherwise trim the last card.
 */
export function ensureEvenRecipes(
  recipes: Recipe[],
  pool: Recipe[] = recipes,
): Recipe[] {
  if (recipes.length === 0 || recipes.length % 2 === 0) return recipes

  const used = new Set(recipes.map((r) => r.id))
  const fillers = pool
    .filter((r) => !used.has(r.id))
    .sort((a, b) => a.id.localeCompare(b.id, 'nb'))

  if (fillers.length > 0) {
    return [...recipes, fillers[0]]
  }
  return recipes.slice(0, -1)
}
