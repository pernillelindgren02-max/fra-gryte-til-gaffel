import type { IngredientUnit } from '../data/recipes'

export type UnitFamily = 'mass' | 'volume' | 'stk' | 'none'

/** Fridge-editable units (subset of IngredientUnit). */
export const FRIDGE_UNITS = ['stk', 'g', 'kg', 'ml', 'dl', 'l'] as const
export type FridgeUnit = (typeof FRIDGE_UNITS)[number]

export function isFridgeUnit(unit: string | null | undefined): unit is FridgeUnit {
  return FRIDGE_UNITS.includes(unit as FridgeUnit)
}

export function unitFamily(unit: IngredientUnit | FridgeUnit | null): UnitFamily {
  if (unit === 'g' || unit === 'kg') return 'mass'
  if (unit === 'ml' || unit === 'dl' || unit === 'l') return 'volume'
  if (unit === 'stk') return 'stk'
  return 'none'
}

/** Convert to canonical base within a family (g, ml, or stk). */
export function toBaseAmount(
  quantity: number,
  unit: IngredientUnit | FridgeUnit,
): { family: UnitFamily; base: number } | null {
  if (!Number.isFinite(quantity)) return null
  if (unit === 'g') return { family: 'mass', base: quantity }
  if (unit === 'kg') return { family: 'mass', base: quantity * 1000 }
  if (unit === 'ml') return { family: 'volume', base: quantity }
  if (unit === 'dl') return { family: 'volume', base: quantity * 100 }
  if (unit === 'l') return { family: 'volume', base: quantity * 1000 }
  if (unit === 'stk') return { family: 'stk', base: quantity }
  return null
}

/**
 * Compare fridge amount vs needed amount with safe conversions only.
 * Returns null when comparison is impossible (unknown / incompatible units).
 */
export function compareAmounts(
  haveQty: number | null | undefined,
  haveUnit: IngredientUnit | FridgeUnit | null | undefined,
  needQty: number | null | undefined,
  needUnit: IngredientUnit | null | undefined,
): 'enough' | 'partial' | 'unknown' {
  if (haveQty == null || haveUnit == null || needQty == null || needUnit == null) {
    return 'unknown'
  }
  const have = toBaseAmount(haveQty, haveUnit)
  const need = toBaseAmount(needQty, needUnit)
  if (!have || !need) return 'unknown'
  if (have.family !== need.family || have.family === 'none') return 'unknown'
  if (have.base + 1e-9 >= need.base) return 'enough'
  return 'partial'
}

export function formatAmountLabel(
  quantity: number | null | undefined,
  unit: IngredientUnit | FridgeUnit | null | undefined,
  formatQty: (n: number) => string,
): string | null {
  if (quantity == null || !Number.isFinite(quantity)) return null
  const q = formatQty(quantity)
  if (!unit) return q
  return `${q} ${unit}`
}
