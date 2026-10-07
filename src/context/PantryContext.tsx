import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { normalizeIngredientName } from '../utils/matchPantryRecipes'

const STORAGE_KEY = 'fgtg-hjemme-pantry-v1'

type PantryContextValue = {
  pantry: string[]
  addItem: (raw: string, knownNames?: string[]) => 'added' | 'duplicate' | 'empty'
  removeItem: (name: string) => void
  clear: () => void
}

const PantryContext = createContext<PantryContextValue | null>(null)

function loadPantry(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => String(item).trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

export function PantryProvider({ children }: { children: ReactNode }) {
  const [pantry, setPantry] = useState<string[]>(() => loadPantry())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pantry))
    } catch {
      /* ignore quota / private mode */
    }
  }, [pantry])

  const addItem = useCallback(
    (raw: string, knownNames: string[] = []) => {
      const trimmed = raw.trim()
      if (!trimmed) return 'empty' as const
      const key = normalizeIngredientName(trimmed)
      const known = knownNames.find(
        (name) => normalizeIngredientName(name) === key,
      )
      const label = known ?? trimmed
      if (
        pantry.some((item) => normalizeIngredientName(item) === key)
      ) {
        return 'duplicate' as const
      }
      setPantry((prev) => [...prev, label])
      return 'added' as const
    },
    [pantry],
  )

  const removeItem = useCallback((name: string) => {
    const key = normalizeIngredientName(name)
    setPantry((prev) =>
      prev.filter((item) => normalizeIngredientName(item) !== key),
    )
  }, [])

  const clear = useCallback(() => setPantry([]), [])

  const value = useMemo(
    () => ({ pantry, addItem, removeItem, clear }),
    [pantry, addItem, removeItem, clear],
  )

  return (
    <PantryContext.Provider value={value}>{children}</PantryContext.Provider>
  )
}

export function usePantry() {
  const ctx = useContext(PantryContext)
  if (!ctx) throw new Error('usePantry must be used within PantryProvider')
  return ctx
}
