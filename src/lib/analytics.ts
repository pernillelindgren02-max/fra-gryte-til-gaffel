/**
 * Product analytics — fire-and-forget, never blocks UI.
 * Admin-only read. Never store private note text, folder names, or secrets.
 * Single stack — extend here; do not add parallel trackers.
 */
import { supabase } from './supabase'

export const ANALYTICS_EVENTS = [
  'session_start',
  'route_view',
  'explore_view',
  'explore_search',
  'explore_filter_apply',
  'explore_category_open',
  'explore_recipe_click',
  'recipe_view',
  'recipe_favorite_add',
  'recipe_favorite_remove',
  'recipe_shopping_add',
  'recipe_share',
  'recipe_share_menu_opened',
  'recipe_link_shared',
  'recipe_pdf_generated',
  'recipe_pdf_shared',
  'recipe_pdf_downloaded',
  'recipe_printed',
  'recipe_spotify_open',
  'recipe_portions_change',
  'pantry_view',
  'pantry_item_add',
  'pantry_item_remove',
  'pantry_match_open',
  'fridge_opened',
  'fridge_ingredient_added',
  'fridge_ingredient_qty_updated',
  'fridge_ingredient_removed',
  'fridge_cleared',
  'explore_fridge_filter_enabled',
  'explore_fridge_filter_disabled',
  'recipe_fridge_match_viewed',
  'shopping_view',
  'shopping_recipe_remove',
  'shopping_add_missing',
  'explore_shopping_add',
  'explore_shopping_open_existing',
  'shopping_recipe_portions_changed',
  'favorites_view',
  'favorites_folder_create',
  'favorites_folder_open',
  'note_save',
  'tips_landing_view',
  'tips_article_view',
  'tips_search_used',
  'tips_topic_filter_opened',
  'tips_topic_selected',
  'tips_topic_removed',
  'tips_filters_cleared',
  'tips_article_opened_from_filter',
  'onboarding_step_view',
  'onboarding_complete',
  'onboarding_skip',
  'onboarding_replay',
  'feedback_submit',
  'tech_client_error',
] as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number]

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>

export type AnalyticsEnv = 'dev' | 'prod'

export type AnalyticsEventRow = {
  id: string
  event_name: string
  created_at: string
  anonymous_session_id: string
  user_id: string | null
  recipe_id: string | null
  source: string | null
  properties: Record<string, unknown>
  env?: AnalyticsEnv
  path?: string | null
  from_path?: string | null
}

const SESSION_KEY = 'fgtg-analytics-sid-v1'
const BUFFER_KEY = 'fgtg-analytics-buffer-v1'
const BUFFER_MAX = 800
const FORBIDDEN_PROP_KEYS = [
  'note',
  'notes',
  'body',
  'text',
  'folder',
  'folder_name',
  'folderName',
  'password',
  'email',
  'token',
  'secret',
  'content',
  'title',
  'feedback_body',
]

let sessionStarted = false
let lastPath: string | null = null
const recentDedup = new Map<string, number>()

function newSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 24)
  }
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

export function getAnonymousSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY)
    if (existing && existing.length >= 8) return existing
    const id = newSessionId()
    localStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return newSessionId()
  }
}

export function getAnalyticsEnv(): AnalyticsEnv {
  return import.meta.env.PROD ? 'prod' : 'dev'
}

export function deviceClass(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  if (w < 640) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

function sanitizeProperties(
  input?: AnalyticsProperties,
): Record<string, string | number | boolean | null> {
  if (!input) return {}
  const out: Record<string, string | number | boolean | null> = {}
  for (const [rawKey, value] of Object.entries(input)) {
    const key = rawKey.trim()
    if (!key || FORBIDDEN_PROP_KEYS.includes(key)) continue
    if (key.toLowerCase().includes('note')) continue
    if (key.toLowerCase().includes('password')) continue
    if (value === undefined) continue
    if (typeof value === 'string') {
      out[key] = value.slice(0, 80)
    } else if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      out[key] = value
    }
  }
  return out
}

