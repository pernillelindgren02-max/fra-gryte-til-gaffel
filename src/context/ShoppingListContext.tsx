import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getRecipeById } from '../data/recipes'
import {
  combineIngredients,
  type CombinedIngredient,
} from '../utils/combineIngredients'

const STORAGE_KEY = 'fgtg-shopping-list-v1'

type ShoppingListState = {
  recipeIds: string[]
  checkedKeys: string[]
}

type ShoppingListContextValue = {
  recipeIds: string[]
  checkedKeys: Set<string>
  combined: CombinedIngredient[]
  addRecipe: (recipeId: string) => 'added' | 'duplicate' | 'missing'
  removeRecipe: (recipeId: string) => void
  clearAll: () => void
  toggleChecked: (key: string) => void
  hasRecipe: (recipeId: string) => boolean
}

const ShoppingListContext = createContext<ShoppingListContextValue | null>(null)

function loadState(): ShoppingListState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { recipeIds: [], checkedKeys: [] }
    const parsed = JSON.parse(raw) as ShoppingListState
    return {
      recipeIds: Array.isArray(parsed.recipeIds) ? parsed.recipeIds : [],
      checkedKeys: Array.isArray(parsed.checkedKeys) ? parsed.checkedKeys : [],
    }
  } catch {
    return { recipeIds: [], checkedKeys: [] }
  }
}

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const [recipeIds, setRecipeIds] = useState<string[]>(() => loadState().recipeIds)
  const [checkedKeys, setCheckedKeys] = useState<string[]>(
    () => loadState().checkedKeys,
  )

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ recipeIds, checkedKeys } satisfies ShoppingListState),
    )
  }, [recipeIds, checkedKeys])

  const combined = useMemo(() => {
    const ingredients = recipeIds.flatMap((id) => {
      const recipe = getRecipeById(id)
      return recipe?.ingredients ?? []
    })
    return combineIngredients(ingredients)
  }, [recipeIds])

  const addRecipe = useCallback(
    (recipeId: string) => {
      if (!getRecipeById(recipeId)) return 'missing' as const
      if (recipeIds.includes(recipeId)) return 'duplicate' as const
      setRecipeIds((prev) =>
        prev.includes(recipeId) ? prev : [...prev, recipeId],
      )
      return 'added' as const
    },
    [recipeIds],
  )

  const removeRecipe = useCallback((recipeId: string) => {
    setRecipeIds((prev) => prev.filter((id) => id !== recipeId))
  }, [])

  const clearAll = useCallback(() => {
    setRecipeIds([])
    setCheckedKeys([])
  }, [])

  const toggleChecked = useCallback((key: string) => {
    setCheckedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }, [])

  const value = useMemo<ShoppingListContextValue>(
    () => ({
      recipeIds,
      checkedKeys: new Set(checkedKeys),
      combined,
      addRecipe,
      removeRecipe,
      clearAll,
      toggleChecked,
      hasRecipe: (id) => recipeIds.includes(id),
    }),
    [
      recipeIds,
      checkedKeys,
      combined,
      addRecipe,
      removeRecipe,
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
