import { supabase } from './supabase'
import {
  DEFAULT_COPY,
  DEFAULT_EXPLORE_SETTINGS,
  DEFAULT_THEME,
  type AppCopyMap,
  type AppThemeTokens,
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
  return value.map((item) => {
    const row = item as Partial<ExploreSectionConfig>
    return {
      id: String(row.id ?? 'section'),
      title: String(row.title ?? ''),
      mode: row.mode === 'manual' ? 'manual' : 'auto',
      recipe_ids: asStringArray(row.recipe_ids),
    }
  })
}

export async function fetchExploreSettings(): Promise<ExploreSettings> {
  if (!supabase) return DEFAULT_EXPLORE_SETTINGS
  const { data, error } = await supabase
    .from('explore_settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle()
  if (error || !data) return DEFAULT_EXPLORE_SETTINGS
  return {
    featured_ids: asStringArray(data.featured_ids),
    sections: asSections(data.sections),
    blurb: String(data.blurb ?? ''),
  }
}

export async function saveExploreSettings(
  settings: ExploreSettings,
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error } = await supabase.from('explore_settings').upsert({
    id: 'default',
    featured_ids: settings.featured_ids,
    sections: settings.sections,
    blurb: settings.blurb,
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
