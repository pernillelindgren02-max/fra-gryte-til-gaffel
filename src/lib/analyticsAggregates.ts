/**
 * Client-side aggregates for Admin → Innsikt.
 * Rates use UNIQUE SESSIONS as denominators (not raw event spam).
 */
import {
  countEvent,
  type AnalyticsEventName,
  type AnalyticsEventRow,
} from './analytics'

/** Min unique viewers before a recipe can be “top performing”. */
export const MIN_RECIPE_SAMPLE = 3

export type RateStat = {
  count: number
  unique: number
  rate: number | null
  rateLabel: string
  sampleNote: string | null
}

export function pct(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(1)}%`
}

export function ppDelta(rate: number | null, avg: number | null): string | null {
  if (rate == null || avg == null || !Number.isFinite(rate) || !Number.isFinite(avg)) {
    return null
  }
  const d = (rate - avg) * 100
  const sign = d > 0 ? '+' : ''
  return `${sign}${d.toFixed(1)} pp vs snitt`
}

function rateFrom(uniqueNum: number, uniqueDen: number): RateStat {
  const rate = uniqueDen > 0 ? uniqueNum / uniqueDen : null
  const sampleNote =
    uniqueDen > 0 && uniqueDen < MIN_RECIPE_SAMPLE
      ? `kun ${uniqueDen} seer${uniqueDen === 1 ? '' : 'e'}`
      : null
  return {
    count: uniqueNum,
    unique: uniqueNum,
    rate,
    rateLabel: rate == null ? '—' : pct(rate),
    sampleNote,
  }
}

export function formatCountRate(
  count: number,
  rate: number | null,
  verb: string,
  sampleNote?: string | null,
): string {
  const ratePart = rate == null ? '' : ` · ${pct(rate)}`
  const sample = sampleNote ? ` (${sampleNote})` : ''
  return `${count} ${verb}${ratePart}${sample}`
}

function sessionsFor(
  events: AnalyticsEventRow[],
  name: AnalyticsEventName | AnalyticsEventName[],
  recipeId?: string,
): Set<string> {
  const set = new Set(Array.isArray(name) ? name : [name])
  const out = new Set<string>()
  for (const e of events) {
    if (!set.has(e.event_name as AnalyticsEventName)) continue
    if (recipeId && e.recipe_id !== recipeId) continue
    out.add(e.anonymous_session_id)
  }
  return out
}

export type RecipeIntel = {
  recipe_id: string
  views: number
  unique_viewers: number
  favorites: number
  unique_favoriters: number
  fav_rate: number | null
  shopping: number
  unique_shoppers: number
  shop_rate: number | null
  shares: number
  unique_sharers: number
  share_rate: number | null
  spotify: number
  unique_spotify: number
  spotify_rate: number | null
  notes: number
  unique_noters: number
  note_rate: number | null
  repeat_viewers: number
  repeat_rate: number | null
  sample_ok: boolean
  sample_note: string | null
  top_source: string | null
  sources: Record<string, number>
}

export type RecipeBenchmarks = {
  fav_rate: number | null
  shop_rate: number | null
  share_rate: number | null
  spotify_rate: number | null
  note_rate: number | null
  repeat_rate: number | null
}

export type RecipeSortKey =
  | 'views'
  | 'favorites'
  | 'fav_rate'
  | 'shopping'
  | 'shop_rate'
  | 'share_rate'
  | 'repeat_rate'

export function buildRecipeIntelligence(
  events: AnalyticsEventRow[],
): { recipes: RecipeIntel[]; benchmarks: RecipeBenchmarks } {
  type Acc = {
    views: number
    viewers: Set<string>
    viewCounts: Map<string, number>
    favorites: number
    favoriters: Set<string>
    shopping: number
    shoppers: Set<string>
    shares: number
    sharers: Set<string>
    spotify: number
    spotifySessions: Set<string>
    notes: number
    noters: Set<string>
    sources: Map<string, number>
  }

  const map = new Map<string, Acc>()

  function acc(id: string): Acc {
    let cur = map.get(id)
    if (!cur) {
      cur = {
        views: 0,
        viewers: new Set(),
        viewCounts: new Map(),
        favorites: 0,
        favoriters: new Set(),
        shopping: 0,
        shoppers: new Set(),
        shares: 0,
        sharers: new Set(),
        spotify: 0,
        spotifySessions: new Set(),
        notes: 0,
        noters: new Set(),
        sources: new Map(),
      }
      map.set(id, cur)
    }
    return cur
  }

  for (const e of events) {
    if (!e.recipe_id) continue
    const cur = acc(e.recipe_id)
    const sid = e.anonymous_session_id
    switch (e.event_name) {
      case 'recipe_view': {
        cur.views += 1
        cur.viewers.add(sid)
        cur.viewCounts.set(sid, (cur.viewCounts.get(sid) ?? 0) + 1)
        const src = e.source ?? 'unknown'
        cur.sources.set(src, (cur.sources.get(src) ?? 0) + 1)
        break
      }
      case 'recipe_favorite_add':
        cur.favorites += 1
        cur.favoriters.add(sid)
        break
      case 'recipe_shopping_add':
        cur.shopping += 1
        cur.shoppers.add(sid)
        break
      case 'recipe_share':
        cur.shares += 1
        cur.sharers.add(sid)
        break
      case 'recipe_spotify_open':
        cur.spotify += 1
        cur.spotifySessions.add(sid)
        break
      case 'note_save':
        cur.notes += 1
        cur.noters.add(sid)
        break
      default:
        break
    }
  }

  const recipes: RecipeIntel[] = [...map.entries()].map(([recipe_id, v]) => {
    const unique_viewers = v.viewers.size
    const repeat_viewers = [...v.viewCounts.values()].filter((n) => n > 1).length
    const fav_rate = unique_viewers > 0 ? v.favoriters.size / unique_viewers : null
    const shop_rate = unique_viewers > 0 ? v.shoppers.size / unique_viewers : null
    const share_rate = unique_viewers > 0 ? v.sharers.size / unique_viewers : null
    const spotify_rate =
      unique_viewers > 0 ? v.spotifySessions.size / unique_viewers : null
    const note_rate = unique_viewers > 0 ? v.noters.size / unique_viewers : null
    const repeat_rate = unique_viewers > 0 ? repeat_viewers / unique_viewers : null
    const sample_ok = unique_viewers >= MIN_RECIPE_SAMPLE
    const sample_note = sample_ok
      ? null
      : unique_viewers === 0
        ? 'ingen seere'
        : `kun ${unique_viewers} seer${unique_viewers === 1 ? '' : 'e'}`

    return {
      recipe_id,
      views: v.views,
      unique_viewers,
      favorites: v.favorites,
      unique_favoriters: v.favoriters.size,
      fav_rate,
      shopping: v.shopping,
      unique_shoppers: v.shoppers.size,
      shop_rate,
      shares: v.shares,
      unique_sharers: v.sharers.size,
      share_rate,
      spotify: v.spotify,
      unique_spotify: v.spotifySessions.size,
      spotify_rate,
      notes: v.notes,
      unique_noters: v.noters.size,
      note_rate,
      repeat_viewers,
      repeat_rate,
      sample_ok,
      sample_note,
      top_source:
        [...v.sources.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      sources: Object.fromEntries(v.sources),
    }
  })

  const withViews = recipes.filter((r) => r.unique_viewers > 0)
  const avg = (pick: (r: RecipeIntel) => number | null) => {
    const vals = withViews
      .map(pick)
      .filter((x): x is number => x != null && Number.isFinite(x))
    if (vals.length === 0) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  const benchmarks: RecipeBenchmarks = {
    fav_rate: avg((r) => r.fav_rate),
    shop_rate: avg((r) => r.shop_rate),
    share_rate: avg((r) => r.share_rate),
    spotify_rate: avg((r) => r.spotify_rate),
    note_rate: avg((r) => r.note_rate),
    repeat_rate: avg((r) => r.repeat_rate),
  }

  return { recipes, benchmarks }
}

export function sortRecipes(
  recipes: RecipeIntel[],
  key: RecipeSortKey,
  opts?: { topOnly?: boolean },
): RecipeIntel[] {
  let list = [...recipes]
  if (opts?.topOnly) {
    list = list.filter((r) => r.sample_ok)
  }
  const rateKeys = new Set<RecipeSortKey>([
    'fav_rate',
    'shop_rate',
    'share_rate',
    'repeat_rate',
  ])
  list.sort((a, b) => {
    const av = a[key] ?? -1
    const bv = b[key] ?? -1
    if (rateKeys.has(key)) {
      // Prefer larger sample when rates tie
      if (bv !== av) return (bv as number) - (av as number)
      return b.unique_viewers - a.unique_viewers
    }
    if (bv !== av) return (bv as number) - (av as number)
    return b.unique_viewers - a.unique_viewers
  })
  return list
}

export function dailySeries(
  events: AnalyticsEventRow[],
): { day: string; count: number; sessions: number }[] {
  const map = new Map<string, { count: number; sessions: Set<string> }>()
  for (const e of events) {
    const day = e.created_at.slice(0, 10)
    const cur = map.get(day) ?? { count: 0, sessions: new Set() }
    cur.count += 1
    cur.sessions.add(e.anonymous_session_id)
    map.set(day, cur)
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, v]) => ({
      day,
      count: v.count,
      sessions: v.sessions.size,
    }))
}

export type FunnelStep = {
  id: string
  label: string
  sessions: number
  conversionFromStart: number | null
  conversionFromPrev: number | null
}

export function buildFunnel(
  events: AnalyticsEventRow[],
  steps: { id: string; label: string; events: AnalyticsEventName[] }[],
): FunnelStep[] {
  const stepSessions = steps.map((s) => sessionsFor(events, s.events))
  const start = stepSessions[0]?.size ?? 0
  return steps.map((s, i) => {
    const n = stepSessions[i].size
    const prev = i === 0 ? null : stepSessions[i - 1].size
    return {
      id: s.id,
      label: s.label,
      sessions: n,
      conversionFromStart: start > 0 ? n / start : null,
      conversionFromPrev: prev && prev > 0 ? n / prev : i === 0 ? 1 : null,
    }
  })
}

export const FUNNELS = {
  discovery: [
    { id: 'explore', label: 'Utforsk', events: ['explore_view'] as AnalyticsEventName[] },
    { id: 'engage', label: 'Søk / filter / kategori', events: ['explore_search', 'explore_filter_apply', 'explore_category_open'] as AnalyticsEventName[] },
    { id: 'click', label: 'Oppskrift-klikk', events: ['explore_recipe_click'] as AnalyticsEventName[] },
    { id: 'save', label: 'Favoritt / handleliste', events: ['recipe_favorite_add', 'recipe_shopping_add'] as AnalyticsEventName[] },
  ],
  hjemme: [
    { id: 'view', label: 'Hjemme åpnet', events: ['pantry_view'] as AnalyticsEventName[] },
    { id: 'add', label: 'Vare lagt til', events: ['pantry_item_add'] as AnalyticsEventName[] },
    { id: 'match', label: 'Match åpnet', events: ['pantry_match_open'] as AnalyticsEventName[] },
    { id: 'shop', label: 'Handleliste', events: ['recipe_shopping_add', 'shopping_add_missing'] as AnalyticsEventName[] },
  ],
  search: [
    { id: 'search', label: 'Søk', events: ['explore_search'] as AnalyticsEventName[] },
    { id: 'open', label: 'Åpnet fra søk', events: ['explore_recipe_click', 'recipe_view'] as AnalyticsEventName[] },
    { id: 'save', label: 'Lagret', events: ['recipe_favorite_add'] as AnalyticsEventName[] },
  ],
  recipe: [
    { id: 'view', label: 'Visning', events: ['recipe_view'] as AnalyticsEventName[] },
    { id: 'engage', label: 'Spotify / porsjoner / notat', events: ['recipe_spotify_open', 'recipe_portions_change', 'note_save'] as AnalyticsEventName[] },
    { id: 'save', label: 'Favoritt', events: ['recipe_favorite_add'] as AnalyticsEventName[] },
    { id: 'shop', label: 'Handleliste', events: ['recipe_shopping_add'] as AnalyticsEventName[] },
  ],
  onboarding: [
    { id: 'step', label: 'Steg sett', events: ['onboarding_step_view'] as AnalyticsEventName[] },
    { id: 'done', label: 'Fullført', events: ['onboarding_complete'] as AnalyticsEventName[] },
  ],
} as const

/** Search funnel refined: only recipe_view with source=search for step 2. */
export function buildSearchFunnel(events: AnalyticsEventRow[]): FunnelStep[] {
  const searchSessions = sessionsFor(events, 'explore_search')
  const openFromSearch = new Set<string>()
  const saveAfter = new Set<string>()
  for (const e of events) {
    if (
      (e.event_name === 'recipe_view' || e.event_name === 'explore_recipe_click') &&
      (e.source === 'search' || e.properties?.via === 'search')
    ) {
      openFromSearch.add(e.anonymous_session_id)
    }
  }
  for (const e of events) {
    if (
      e.event_name === 'recipe_favorite_add' &&
      openFromSearch.has(e.anonymous_session_id)
    ) {
      saveAfter.add(e.anonymous_session_id)
    }
  }
  const start = searchSessions.size
  const steps = [
    { id: 'search', label: 'Søk', sessions: start },
    { id: 'open', label: 'Åpnet fra søk', sessions: openFromSearch.size },
    { id: 'save', label: 'Favoritt etter søk', sessions: saveAfter.size },
  ]
  return steps.map((s, i) => ({
    ...s,
    conversionFromStart: start > 0 ? s.sessions / start : null,
    conversionFromPrev:
      i === 0
        ? 1
        : steps[i - 1].sessions > 0
          ? s.sessions / steps[i - 1].sessions
          : null,
  }))
}

export function buildHjemmeConversion(events: AnalyticsEventRow[]): {
  impressions: number
  opens: number
  rate: number | null
  label: string
} {
  const impressions = sessionsFor(events, 'pantry_view').size
  const opens = sessionsFor(events, 'pantry_match_open').size
  const rate = impressions > 0 ? opens / impressions : null
  return {
    impressions,
    opens,
    rate,
    label: formatCountRate(opens, rate, 'åpnet fra Hjemme'),
  }
}

export type PathEdge = { from: string; to: string; count: number; sessions: number }

export function pathTransitions(events: AnalyticsEventRow[]): PathEdge[] {
  const map = new Map<string, { count: number; sessions: Set<string> }>()
  for (const e of events) {
    if (e.event_name !== 'route_view') continue
    const from = (e.from_path || '(start)').slice(0, 80)
    const to = (e.path || '?').slice(0, 80)
    if (from === to) continue
    const key = `${from}→${to}`
    const cur = map.get(key) ?? { count: 0, sessions: new Set() }
    cur.count += 1
    cur.sessions.add(e.anonymous_session_id)
    map.set(key, cur)
  }
  return [...map.entries()]
    .map(([k, v]) => {
      const [from, to] = k.split('→')
      return { from, to, count: v.count, sessions: v.sessions.size }
    })
    .sort((a, b) => b.count - a.count)
}

export function commonPaths(
  events: AnalyticsEventRow[],
  maxLen = 4,
): { path: string; sessions: number }[] {
  const bySession = new Map<string, { t: number; path: string }[]>()
  for (const e of events) {
    if (e.event_name !== 'route_view' || !e.path) continue
    const list = bySession.get(e.anonymous_session_id) ?? []
    list.push({ t: new Date(e.created_at).getTime(), path: e.path })
    bySession.set(e.anonymous_session_id, list)
  }
  const pathCounts = new Map<string, Set<string>>()
  for (const [sid, list] of bySession) {
    const ordered = [...list].sort((a, b) => a.t - b.t).map((x) => x.path)
    const uniq: string[] = []
    for (const p of ordered) {
      if (uniq[uniq.length - 1] !== p) uniq.push(p)
    }
    const slice = uniq.slice(0, maxLen)
    if (slice.length < 2) continue
    const key = slice.join(' → ')
    const set = pathCounts.get(key) ?? new Set()
    set.add(sid)
    pathCounts.set(key, set)
  }
  return [...pathCounts.entries()]
    .map(([path, sessions]) => ({ path, sessions: sessions.size }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 20)
}

export type RetentionResult = {
  cohortDay: string
  size: number
  d1: number | null
  d7: number | null
  d30: number | null
}

export function computeRetention(events: AnalyticsEventRow[]): RetentionResult[] {
  const firstSeen = new Map<string, string>()
  const activeDays = new Map<string, Set<string>>()
  for (const e of events) {
    const day = e.created_at.slice(0, 10)
    const sid = e.anonymous_session_id
    if (!firstSeen.has(sid) || day < (firstSeen.get(sid) as string)) {
      firstSeen.set(sid, day)
    }
    const set = activeDays.get(sid) ?? new Set()
    set.add(day)
    activeDays.set(sid, set)
  }

  const cohorts = new Map<string, string[]>()
  for (const [sid, day] of firstSeen) {
    const list = cohorts.get(day) ?? []
    list.push(sid)
    cohorts.set(day, list)
  }

  const dayMs = 86400000
  function retained(sids: string[], cohortDay: string, offset: number): number {
    const target = new Date(new Date(cohortDay).getTime() + offset * dayMs)
      .toISOString()
      .slice(0, 10)
    let n = 0
    for (const sid of sids) {
      if (activeDays.get(sid)?.has(target)) n += 1
    }
    return n
  }

  const today = new Date().toISOString().slice(0, 10)
  return [...cohorts.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 30)
    .map(([cohortDay, sids]) => {
      const size = sids.length
      const ageDays = Math.floor(
        (new Date(today).getTime() - new Date(cohortDay).getTime()) / dayMs,
      )
      return {
        cohortDay,
        size,
        d1: ageDays >= 1 ? retained(sids, cohortDay, 1) / size : null,
        d7: ageDays >= 7 ? retained(sids, cohortDay, 7) / size : null,
        d30: ageDays >= 30 ? retained(sids, cohortDay, 30) / size : null,
      }
    })
}

export function featureAdoption(
  events: AnalyticsEventRow[],
): { feature: string; sessions: number; rate: number | null }[] {
  const total = new Set(events.map((e) => e.anonymous_session_id)).size
  const features: { feature: string; events: AnalyticsEventName[] }[] = [
    { feature: 'Utforsk', events: ['explore_view'] },
    { feature: 'Søk', events: ['explore_search'] },
    { feature: 'Hjemme', events: ['pantry_view'] },
    { feature: 'Handleliste', events: ['shopping_view', 'recipe_shopping_add'] },
    { feature: 'Favoritter', events: ['favorites_view', 'recipe_favorite_add'] },
    { feature: 'Tips', events: ['tips_landing_view', 'tips_article_view'] },
    { feature: 'Spotify', events: ['recipe_spotify_open'] },
    { feature: 'Notat (metadata)', events: ['note_save'] },
    { feature: 'Onboarding', events: ['onboarding_step_view'] },
    { feature: 'Tilbakemelding', events: ['feedback_submit'] },
  ]
  return features.map((f) => {
    const sessions = sessionsFor(events, f.events).size
    return {
      feature: f.feature,
      sessions,
      rate: total > 0 ? sessions / total : null,
    }
  })
}

export function deviceBreakdown(
  events: AnalyticsEventRow[],
): { device: string; count: number; sessions: number }[] {
  const map = new Map<string, { count: number; sessions: Set<string> }>()
  for (const e of events) {
    const d =
      typeof e.properties?.device === 'string' ? e.properties.device : 'ukjent'
    const cur = map.get(d) ?? { count: 0, sessions: new Set() }
    cur.count += 1
    cur.sessions.add(e.anonymous_session_id)
    map.set(d, cur)
  }
  return [...map.entries()]
    .map(([device, v]) => ({
      device,
      count: v.count,
      sessions: v.sessions.size,
    }))
    .sort((a, b) => b.sessions - a.sessions)
}

export function sourceAttribution(
  events: AnalyticsEventRow[],
): { source: string; views: number; sessions: number }[] {
  const map = new Map<string, { views: number; sessions: Set<string> }>()
  for (const e of events) {
    if (e.event_name !== 'recipe_view') continue
    const src = e.source ?? 'unknown'
    const cur = map.get(src) ?? { views: 0, sessions: new Set() }
    cur.views += 1
    cur.sessions.add(e.anonymous_session_id)
    map.set(src, cur)
  }
  return [...map.entries()]
    .map(([source, v]) => ({
      source,
      views: v.views,
      sessions: v.sessions.size,
    }))
    .sort((a, b) => b.views - a.views)
}

export function timeToActionBuckets(
  events: AnalyticsEventRow[],
): { bucket: string; count: number }[] {
  const bySession = new Map<string, AnalyticsEventRow[]>()
  for (const e of events) {
    const list = bySession.get(e.anonymous_session_id) ?? []
    list.push(e)
    bySession.set(e.anonymous_session_id, list)
  }
  const buckets = new Map<string, number>([
    ['0–30s', 0],
    ['30s–2m', 0],
    ['2–10m', 0],
    ['10m+', 0],
  ])
  for (const list of bySession.values()) {
    const ordered = [...list].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    const start = ordered.find((e) => e.event_name === 'session_start') ?? ordered[0]
    const action = ordered.find((e) =>
      [
        'recipe_favorite_add',
        'recipe_shopping_add',
        'pantry_item_add',
        'explore_search',
      ].includes(e.event_name),
    )
    if (!start || !action) continue
    const sec =
      (new Date(action.created_at).getTime() -
        new Date(start.created_at).getTime()) /
      1000
    if (sec < 0) continue
    const key =
      sec <= 30 ? '0–30s' : sec <= 120 ? '30s–2m' : sec <= 600 ? '2–10m' : '10m+'
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  return [...buckets.entries()].map(([bucket, count]) => ({ bucket, count }))
}

export function actionRanking(
  events: AnalyticsEventRow[],
): { event_name: string; count: number; sessions: number; share: number }[] {
  const totalSessions = new Set(events.map((e) => e.anonymous_session_id)).size
  const map = new Map<string, { count: number; sessions: Set<string> }>()
  for (const e of events) {
    const cur = map.get(e.event_name) ?? { count: 0, sessions: new Set() }
    cur.count += 1
    cur.sessions.add(e.anonymous_session_id)
    map.set(e.event_name, cur)
  }
  return [...map.entries()]
    .map(([event_name, v]) => ({
      event_name,
      count: v.count,
      sessions: v.sessions.size,
      share: totalSessions > 0 ? v.sessions.size / totalSessions : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions)
}

export function searchIntelligence(events: AnalyticsEventRow[]): {
  buckets: { label: string; count: number }[]
  validatedTerms: { term: string; count: number; zero: boolean }[]
  zeroResults: number
  searches: number
  searchSessions: number
} {
  const buckets = new Map<string, number>()
  const terms = new Map<string, { count: number; zero: number }>()
  let searches = 0
  let zeroResults = 0
  const searchSessions = new Set<string>()
  for (const e of events) {
    if (e.event_name !== 'explore_search') continue
    searches += 1
    searchSessions.add(e.anonymous_session_id)
    const bucket =
      typeof e.properties?.query_bucket === 'string'
        ? e.properties.query_bucket
        : 'other'
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1)
    const term =
      typeof e.properties?.validated_term === 'string'
        ? e.properties.validated_term
        : null
    const zero = e.properties?.zero_results === true || e.properties?.zero_results === 1
    if (zero) zeroResults += 1
    if (term) {
      const cur = terms.get(term) ?? { count: 0, zero: 0 }
      cur.count += 1
      if (zero) cur.zero += 1
      terms.set(term, cur)
    }
  }
  return {
    buckets: [...buckets.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    validatedTerms: [...terms.entries()]
      .map(([term, v]) => ({
        term,
        count: v.count,
        zero: v.zero > 0 && v.zero === v.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 40),
    zeroResults,
    searches,
    searchSessions: searchSessions.size,
  }
}

export function pantryIngredientPopularity(
  events: AnalyticsEventRow[],
): { key: string; adds: number; sessions: number }[] {
  const map = new Map<string, { adds: number; sessions: Set<string> }>()
  for (const e of events) {
    if (e.event_name !== 'pantry_item_add') continue
    const key =
      typeof e.properties?.ingredient_key === 'string'
        ? e.properties.ingredient_key
        : null
    if (!key) continue
    const cur = map.get(key) ?? { adds: 0, sessions: new Set() }
    cur.adds += 1
    cur.sessions.add(e.anonymous_session_id)
    map.set(key, cur)
  }
  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      adds: v.adds,
      sessions: v.sessions.size,
    }))
    .sort((a, b) => b.adds - a.adds)
}

export function technicalHealth(events: AnalyticsEventRow[]): {
  clientErrors: number
  errorSessions: number
  byPath: { path: string; count: number }[]
} {
  const errs = events.filter((e) => e.event_name === 'tech_client_error')
  const byPath = new Map<string, number>()
  for (const e of errs) {
    const p =
      e.path ||
      (typeof e.properties?.path === 'string' ? e.properties.path : 'ukjent')
    byPath.set(p, (byPath.get(p) ?? 0) + 1)
  }
  return {
    clientErrors: errs.length,
    errorSessions: new Set(errs.map((e) => e.anonymous_session_id)).size,
    byPath: [...byPath.entries()]
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count),
  }
}

export function deltaLabel(current: number, previous: number | null): string | null {
  if (previous == null || previous === 0) return null
  const d = ((current - previous) / previous) * 100
  const sign = d > 0 ? '+' : ''
  return `${sign}${d.toFixed(0)}% vs forrige`
}

export function overviewKpis(
  events: AnalyticsEventRow[],
  previous: AnalyticsEventRow[],
) {
  const sessions = new Set(events.map((e) => e.anonymous_session_id)).size
  const prevSessions = new Set(previous.map((e) => e.anonymous_session_id)).size
  const views = countEvent(events, 'recipe_view')
  const prevViews = countEvent(previous, 'recipe_view')
  const searches = countEvent(events, 'explore_search')
  const prevSearches = countEvent(previous, 'explore_search')
  const favs = sessionsFor(events, 'recipe_favorite_add').size
  const viewers = sessionsFor(events, 'recipe_view').size
  return {
    sessions: { value: sessions, delta: deltaLabel(sessions, prevSessions || null) },
    views: { value: views, delta: deltaLabel(views, prevViews || null) },
    searches: { value: searches, delta: deltaLabel(searches, prevSearches || null) },
    favRate: rateFrom(favs, viewers),
  }
}

export function eventsToCsv(events: AnalyticsEventRow[]): string {
  const header = [
    'created_at',
    'event_name',
    'recipe_id',
    'source',
    'env',
    'path',
    'from_path',
    'anonymous_session_id',
  ]
  const lines = [header.join(',')]
  for (const e of events.slice(0, 5000)) {
    lines.push(
      [
        e.created_at,
        e.event_name,
        e.recipe_id ?? '',
        e.source ?? '',
        e.env ?? '',
        e.path ?? '',
        e.from_path ?? '',
        e.anonymous_session_id,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    )
  }
  return lines.join('\n')
}

export function propString(e: AnalyticsEventRow, key: string): string | null {
  const v = e.properties?.[key]
  return typeof v === 'string' && v.trim() ? v.trim() : null
}
