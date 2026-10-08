import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Ingredient } from '../data/recipes'
import { rememberPortions } from '../lib/recipePortions'
import { logTechError } from '../lib/userErrors'
import {
  combineIngredients,
  type CombinedIngredient,
} from '../utils/combineIngredients'
import {
  clampPortions,
  portionMultiplier,
} from '../utils/scalePortions'
import { useRecipes } from './RecipesContext'

const STORAGE_KEY = 'fgtg-shopping-list-v2'

/** Scale vs recipe base ingredients (1 = as written). May be fractional e.g. 1.5. */
export type ShoppingMultiplier = number

export type ShoppingListEntry = {
  recipeId: string
  multiplier: ShoppingMultiplier
  /**
   * Legacy: previously omitted fridge ingredients from the list.
   * Kept in storage for migration only — no longer applied (full requirements).
   */
  excludedIngredientIds?: string[]
}

function normalizeMultiplier(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 1
  return Math.round(n * 1000) / 1000
}

type ShoppingListState = {
  entries: ShoppingListEntry[]
  /** @deprecated Migrated into manualCheckedKeys */
  checkedKeys?: string[]
  /** User explicitly checked — not undone by fridge changes. */
  manualCheckedKeys?: string[]
  /** User explicitly unchecked — overrides auto-enough. */
  manualUncheckedKeys?: string[]
}

type ShoppingListContextValue = {
  entries: ShoppingListEntry[]
  recipeIds: string[]
  /** Keys the user manually checked. */
  manualCheckedKeys: Set<string>
  /** Keys the user manually unchecked (overrides fridge enough). */
  manualUncheckedKeys: Set<string>
  combined: CombinedIngredient[]
  addRecipe: (
    recipeId: string,
    multiplier?: ShoppingMultiplier,
  ) => 'added' | 'duplicate' | 'missing'
  removeRecipe: (recipeId: string) => void
  setMultiplier: (recipeId: string, multiplier: ShoppingMultiplier) => void
  /** Absolute portion count for a listed recipe (synced with detail / Explore). */
  setPortions: (recipeId: string, portions: number, baseServings: number) => void
  getPortions: (recipeId: string, baseServings: number) => number
  clearAll: () => void
  /**
   * Toggle checked state. Pass `currentlyChecked` so we know whether this
   * is a manual check or manual uncheck (vs auto-covered).
   */
  toggleChecked: (key: string, currentlyChecked: boolean) => void
  hasRecipe: (recipeId: string) => boolean
  getMultiplier: (recipeId: string) => ShoppingMultiplier
}

const ShoppingListContext = createContext<ShoppingListContextValue | null>(null)

function scaleIngredient(
  ingredient: Ingredient,
  multiplier: number,
): Ingredient {
  if (ingredient.quantity == null) return ingredient
  return {
    ...ingredient,
    quantity: ingredient.quantity * multiplier,
  }
}

