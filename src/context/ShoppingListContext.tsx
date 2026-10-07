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
import {
  combineIngredients,
  type CombinedIngredient,
} from '../utils/combineIngredients'
import { useRecipes } from './RecipesContext'

const STORAGE_KEY = 'fgtg-shopping-list-v2'

/** Scale vs recipe base ingredients (1 = as written). May be fractional e.g. 1.5. */
export type ShoppingMultiplier = number

export type ShoppingListEntry = {
  recipeId: string
  multiplier: ShoppingMultiplier
}

function normalizeMultiplier(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 1
  return Math.round(n * 1000) / 1000
}

type ShoppingListState = {
  entries: ShoppingListEntry[]
  checkedKeys: string[]
}

type ShoppingListContextValue = {
  entries: ShoppingListEntry[]
  recipeIds: string[]
  checkedKeys: Set<string>
  combined: CombinedIngredient[]
  addRecipe: (
    recipeId: string,
    multiplier?: ShoppingMultiplier,
  ) => 'added' | 'duplicate' | 'missing'
  removeRecipe: (recipeId: string) => void
  setMultiplier: (recipeId: string, multiplier: ShoppingMultiplier) => void
  clearAll: () => void
  toggleChecked: (key: string) => void
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

function loadState(): ShoppingListState {
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
            }))
        : []
      return {
        entries,
        checkedKeys: Array.isArray(parsed.checkedKeys)
          ? parsed.checkedKeys
          : [],
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
        checkedKeys: Array.isArray(parsed.checkedKeys)
          ? parsed.checkedKeys
          : [],
      }
    }
  } catch {
    /* ignore */
  }
  return { entries: [], checkedKeys: [] }
}

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const { getById } = useRecipes()
  const initial = loadState()
  const [entries, setEntries] = useState<ShoppingListEntry[]>(initial.entries)
  const [checkedKeys, setCheckedKeys] = useState<string[]>(initial.checkedKeys)

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ entries, checkedKeys } satisfies ShoppingListState),
    )
  }, [entries, checkedKeys])

  const recipeIds = useMemo(
    () => entries.map((entry) => entry.recipeId),
    [entries],
  )

  const combined = useMemo(() => {
    const ingredients = entries.flatMap((entry) => {
      const recipe = getById(entry.recipeId)
      if (!recipe) return []
      return recipe.ingredients.map((ingredient) =>
        scaleIngredient(ingredient, entry.multiplier),
      )
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
    },
    [],
  )

  const clearAll = useCallback(() => {
    setEntries([])
    setCheckedKeys([])
  }, [])

  const toggleChecked = useCallback((key: string) => {
    setCheckedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }, [])

  const value = useMemo<ShoppingListContextValue>(
    () => ({
      entries,
      recipeIds,
      checkedKeys: new Set(checkedKeys),
      combined,
      addRecipe,
      removeRecipe,
      setMultiplier,
      clearAll,
      toggleChecked,
      hasRecipe: (id) => entries.some((entry) => entry.recipeId === id),
      getMultiplier: (id) =>
        entries.find((entry) => entry.recipeId === id)?.multiplier ?? 1,
    }),
    [
      entries,
      recipeIds,
      checkedKeys,
      combined,
      addRecipe,
      removeRecipe,
      setMultiplier,
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
