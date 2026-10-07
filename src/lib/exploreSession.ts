import { emptyFilters, type FilterState } from '../data/recipes'

const KEY = 'fgtg-explore-ui-v1'

export type ExploreSessionState = {
  searchQuery: string
  filters: FilterState
  scrollY: number
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
      return { searchQuery: '', filters: emptyFilters, scrollY: 0 }
    }
    const parsed = JSON.parse(raw) as Partial<ExploreSessionState>
    return {
      searchQuery:
        typeof parsed.searchQuery === 'string' ? parsed.searchQuery : '',
      filters: isFilterState(parsed.filters)
        ? { ...emptyFilters, ...parsed.filters }
        : emptyFilters,
      scrollY: typeof parsed.scrollY === 'number' ? parsed.scrollY : 0,
    }
  } catch {
    return { searchQuery: '', filters: emptyFilters, scrollY: 0 }
  }
}

export function saveExploreSession(state: ExploreSessionState) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}
