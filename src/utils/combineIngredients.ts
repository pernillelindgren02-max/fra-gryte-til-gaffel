import {
  formatQuantityDisplay,
  type Ingredient,
  type IngredientUnit,
} from '../data/recipes'

type UnitFamily = 'mass' | 'volume' | 'stk' | 'ss' | 'ts' | 'none'

function familyOf(unit: IngredientUnit): UnitFamily {
  if (unit === 'g' || unit === 'kg') return 'mass'
  if (unit === 'ml' || unit === 'dl' || unit === 'l') return 'volume'
  if (unit === 'stk') return 'stk'
  if (unit === 'ss') return 'ss'
  if (unit === 'ts') return 'ts'
  return 'none'
}

/** Convert to a canonical amount within a unit family. */
function toBase(quantity: number, unit: IngredientUnit): number | null {
  if (unit === 'g') return quantity
  if (unit === 'kg') return quantity * 1000
  if (unit === 'ml') return quantity
  if (unit === 'dl') return quantity * 100
  if (unit === 'l') return quantity * 1000
  if (unit === 'stk' || unit === 'ss' || unit === 'ts') return quantity
  return null
}

function fromBase(base: number, family: UnitFamily): { quantity: number; unit: IngredientUnit } {
  if (family === 'mass') {
    if (base >= 1000 && base % 1000 === 0) {
      return { quantity: base / 1000, unit: 'kg' }
    }
    return { quantity: base, unit: 'g' }
  }
  if (family === 'volume') {
    if (base >= 1000 && base % 1000 === 0) {
      return { quantity: base / 1000, unit: 'l' }
    }
    if (base >= 100 && base % 100 === 0) {
      return { quantity: base / 100, unit: 'dl' }
    }
    return { quantity: base, unit: 'ml' }
  }
  if (family === 'stk') return { quantity: base, unit: 'stk' }
  if (family === 'ss') return { quantity: base, unit: 'ss' }
  if (family === 'ts') return { quantity: base, unit: 'ts' }
  return { quantity: base, unit: null }
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

export type SourcedIngredient = Ingredient & {
  sourceRecipeId?: string
  sourceRecipeName?: string
}

export interface CombinedIngredientSource {
  id: string
  name: string
}

export interface CombinedIngredient {
  key: string
  name: string
  quantity: number | null
  unit: IngredientUnit
  label: string
  fromRecipes: CombinedIngredientSource[]
}

function addSource(
  list: CombinedIngredientSource[],
  id?: string,
  name?: string,
) {
  if (!id || !name) return
  if (list.some((item) => item.id === id)) return
  list.push({ id, name })
}

export function combineIngredients(
  ingredients: SourcedIngredient[],
): CombinedIngredient[] {
  type Acc = {
    name: string
    family: UnitFamily
    baseTotal: number | null
    unit: IngredientUnit
    qualitative: boolean
    fromRecipes: CombinedIngredientSource[]
  }

  const map = new Map<string, Acc>()

  for (const item of ingredients) {
    // Aggregate by canonical id when present — language-independent.
    const nameKey = normalizeName(item.id || item.name)
    const family = familyOf(item.unit)

    if (
      item.quantity == null ||
      item.unit == null ||
      family === 'none' ||
      toBase(item.quantity, item.unit) == null
    ) {
      const key = `${nameKey}::none`
      const existing = map.get(key)
      if (!existing) {
        const fromRecipes: CombinedIngredientSource[] = []
        addSource(fromRecipes, item.sourceRecipeId, item.sourceRecipeName)
        map.set(key, {
          name: item.name,
          family: 'none',
          baseTotal: null,
          unit: null,
          qualitative: true,
          fromRecipes,
        })
      } else {
        addSource(existing.fromRecipes, item.sourceRecipeId, item.sourceRecipeName)
      }
      continue
    }

    const base = toBase(item.quantity, item.unit)!
    const key = `${nameKey}::${family}`
    const existing = map.get(key)
    if (!existing) {
      const fromRecipes: CombinedIngredientSource[] = []
      addSource(fromRecipes, item.sourceRecipeId, item.sourceRecipeName)
      map.set(key, {
        name: item.name,
        family,
        baseTotal: base,
        unit: item.unit,
        qualitative: false,
        fromRecipes,
      })
    } else {
      if (existing.baseTotal != null) existing.baseTotal += base
      addSource(existing.fromRecipes, item.sourceRecipeId, item.sourceRecipeName)
    }
  }

  return [...map.entries()]
    .map(([key, value]) => {
      const fromRecipes = [...value.fromRecipes].sort((a, b) =>
        a.name.localeCompare(b.name, 'nb'),
      )
      if (value.qualitative || value.baseTotal == null) {
        return {
          key,
          name: value.name,
          quantity: null,
          unit: null,
          label: value.name,
          fromRecipes,
        }
      }
      const converted = fromBase(value.baseTotal, value.family)
      const label = `${formatQuantityDisplay(converted.quantity)} ${converted.unit} ${value.name}`
      return {
        key,
        name: value.name,
        quantity: converted.quantity,
        unit: converted.unit,
        label,
        fromRecipes,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'nb'))
}
