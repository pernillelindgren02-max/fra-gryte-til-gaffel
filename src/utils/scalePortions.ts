import type { Ingredient } from '../data/recipes'
import { formatQuantityDisplay } from '../data/recipes'

const MIN_PORTIONS = 1
const MAX_PORTIONS = 8

export function clampPortions(value: number): number {
  if (!Number.isFinite(value)) return MIN_PORTIONS
  return Math.min(MAX_PORTIONS, Math.max(MIN_PORTIONS, Math.round(value)))
}

/** Scale factor from recipe base servings to the UI portion count. */
export function portionMultiplier(
  portions: number,
  baseServings: number,
): number {
  const base = baseServings > 0 ? baseServings : 2
  return clampPortions(portions) / base
}

export function scaleIngredientQuantity(
  quantity: number | null,
  multiplier: number,
): number | null {
  if (quantity == null) return null
  const scaled = quantity * multiplier
  // Snap near common cooking fractions to avoid long decimals.
  const snapped = snapQuantity(scaled)
  return snapped
}

function snapQuantity(value: number): number {
  const precision = 1000
  const rounded = Math.round(value * precision) / precision
  const whole = Math.floor(rounded + 1e-9)
  const frac = rounded - whole
  const targets = [0, 0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1]
  let best = frac
  let bestDist = Infinity
  for (const t of targets) {
    const dist = Math.abs(frac - t)
    if (dist < bestDist && dist < 0.02) {
      bestDist = dist
      best = t
    }
  }
  const result = whole + best
  // Prefer readable thirds in display path via formatQuantityDisplay
  return Math.round(result * precision) / precision
}

export function scaleIngredients(
  ingredients: Ingredient[],
  multiplier: number,
): Ingredient[] {
  if (multiplier === 1) return ingredients
  return ingredients.map((ingredient) => ({
    ...ingredient,
    quantity: scaleIngredientQuantity(ingredient.quantity, multiplier),
  }))
}

export function formatScaledIngredient(
  ingredient: Ingredient,
  multiplier: number,
): string {
  const scaled = scaleIngredients([ingredient], multiplier)[0]
  if (scaled.quantity == null || scaled.unit == null) {
    if (scaled.quantity != null && scaled.unit === null) {
      return `${formatQuantityDisplay(scaled.quantity)} ${scaled.name}`
    }
    return scaled.name
  }
  return `${formatQuantityDisplay(scaled.quantity)} ${scaled.unit} ${scaled.name}`
}

export { MIN_PORTIONS, MAX_PORTIONS }
