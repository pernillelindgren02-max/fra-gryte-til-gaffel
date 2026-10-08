import { supabase } from './supabase'
import {
  DEFAULT_COPY,
  DEFAULT_EXPLORE_CATEGORIES,
  DEFAULT_EXPLORE_SETTINGS,
  DEFAULT_THEME,
  normalizeExploreCategory,
  normalizeExploreSection,
  normalizeExploreSettings,
  type AppCopyMap,
  type AppThemeTokens,
  type ExploreCategoryConfig,
  type ExploreSettings,
  type ExploreSectionConfig,
} from './siteDefaults'

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => String(v))
}

function asSections(value: unknown): ExploreSectionConfig[] {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_EXPLORE_SETTINGS.sections
  }
  return value.map((item) =>
    normalizeExploreSection(item as Partial<ExploreSectionConfig>),
  )
}

function asCategories(value: unknown): ExploreCategoryConfig[] {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_EXPLORE_CATEGORIES
  }
  const parsed = value.map((item) =>
    normalizeExploreCategory(item as Partial<ExploreCategoryConfig>),
  )
  return DEFAULT_EXPLORE_CATEGORIES.map((defaults) => {
    const saved = parsed.find((c) => c.id === defaults.id)
    return saved
      ? normalizeExploreCategory({
          ...defaults,
          ...saved,
          titleNo: saved.titleNo || saved.title || defaults.titleNo,
        })
      : defaults
  })
}

/** sections column may be a legacy array or { feed, categories, blurb_* }. */
function parseSectionsColumn(value: unknown): {
  sections: ExploreSectionConfig[]
  categories: ExploreCategoryConfig[]
  blurbMeta: Partial<ExploreSettings>
} {
  if (Array.isArray(value)) {
    return {
      sections: asSections(value),
      categories: DEFAULT_EXPLORE_CATEGORIES,
      blurbMeta: {},
    }
  }
  if (value && typeof value === 'object') {
    const row = value as {
      feed?: unknown
      sections?: unknown
      categories?: unknown
      blurb_en?: unknown
      blurbEn?: unknown
      blurb_en_auto?: unknown
      blurbEnAuto?: unknown
      blurb_en_override?: unknown
      blurbEnOverride?: unknown
      blurb_no?: unknown
      blurbNo?: unknown
    }
    return {
      sections: asSections(row.feed ?? row.sections),
      categories: asCategories(row.categories),
      blurbMeta: {
        blurbNo: row.blurbNo != null ? String(row.blurbNo) : undefined,
        blurbEn: String(row.blurbEn ?? row.blurb_en ?? ''),
        blurbEnAuto: String(row.blurbEnAuto ?? row.blurb_en_auto ?? ''),
        blurbEnOverride: Boolean(
          row.blurbEnOverride ?? row.blurb_en_override,
        ),
      },
    }
  }
  return {
    sections: DEFAULT_EXPLORE_SETTINGS.sections,
    categories: DEFAULT_EXPLORE_CATEGORIES,
    blurbMeta: {},
  }
}

export async function fetchExploreSettings(): Promise<ExploreSettings> {
  if (!supabase) return DEFAULT_EXPLORE_SETTINGS
  const { data, error } = await supabase
    .from('explore_settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle()
  if (error || !data) return DEFAULT_EXPLORE_SETTINGS
  const parsed = parseSectionsColumn(data.sections)
  const blurbNo = String(
    parsed.blurbMeta.blurbNo ?? data.blurb ?? '',
  ).trim()
  return normalizeExploreSettings({
    featured_ids: asStringArray(data.featured_ids),
    sections: parsed.sections,
    categories: parsed.categories,
    blurb: blurbNo,
    blurbNo,
    blurbEn: parsed.blurbMeta.blurbEn,
    blurbEnAuto: parsed.blurbMeta.blurbEnAuto,
    blurbEnOverride: parsed.blurbMeta.blurbEnOverride,
  })
}

export async function saveExploreSettings(
  settings: ExploreSettings,
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const normalized = normalizeExploreSettings(settings)
  const { error } = await supabase.from('explore_settings').upsert({
    id: 'default',
    featured_ids: normalized.featured_ids,
    sections: {
      feed: normalized.sections,
      categories: normalized.categories,
      blurbNo: normalized.blurbNo,
      blurbEn: normalized.blurbEnOverride ? normalized.blurbEn : '',
      blurbEnAuto: normalized.blurbEnAuto,
      blurbEnOverride: normalized.blurbEnOverride,
    },
    blurb: normalized.blurbNo,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function fetchAppCopy(): Promise<AppCopyMap> {
  if (!supabase) return { ...DEFAULT_COPY }
  const { data, error } = await supabase.from('app_copy').select('key, value')
  if (error || !data) return { ...DEFAULT_COPY }
  const map = { ...DEFAULT_COPY }
  for (const row of data) {
    map[row.key] = String(row.value ?? '')
  }
  return map
}

export async function saveAppCopy(copy: AppCopyMap): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const rows = Object.entries(copy).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('app_copy').upsert(rows)
  if (error) throw error
}

export async function fetchAppTheme(): Promise<AppThemeTokens> {
  if (!supabase) return { ...DEFAULT_THEME }
  const { data, error } = await supabase
    .from('app_theme')
    .select('tokens')
    .eq('id', 'default')
    .maybeSingle()
  if (error || !data?.tokens || typeof data.tokens !== 'object') {
    return { ...DEFAULT_THEME }
  }
  return { ...DEFAULT_THEME, ...(data.tokens as AppThemeTokens) }
}

export async function saveAppTheme(tokens: AppThemeTokens): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error } = await supabase.from('app_theme').upsert({
    id: 'default',
    tokens,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export type AdminUserRow = {
  id: string
  email: string | null
  created_at: string
  is_admin: boolean
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) throw error
  return (data as AdminUserRow[]) ?? []
}

export async function fetchAdminSettings(): Promise<Record<string, unknown>> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { data, error } = await supabase.from('admin_settings').select('*')
  if (error) throw error
  const map: Record<string, unknown> = {}
  for (const row of data ?? []) {
    map[row.key] = row.value
  }
  return map
}

export async function saveAdminSetting(
  key: string,
  value: unknown,
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error } = await supabase.from('admin_settings').upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}