function pushLocalBuffer(row: AnalyticsEventRow): void {
  try {
    const raw = localStorage.getItem(BUFFER_KEY)
    const list: AnalyticsEventRow[] = raw
      ? (JSON.parse(raw) as AnalyticsEventRow[])
      : []
    list.unshift(row)
    localStorage.setItem(BUFFER_KEY, JSON.stringify(list.slice(0, BUFFER_MAX)))
  } catch {
    /* ignore quota */
  }
}

export function readLocalAnalyticsBuffer(): AnalyticsEventRow[] {
  try {
    const raw = localStorage.getItem(BUFFER_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as AnalyticsEventRow[]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function shouldDedup(name: string, recipeId: string | null, path: string | null): boolean {
  const key = `${name}|${recipeId ?? ''}|${path ?? ''}`
  const now = Date.now()
  const prev = recentDedup.get(key)
  recentDedup.set(key, now)
  if (recentDedup.size > 80) {
    for (const [k, t] of recentDedup) {
      if (now - t > 5000) recentDedup.delete(k)
    }
  }
  return prev != null && now - prev < 800
}

/**
 * Track a product event. Never throws. Never awaits in callers.
 */
export function trackEvent(
  name: AnalyticsEventName,
  opts?: {
    recipeId?: string | null
    source?: string | null
    properties?: AnalyticsProperties
    userId?: string | null
    path?: string | null
    fromPath?: string | null
  },
): void {
  try {
    if (!(ANALYTICS_EVENTS as readonly string[]).includes(name)) return

    const path =
      opts?.path ??
      (typeof location !== 'undefined' ? location.pathname : null)
    const recipeId = opts?.recipeId?.trim() || null
    if (shouldDedup(name, recipeId, path)) return

    const env = getAnalyticsEnv()
    let language: 'no' | 'en' | undefined
    try {
      const stored = localStorage.getItem('fgtg-locale-v1')
      if (stored === 'no' || stored === 'en') language = stored
    } catch {
      /* ignore */
    }
    const props = sanitizeProperties({
      ...opts?.properties,
      device: opts?.properties?.device ?? deviceClass(),
      language: opts?.properties?.language ?? language ?? 'no',
    })

    const row: AnalyticsEventRow = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      event_name: name,
      created_at: new Date().toISOString(),
      anonymous_session_id: getAnonymousSessionId(),
      user_id: opts?.userId ?? null,
      recipe_id: recipeId,
      source: opts?.source?.trim()?.slice(0, 40) || null,
      properties: props,
      env,
      path: path?.slice(0, 120) ?? null,
      from_path: opts?.fromPath?.slice(0, 120) ?? null,
    }

    pushLocalBuffer(row)

    if (!supabase) return

    void supabase
      .from('analytics_events')
      .insert({
        event_name: row.event_name,
        anonymous_session_id: row.anonymous_session_id,
        user_id: row.user_id,
        recipe_id: row.recipe_id,
        source: row.source,
        properties: row.properties,
        env: row.env,
        path: row.path,
        from_path: row.from_path,
      })
      .then(() => {
        /* fail silent */
      })
  } catch {
    /* never block UI */
  }
}

export function trackSessionStart(userId?: string | null): void {
  if (sessionStarted) return
  sessionStarted = true
  trackEvent('session_start', {
    userId: userId ?? null,
    source: 'app',
    properties: {
      path: typeof location !== 'undefined' ? location.pathname : '/',
      device: deviceClass(),
    },
  })
}

export function trackRouteView(pathname: string): void {
  if (pathname.startsWith('/admin')) {
    lastPath = pathname
    return
  }
  const from = lastPath
  lastPath = pathname
  trackEvent('route_view', {
    source: 'router',
    path: pathname,
    fromPath: from,
    properties: { device: deviceClass() },
  })
}

export type AnalyticsPeriod = 'today' | '7d' | '30d' | '90d' | 'all' | 'custom'

export function periodRange(
  period: AnalyticsPeriod,
  custom?: { from: string; to: string },
): { from: Date | null; to: Date | null; prevFrom: Date | null; prevTo: Date | null } {
  const to = new Date()
  if (period === 'custom' && custom?.from && custom?.to) {
    const from = new Date(custom.from)
    const end = new Date(custom.to)
    end.setHours(23, 59, 59, 999)
    const span = end.getTime() - from.getTime()
    return {
      from,
      to: end,
      prevFrom: new Date(from.getTime() - span),
      prevTo: from,
    }
  }
  if (period === 'all') {
    return { from: null, to: null, prevFrom: null, prevTo: null }
  }
  if (period === 'today') {
    const from = new Date(to)
    from.setHours(0, 0, 0, 0)
    const prevTo = new Date(from)
    const prevFrom = new Date(from)
    prevFrom.setDate(prevFrom.getDate() - 1)
    return { from, to, prevFrom, prevTo }
  }
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
  const prevTo = new Date(from)
  const prevFrom = new Date(from.getTime() - days * 24 * 60 * 60 * 1000)
  return { from, to, prevFrom, prevTo }
}

function inRange(iso: string, from: Date | null, to: Date | null): boolean {
  const t = new Date(iso).getTime()
  if (from && t < from.getTime()) return false
  if (to && t > to.getTime()) return false
  return true
}

export async function fetchAnalyticsEvents(opts: {
  period: AnalyticsPeriod
  custom?: { from: string; to: string }
  env?: AnalyticsEnv | 'all'
  includePrevious?: boolean
}): Promise<{
  events: AnalyticsEventRow[]
  previous: AnalyticsEventRow[]
  source: 'supabase' | 'local'
}> {
  const { from, to, prevFrom, prevTo } = periodRange(opts.period, opts.custom)
  const envFilter = opts.env ?? 'all'

  const filterEnv = (list: AnalyticsEventRow[]) =>
    envFilter === 'all' ? list : list.filter((e) => (e.env ?? 'prod') === envFilter)

  if (supabase) {
    try {
      let query = supabase
        .from('analytics_events')
        .select(
          'id, event_name, created_at, anonymous_session_id, user_id, recipe_id, source, properties, env, path, from_path',
        )
        .order('created_at', { ascending: false })
        .limit(8000)

      if (from) query = query.gte('created_at', from.toISOString())
      if (to) query = query.lte('created_at', to.toISOString())
      if (envFilter !== 'all') query = query.eq('env', envFilter)

      const { data, error } = await query
      if (!error && data) {
        let previous: AnalyticsEventRow[] = []
        if (opts.includePrevious && prevFrom && prevTo) {
          const prevQ = await supabase
            .from('analytics_events')
            .select(
              'id, event_name, created_at, anonymous_session_id, user_id, recipe_id, source, properties, env, path, from_path',
            )
            .gte('created_at', prevFrom.toISOString())
            .lt('created_at', prevTo.toISOString())
            .order('created_at', { ascending: false })
            .limit(8000)
          if (!prevQ.error && prevQ.data) {
            previous = filterEnv(prevQ.data as AnalyticsEventRow[])
          }
        }
        return {
          events: filterEnv(data as AnalyticsEventRow[]),
          previous,
          source: 'supabase',
        }
      }
    } catch {
      /* local fallback */
    }
  }

  const all = readLocalAnalyticsBuffer()
  const events = filterEnv(all.filter((e) => inRange(e.created_at, from, to)))
  const previous =
    opts.includePrevious && prevFrom && prevTo
      ? filterEnv(all.filter((e) => inRange(e.created_at, prevFrom, prevTo)))
      : []
  return { events, previous, source: 'local' }
}

export function aggregateCounts(events: AnalyticsEventRow[]) {
  const byName = new Map<string, { count: number; sessions: Set<string> }>()
  for (const e of events) {
    const cur = byName.get(e.event_name) ?? {
      count: 0,
      sessions: new Set<string>(),
    }
    cur.count += 1
    cur.sessions.add(e.anonymous_session_id)
    byName.set(e.event_name, cur)
  }
  return [...byName.entries()]
    .map(([event_name, v]) => ({
      event_name,
      count: v.count,
      sessions: v.sessions.size,
    }))
    .sort((a, b) => b.count - a.count)
}

export function aggregateTopRecipes(events: AnalyticsEventRow[]) {
  const map = new Map<
    string,
    {
      views: number
      favorites: number
      shopping: number
      spotify: number
      portions: number
      sessions: Set<string>
      sources: Map<string, number>
    }
  >()
  for (const e of events) {
    if (!e.recipe_id) continue
    const cur = map.get(e.recipe_id) ?? {
      views: 0,
      favorites: 0,
      shopping: 0,
      spotify: 0,
      portions: 0,
      sessions: new Set<string>(),
      sources: new Map<string, number>(),
    }
    if (e.event_name === 'recipe_view') {
      cur.views += 1
      const src = e.source ?? 'unknown'
      cur.sources.set(src, (cur.sources.get(src) ?? 0) + 1)
    }
    if (e.event_name === 'recipe_favorite_add') cur.favorites += 1
    if (e.event_name === 'recipe_shopping_add') cur.shopping += 1
    if (e.event_name === 'recipe_spotify_open') cur.spotify += 1
    if (e.event_name === 'recipe_portions_change') cur.portions += 1
    cur.sessions.add(e.anonymous_session_id)
    map.set(e.recipe_id, cur)
  }
  return [...map.entries()]
    .map(([recipe_id, v]) => ({
      recipe_id,
      views: v.views,
      favorites: v.favorites,
      shopping: v.shopping,
      spotify: v.spotify,
      portions: v.portions,
      sessions: v.sessions.size,
      top_source:
        [...v.sources.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      fav_rate: v.views > 0 ? v.favorites / v.views : 0,
      shop_rate: v.views > 0 ? v.shopping / v.views : 0,
    }))
    .filter((r) => r.views + r.favorites + r.shopping > 0)
    .sort((a, b) => b.views - a.views || b.favorites - a.favorites)
}

export function countEvent(
  events: AnalyticsEventRow[],
  name: AnalyticsEventName | AnalyticsEventName[],
): number {
  const set = new Set(Array.isArray(name) ? name : [name])
  return events.filter((e) => set.has(e.event_name as AnalyticsEventName)).length
}

export function uniqueSessions(events: AnalyticsEventRow[]): number {
  return new Set(events.map((e) => e.anonymous_session_id)).size
}

export function searchQueryBucket(query: string): string {
  const len = query.trim().length
  if (len === 0) return 'empty'
  if (len <= 3) return '1-3'
  if (len <= 8) return '4-8'
  if (len <= 16) return '9-16'
  return '17+'
}

/** Only store search term when it matches a known public vocabulary token. */
export function validatedSearchTerm(
  query: string,
  knownTerms: Iterable<string>,
): string | null {
  const q = query.trim().toLowerCase()
  if (q.length < 2 || q.length > 40) return null
  for (const term of knownTerms) {
    const t = term.trim().toLowerCase()
    if (!t) continue
    if (t === q || t.startsWith(q) || q.startsWith(t)) {
      return t.slice(0, 40)
    }
  }
  return null
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  const w = window as Window & {
    __fgtgTrack?: typeof trackEvent
    __fgtgAnalyticsBuffer?: typeof readLocalAnalyticsBuffer
  }
  w.__fgtgTrack = trackEvent
  w.__fgtgAnalyticsBuffer = readLocalAnalyticsBuffer
}
