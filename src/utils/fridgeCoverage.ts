import { formatQuantityDisplay, type IngredientUnit } from '../data/recipes'
import type { FridgeItem } from '../context/PantryContext'
import type { CombinedIngredient } from './combineIngredients'
import {
  compareAmounts,
  formatAmountLabel,
  type FridgeUnit,
} from './unitConvert'

export type CoverageKind = 'absent' | 'unknown' | 'partial' | 'enough'

export type FridgeCoverage = {
  kind: CoverageKind
  /** Formatted fridge amount when known (for partial helper). */
  haveLabel: string | null
  /** Formatted requirement amount when known. */
  needLabel: string | null
  /** True when ingredient exists in fridge (any qty). */
  inFridge: boolean
}

function findFridgeItem(
  pantry: FridgeItem[],
  ingredientId: string,
  name: string,
): FridgeItem | null {
  const id = ingredientId.trim()
  const nameKey = name.trim().toLowerCase()
  return (
    pantry.find(
      (item) =>
        item.id === id ||
        item.id === nameKey ||
        item.name.trim().toLowerCase() === nameKey ||
        item.name.trim().toLowerCase() === id,
    ) ?? null
  )
}

/**
 * Compare one shopping-list (or recipe) requirement against fridge inventory.
 * Shopping list always keeps the full requirement — this only informs status.
 */
export function evaluateFridgeCoverage(
  pantry: FridgeItem[],
  requirement: {
    ingredientId: string
    name: string
    quantity: number | null
    unit: IngredientUnit
  },
): FridgeCoverage {
  const fridge = findFridgeItem(
    pantry,
    requirement.ingredientId,
    requirement.name,
  )
  if (!fridge) {
    return {
      kind: 'absent',
      haveLabel: null,
      needLabel: formatAmountLabel(
        requirement.quantity,
        requirement.unit,
        formatQuantityDisplay,
      ),
      inFridge: false,
    }
  }

  const needLabel = formatAmountLabel(
    requirement.quantity,
    requirement.unit,
    formatQuantityDisplay,
  )
  const haveLabel = formatAmountLabel(
    fridge.quantity,
    fridge.unit,
    formatQuantityDisplay,
  )

  const cmp = compareAmounts(
    fridge.quantity,
    fridge.unit as FridgeUnit | null,
    requirement.quantity,
    requirement.unit,
  )

  if (cmp === 'enough') {
    return { kind: 'enough', haveLabel, needLabel, inFridge: true }
  }
  if (cmp === 'partial') {
    return { kind: 'partial', haveLabel, needLabel, inFridge: true }
  }
  // Unknown qty on either side, or incompatible units
  return { kind: 'unknown', haveLabel, needLabel, inFridge: true }
}

export function coverageForCombined(
  pantry: FridgeItem[],
  item: CombinedIngredient,
): FridgeCoverage {
  return evaluateFridgeCoverage(pantry, {
    ingredientId: item.ingredientId || item.name,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
  })
}

/** Shopping-list / recipe helper tone for UI. */
export type CoverageHelperTone = 'none' | 'red' | 'subtle'

export type CoverageHelper = {
  tone: CoverageHelperTone
  /** Message key category for i18n. */
  kind: 'none' | 'unknown' | 'partial' | 'enough'
}

/**
 * Helper visibility for shopping list (states A–E).
 * Manual check clears red helpers; enough shows subtle when auto/manual checked.
 */
export function shoppingCoverageHelper(args: {
  coverage: FridgeCoverage
  checked: boolean
  manuallyChecked: boolean
  autoCovered: boolean
}): CoverageHelper {
  const { coverage, checked, manuallyChecked, autoCovered } = args
  if (manuallyChecked) {
    // E: clear red helpers; optional subtle if also enough.
    if (coverage.kind === 'enough') {
      return { tone: 'subtle', kind: 'enough' }
    }
    return { tone: 'none', kind: 'none' }
  }
  if (autoCovered || (checked && coverage.kind === 'enough')) {
    // D
    return { tone: 'subtle', kind: 'enough' }
  }
  if (coverage.kind === 'absent') {
    // A
    return { tone: 'none', kind: 'none' }
  }
  if (coverage.kind === 'unknown') {
    // B
    return { tone: 'red', kind: 'unknown' }
  }
  if (coverage.kind === 'partial') {
    // C
    return { tone: 'red', kind: 'partial' }
  }
  return { tone: 'none', kind: 'none' }
}
