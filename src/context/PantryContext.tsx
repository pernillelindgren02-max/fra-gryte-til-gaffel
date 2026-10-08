import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { slugifyIngredientId } from '../i18n/content'
import { normalizeIngredientName } from '../utils/matchPantryRecipes'
import {
  FRIDGE_UNITS,
  isFridgeUnit,
  type FridgeUnit,
} from '../utils/unitConvert'

/** Keep legacy key so existing Hjemme inventory is not lost. */
const STORAGE_KEY = 'fgtg-hjemme-pantry-v1'

export type FridgeItem = {
  /** Canonical id — language-independent matching. */
  id: string
  /** Display label as the user added it. */
  name: string
  /** Optional amount — null = quantity unknown. */
  quantity: number | null
  /** Optional unit — null when quantity unknown / not set. */
  unit: FridgeUnit | null
}

export type FridgeItemInput = {
  name: string
  canonicalId?: string
  quantity?: number | null
  unit?: FridgeUnit | null
}

type PantryContextValue = {
  pantry: FridgeItem[]
  pantryNames: string[]
  addItem: (
    raw: string,
    knownNames?: string[],
    canonicalId?: string,
    quantity?: number | null,
    unit?: FridgeUnit | null,
  ) => 'added' | 'duplicate' | 'empty'
  updateItem: (
    id: string,
    patch: Partial<Pick<FridgeItem, 'name' | 'quantity' | 'unit'>>,
  ) => void
  removeItem: (idOrName: string) => void
  clear: () => void
  hasIngredient: (idOrName: string) => boolean
  getItem: (idOrName: string) => FridgeItem | null
}

const PantryContext = createContext<PantryContextValue | null>(null)

function parseQuantity(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 1000) / 1000
}

function parseUnit(value: unknown): FridgeUnit | null {
  if (value == null || value === '') return null
  const u = String(value).trim().toLowerCase()
  return isFridgeUnit(u) ? u : null
}

function toItem(raw: unknown): FridgeItem | null {
  if (typeof raw === 'string') {
    const name = raw.trim()
    if (!name) return null
    return {
      id: slugifyIngredientId(name),
      name,
      quantity: null,
      unit: null,
    }
  }
  if (raw && typeof raw === 'object') {
    const row = raw as {
      id?: unknown
      name?: unknown
      quantity?: unknown
      unit?: unknown
    }
    const name = String(row.name ?? '').trim()
    const id =
      String(row.id ?? '').trim() || (name ? slugifyIngredientId(name) : '')
    if (!name && !id) return null
    let quantity = parseQuantity(row.quantity)
    let unit = parseUnit(row.unit)
    // Quantity without unit (or vice versa) → treat as unknown amount.
    if (quantity == null || unit == null) {
      quantity = null
      unit = null
    }
    return {
      id: id || slugifyIngredientId(name),
      name: name || id,
      quantity,
      unit,
    }
  }
  return null
}

function loadPantry(): FridgeItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const items: FridgeItem[] = []
    const seen = new Set<string>()
    for (const entry of parsed) {
      const item = toItem(entry)
      if (!item) continue
      const key = item.id || normalizeIngredientName(item.name)
      if (seen.has(key)) continue
      seen.add(key)
      items.push(item)
    }
    return items
  } catch {
    return []
  }
}

export function PantryProvider({ children }: { children: ReactNode }) {
  const [pantry, setPantry] = useState<FridgeItem[]>(() => loadPantry())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pantry))
    } catch {
      /* ignore quota / private mode */
    }
  }, [pantry])

  const addItem = useCallback(
    (
      raw: string,
      knownNames: string[] = [],
      canonicalId?: string,
      quantity?: number | null,
      unit?: FridgeUnit | null,
    ) => {
      const trimmed = raw.trim()
      if (!trimmed) return 'empty' as const
      const key = normalizeIngredientName(trimmed)
      const known = knownNames.find(
        (name) => normalizeIngredientName(name) === key,
      )
      const label = known ?? trimmed
      const id = (canonicalId || slugifyIngredientId(label)).trim()
      if (
        pantry.some(
          (item) =>
            item.id === id ||
            normalizeIngredientName(item.name) === key ||
            normalizeIngredientName(item.id) === key,
        )
      ) {
        return 'duplicate' as const
      }
      let qty = quantity ?? null
      let u = unit ?? null
      if (qty == null || u == null || !isFridgeUnit(u)) {
        qty = null
        u = null
      }
      setPantry((prev) => [
        ...prev,
        { id, name: label, quantity: qty, unit: u },
      ])
      return 'added' as const
    },
    [pantry],
  )

  const updateItem = useCallback(
    (
      id: string,
      patch: Partial<Pick<FridgeItem, 'name' | 'quantity' | 'unit'>>,
    ) => {
      setPantry((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item
          let quantity =
            patch.quantity !== undefined ? patch.quantity : item.quantity
          let unit = patch.unit !== undefined ? patch.unit : item.unit
          if (quantity == null || unit == null || !isFridgeUnit(unit)) {
            quantity = null
            unit = null
          }
          return {
            ...item,
            name: patch.name?.trim() || item.name,
            quantity,
            unit,
          }
        }),
      )
    },
    [],
  )

  const removeItem = useCallback((idOrName: string) => {
    const key = normalizeIngredientName(idOrName)
    const slug = slugifyIngredientId(idOrName)
    setPantry((prev) =>
      prev.filter(
        (item) =>
          item.id !== idOrName &&
          item.id !== slug &&
          normalizeIngredientName(item.name) !== key &&
          normalizeIngredientName(item.id) !== key,
      ),
    )
  }, [])

  const clear = useCallback(() => setPantry([]), [])

  const hasIngredient = useCallback(
    (idOrName: string) => {
      const key = normalizeIngredientName(idOrName)
      const slug = slugifyIngredientId(idOrName)
      return pantry.some(
        (item) =>
          item.id === idOrName ||
          item.id === slug ||
          normalizeIngredientName(item.name) === key ||
          normalizeIngredientName(item.id) === key,
      )
    },
    [pantry],
  )

  const getItem = useCallback(
    (idOrName: string) => {
      const key = normalizeIngredientName(idOrName)
      const slug = slugifyIngredientId(idOrName)
      return (
        pantry.find(
          (item) =>
            item.id === idOrName ||
            item.id === slug ||
            normalizeIngredientName(item.name) === key ||
            normalizeIngredientName(item.id) === key,
        ) ?? null
      )
    },
    [pantry],
  )

  const pantryNames = useMemo(() => pantry.map((item) => item.name), [pantry])

  const value = useMemo(
    () => ({
      pantry,
      pantryNames,
      addItem,
      updateItem,
      removeItem,
      clear,
      hasIngredient,
      getItem,
    }),
    [
      pantry,
      pantryNames,
      addItem,
      updateItem,
      removeItem,
      clear,
      hasIngredient,
      getItem,
    ],
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

export { FRIDGE_UNITS }
export type { FridgeUnit }
