import { emptyFilters, type FilterState } from '../data/recipes'

const KEY = 'fgtg-explore-ui-v1'
const FREEZE_KEY = 'fgtg-explore-scroll-freeze'

export type ExploreSessionState = {
  searchQuery: string
  filters: FilterState
  scrollY: number
  /** Active horizontal category chip id, or null for home feed. */
  categoryId: string | null
}

function isFilterState(value: unknown): value is FilterState {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return Object.keys(emptyFilters).every((key) => Array.isArray(record[key]))
}

export function loadExploreSession(): ExploreSessionState {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) {
      return {
        searchQuery: '',
        filters: emptyFilters,
        scrollY: 0,
        categoryId: null,
      }
    }
    const parsed = JSON.parse(raw) as Partial<ExploreSessionState>
    return {
      searchQuery:
        typeof parsed.searchQuery === 'string' ? parsed.searchQuery : '',
      filters: isFilterState(parsed.filters)
        ? { ...emptyFilters, ...parsed.filters }
        : emptyFilters,
      scrollY: typeof parsed.scrollY === 'number' ? parsed.scrollY : 0,
      categoryId:
        typeof parsed.categoryId === 'string' && parsed.categoryId
          ? parsed.categoryId
          : null,
    }
  } catch {
    return {
      searchQuery: '',
      filters: emptyFilters,
      scrollY: 0,
      categoryId: null,
    }
  }
}

/** Lock Explore scrollY in sessionStorage so recipe scroll-to-top cannot clobber it. */
export function freezeExploreScroll(scrollY: number) {
  const y = Math.max(0, Math.round(scrollY))
  try {
    sessionStorage.setItem(FREEZE_KEY, String(y))
  } catch {
    /* ignore */
  }
  const current = loadExploreSession()
  saveExploreSession({ ...current, scrollY: y })
}

export function clearExploreScrollFreeze() {
  try {
    sessionStorage.removeItem(FREEZE_KEY)
  } catch {
    /* ignore */
  }
}

function readFrozenScroll(): number | null {
  try {
    const raw = sessionStorage.getItem(FREEZE_KEY)
    if (raw == null || raw === '') return null
    const y = Number(raw)
    return Number.isFinite(y) ? y : null
  } catch {
    return null
  }
}

export function saveExploreSession(state: ExploreSessionState) {
  try {
    const frozen = readFrozenScroll()
    const next: ExploreSessionState = {
      ...state,
      scrollY: frozen !== null ? frozen : state.scrollY,
    }
    sessionStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}