function loadState(): {
  entries: ShoppingListEntry[]
  manualCheckedKeys: string[]
  manualUncheckedKeys: string[]
} {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY)
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as ShoppingListState
      const entries = Array.isArray(parsed.entries)
        ? parsed.entries
            .filter((entry) => Boolean(entry?.recipeId))
            .map((entry) => ({
              recipeId: String(entry.recipeId),
              multiplier: normalizeMultiplier(entry.multiplier),
              // Preserve legacy field in storage but do not use for filtering.
              excludedIngredientIds: Array.isArray(entry.excludedIngredientIds)
                ? entry.excludedIngredientIds.map(String)
                : undefined,
            }))
        : []
      const manualChecked = Array.isArray(parsed.manualCheckedKeys)
        ? parsed.manualCheckedKeys.map(String)
        : Array.isArray(parsed.checkedKeys)
          ? parsed.checkedKeys.map(String)
          : []
      const manualUnchecked = Array.isArray(parsed.manualUncheckedKeys)
        ? parsed.manualUncheckedKeys.map(String)
        : []
      return {
        entries,
        manualCheckedKeys: manualChecked,
        manualUncheckedKeys: manualUnchecked,
      }
    }

    // Migrate v1: { recipeIds: string[], checkedKeys: string[] }
    const rawV1 = localStorage.getItem('fgtg-shopping-list-v1')
    if (rawV1) {
      const parsed = JSON.parse(rawV1) as {
        recipeIds?: string[]
        checkedKeys?: string[]
      }
      const ids = Array.isArray(parsed.recipeIds) ? parsed.recipeIds : []
      return {
        entries: ids.map((recipeId) => ({ recipeId, multiplier: 1 as const })),
        manualCheckedKeys: Array.isArray(parsed.checkedKeys)
          ? parsed.checkedKeys
          : [],
        manualUncheckedKeys: [],
      }
    }
  } catch {
    /* ignore */
  }
  return { entries: [], manualCheckedKeys: [], manualUncheckedKeys: [] }
}

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const { getById } = useRecipes()
  const initial = loadState()
  const [entries, setEntries] = useState<ShoppingListEntry[]>(initial.entries)
  const [manualCheckedKeys, setManualCheckedKeys] = useState<string[]>(
    initial.manualCheckedKeys,
  )
  const [manualUncheckedKeys, setManualUncheckedKeys] = useState<string[]>(
    initial.manualUncheckedKeys,
  )

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          entries,
          manualCheckedKeys,
          manualUncheckedKeys,
        } satisfies ShoppingListState),
      )
    } catch (err) {
      logTechError('shopping.persist', err)
    }
  }, [entries, manualCheckedKeys, manualUncheckedKeys])

  const recipeIds = useMemo(
    () => entries.map((entry) => entry.recipeId),
    [entries],
  )

  /** Full recipe requirements — fridge never removes rows. */
  const combined = useMemo(() => {
    const ingredients = entries.flatMap((entry) => {
      const recipe = getById(entry.recipeId)
      if (!recipe) return []
      return recipe.ingredients.map((ingredient) => ({
        ...scaleIngredient(ingredient, entry.multiplier),
        sourceRecipeId: recipe.id,
        sourceRecipeName: recipe.name,
      }))
    })
    return combineIngredients(ingredients)
  }, [entries, getById])

  const addRecipe = useCallback(
    (recipeId: string, multiplier: ShoppingMultiplier = 1) => {
      if (!getById(recipeId)) return 'missing' as const
      if (entries.some((entry) => entry.recipeId === recipeId)) {
        return 'duplicate' as const
      }
      const scale = normalizeMultiplier(multiplier)
      setEntries((prev) =>
        prev.some((entry) => entry.recipeId === recipeId)
          ? prev
          : [...prev, { recipeId, multiplier: scale }],
      )
      return 'added' as const
    },
    [entries, getById],
  )

  const removeRecipe = useCallback((recipeId: string) => {
    setEntries((prev) => prev.filter((entry) => entry.recipeId !== recipeId))
  }, [])

  const setMultiplier = useCallback(
    (recipeId: string, multiplier: ShoppingMultiplier) => {
      const scale = normalizeMultiplier(multiplier)
      setEntries((prev) =>
        prev.map((entry) =>
          entry.recipeId === recipeId
            ? { ...entry, multiplier: scale }
            : entry,
        ),
      )
      const recipe = getById(recipeId)
      if (recipe) {
        const base = recipe.servings > 0 ? recipe.servings : 2
        rememberPortions(recipeId, clampPortions(Math.round(scale * base)))
      }
    },
    [getById],
  )

  const setPortions = useCallback(
    (recipeId: string, portions: number, baseServings: number) => {
      const next = clampPortions(portions)
      const scale = portionMultiplier(next, baseServings)
      rememberPortions(recipeId, next)
      setEntries((prev) =>
        prev.map((entry) =>
          entry.recipeId === recipeId
            ? { ...entry, multiplier: scale }
            : entry,
        ),
      )
    },
    [],
  )

  const getPortions = useCallback(
    (recipeId: string, baseServings: number) => {
      const entry = entries.find((e) => e.recipeId === recipeId)
      const base = baseServings > 0 ? baseServings : 2
      if (!entry) return clampPortions(base)
      return clampPortions(Math.round(entry.multiplier * base))
    },
    [entries],
  )

  const clearAll = useCallback(() => {
    setEntries([])
    setManualCheckedKeys([])
    setManualUncheckedKeys([])
  }, [])

  const toggleChecked = useCallback((key: string, currentlyChecked: boolean) => {
    if (currentlyChecked) {
      // Manual uncheck — overrides auto-enough going forward.
      setManualCheckedKeys((prev) => prev.filter((k) => k !== key))
      setManualUncheckedKeys((prev) =>
        prev.includes(key) ? prev : [...prev, key],
      )
    } else {
      // Manual check — survives fridge changes; clears red helpers in UI.
      setManualUncheckedKeys((prev) => prev.filter((k) => k !== key))
      setManualCheckedKeys((prev) =>
        prev.includes(key) ? prev : [...prev, key],
      )
    }
  }, [])

  const value = useMemo<ShoppingListContextValue>(
    () => ({
      entries,
      recipeIds,
      manualCheckedKeys: new Set(manualCheckedKeys),
      manualUncheckedKeys: new Set(manualUncheckedKeys),
      combined,
      addRecipe,
      removeRecipe,
      setMultiplier,
      setPortions,
      getPortions,
      clearAll,
      toggleChecked,
      hasRecipe: (id) => entries.some((entry) => entry.recipeId === id),
      getMultiplier: (id) =>
        entries.find((entry) => entry.recipeId === id)?.multiplier ?? 1,
    }),
    [
      entries,
      recipeIds,
      manualCheckedKeys,
      manualUncheckedKeys,
      combined,
      addRecipe,
      removeRecipe,
      setMultiplier,
      setPortions,
      getPortions,
      clearAll,
      toggleChecked,
    ],
  )

  return (
    <ShoppingListContext.Provider value={value}>
      {children}
    </ShoppingListContext.Provider>
  )
}

export function useShoppingList() {
  const ctx = useContext(ShoppingListContext)
  if (!ctx) {
    throw new Error('useShoppingList must be used within ShoppingListProvider')
  }
  return ctx
}

/**
 * Resolve checkbox + helper state for one shopping-list row.
 * Manual overrides always win over fridge auto-coverage.
 */
export function resolveShoppingItemCheck(args: {
  key: string
  coverageKind: 'absent' | 'unknown' | 'partial' | 'enough'
  manualChecked: boolean
  manualUnchecked: boolean
}): {
  checked: boolean
  /** Auto-covered by fridge enough (and not manually unchecked). */
  autoCovered: boolean
  /** User manually checked (not fridge-driven). */
  manuallyChecked: boolean
} {
  const { coverageKind, manualChecked, manualUnchecked } = args
  if (manualUnchecked) {
    return { checked: false, autoCovered: false, manuallyChecked: false }
  }
  if (manualChecked) {
    return {
      checked: true,
      autoCovered: false,
      manuallyChecked: true,
    }
  }
  if (coverageKind === 'enough') {
    return { checked: true, autoCovered: true, manuallyChecked: false }
  }
  return { checked: false, autoCovered: false, manuallyChecked: false }
}
