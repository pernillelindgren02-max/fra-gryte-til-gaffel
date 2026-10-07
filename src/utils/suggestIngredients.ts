import { normalizeIngredientName } from './matchPantryRecipes'

const SUGGESTION_LIMIT = 8

/** Common camping/kitchen staples — preferred when the field is empty. */
const COMMON_INGREDIENTS = [
  'Egg',
  'Gulrot',
  'Løk',
  'Hvitløk',
  'Potet',
  'Ris',
  'Pasta',
  'Olje',
  'Smør',
  'Melk',
  'Ost',
  'Feta',
  'Tomat',
  'Agurk',
  'Paprika',
  'Kylling',
  'Kjøttdeig',
  'Bønner',
  'Kikerter',
  'Hermetiske tomater',
  'Havregryn',
  'Brød',
  'Sitron',
  'Salt',
  'Pepper',
] as const

export type IngredientSuggestion = {
  name: string
  selected: boolean
}

function normalizeForMatch(value: string): string {
  // Case-insensitive; æ/ø/å lowercased correctly by toLowerCase for nb.
  return normalizeIngredientName(value)
}

function rankMatch(name: string, query: string): number | null {
  const n = normalizeForMatch(name)
  const q = normalizeForMatch(query)
  if (!q) return null
  if (n === q) return 0
  if (n.startsWith(q)) return 1
  if (n.includes(q)) return 2
  return null
}

/**
 * Ranked ingredient suggestions for Hjemme autocomplete.
 * Empty query → common staples present in the library (else alphabetical).
 * Rank while typing: exact → starts-with → contains. Case-insensitive + æ/ø/å.
 */
export function suggestIngredients(
  knownNames: string[],
  query: string,
  selectedNames: string[],
  limit = SUGGESTION_LIMIT,
): IngredientSuggestion[] {
  const selected = new Set(
    selectedNames.map(normalizeForMatch).filter(Boolean),
  )
  const trimmed = query.trim()

  if (!trimmed) {
    const knownByNorm = new Map(
      knownNames.map((name) => [normalizeForMatch(name), name]),
    )
    const commonHits: string[] = []
    for (const staple of COMMON_INGREDIENTS) {
      const hit = knownByNorm.get(normalizeForMatch(staple))
      if (hit && !selected.has(normalizeForMatch(hit))) {
        commonHits.push(hit)
      }
    }

    const alphabetical = [...knownNames]
      .filter((name) => !selected.has(normalizeForMatch(name)))
      .sort((a, b) => a.localeCompare(b, 'nb'))

    const seen = new Set<string>()
    const pool: string[] = []
    for (const name of [...commonHits, ...alphabetical]) {
      const key = normalizeForMatch(name)
      if (seen.has(key)) continue
      seen.add(key)
      pool.push(name)
      if (pool.length >= limit) break
    }

    return pool.map((name) => ({ name, selected: false }))
  }

  const scored: { name: string; rank: number; selected: boolean }[] = []
  for (const name of knownNames) {
    const rank = rankMatch(name, trimmed)
    if (rank === null) continue
    const isSelected = selected.has(normalizeForMatch(name))
    scored.push({ name, rank, selected: isSelected })
  }

  scored.sort((a, b) => {
    // Prefer unselected, then rank, then alphabetical.
    if (a.selected !== b.selected) return a.selected ? 1 : -1
    if (a.rank !== b.rank) return a.rank - b.rank
    return a.name.localeCompare(b.name, 'nb')
  })

  return scored.slice(0, limit).map(({ name, selected: isSelected }) => ({
    name,
    selected: isSelected,
  }))
}

export { SUGGESTION_LIMIT }
