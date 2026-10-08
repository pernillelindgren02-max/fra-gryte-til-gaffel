import { clampPortions } from '../utils/scalePortions'

const STORAGE_KEY = 'fgtg-recipe-portions-v1'

type PortionMap = Record<string, number>

function loadMap(): PortionMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const out: PortionMap = {}
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      const n = Number(value)
      if (Number.isFinite(n) && n > 0) out[id] = clampPortions(n)
    }
    return out
  } catch {
    return {}
  }
}

function saveMap(map: PortionMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

/** Last user-selected portions for a recipe (Explore + detail sync). */
export function getRememberedPortions(
  recipeId: string,
  baseServings: number,
): number {
  const map = loadMap()
  const remembered = map[recipeId]
  if (remembered != null) return clampPortions(remembered)
  return clampPortions(baseServings > 0 ? baseServings : 2)
}

export function rememberPortions(recipeId: string, portions: number) {
  const map = loadMap()
  map[recipeId] = clampPortions(portions)
  saveMap(map)
}

export function portionsFromMultiplier(
  multiplier: number,
  baseServings: number,
): number {
  const base = baseServings > 0 ? baseServings : 2
  return clampPortions(Math.round(multiplier * base))
}
