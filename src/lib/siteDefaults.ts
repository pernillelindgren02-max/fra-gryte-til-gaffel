export type ExploreSectionMode = 'auto' | 'manual'

export type ExploreSectionConfig = {
  id: string
  /** Legacy / resolved NO title mirror. */
  title: string
  titleNo: string
  titleEn: string
  titleEnAuto: string
  titleEnOverride: boolean
  mode: ExploreSectionMode
  recipe_ids: string[]
}

/** Horizontal category chips on Explore — curated or auto from tags. */
export type ExploreCategoryConfig = {
  id: string
  title: string
  titleNo: string
  titleEn: string
  titleEnAuto: string
  titleEnOverride: boolean
  mode: ExploreSectionMode
  recipe_ids: string[]
}

export type ExploreSettings = {
  featured_ids: string[]
  sections: ExploreSectionConfig[]
  categories: ExploreCategoryConfig[]
  blurb: string
  blurbNo: string
  blurbEn: string
  blurbEnAuto: string
  blurbEnOverride: boolean
}

export type AppThemeTokens = {
  terracotta: string
  teal: string
  olive: string
  warmOrange: string
  softYellow: string
  paleGreen: string
  bg: string
  card: string
  logoBlob: string
}

export type AppCopyMap = Record<string, string>

import {
  suggestExploreBlurbEn,
  suggestExploreCategoryEn,
  suggestExploreSectionEn,
} from '../i18n/editorialAuto'

function withCategoryI18n(
  id: string,
  title: string,
  partial?: Partial<ExploreCategoryConfig>,
): ExploreCategoryConfig {
  const titleNo = (partial?.titleNo || title || '').trim()
  const titleEn = (partial?.titleEn || '').trim()
  const titleEnAuto = (
    partial?.titleEnAuto ||
    suggestExploreCategoryEn(id, titleNo) ||
    ''
  ).trim()
  const titleEnOverride =
    Boolean(partial?.titleEnOverride) && Boolean(titleEn)
  return {
    id,
    title: titleNo,
    titleNo,
    titleEn,
    titleEnAuto,
    titleEnOverride,
    mode: partial?.mode === 'manual' ? 'manual' : 'auto',
    recipe_ids: partial?.recipe_ids ?? [],
  }
}

function withSectionI18n(
  id: string,
  title: string,
  partial?: Partial<ExploreSectionConfig>,
): ExploreSectionConfig {
  const titleNo = (partial?.titleNo || title || '').trim()
  const titleEn = (partial?.titleEn || '').trim()
  const titleEnAuto = (
    partial?.titleEnAuto ||
    suggestExploreSectionEn(id, titleNo) ||
    ''
  ).trim()
  const titleEnOverride =
    Boolean(partial?.titleEnOverride) && Boolean(titleEn)
  return {
    id,
    title: titleNo,
    titleNo,
    titleEn,
    titleEnAuto,
    titleEnOverride,
    mode: partial?.mode === 'manual' ? 'manual' : 'auto',
    recipe_ids: partial?.recipe_ids ?? [],
  }
}

export const DEFAULT_EXPLORE_CATEGORIES: ExploreCategoryConfig[] = [
  withCategoryI18n('primus', 'Perfekt til primus'),
  withCategoryI18n('few-ingredients', 'Få ingredienser'),
  withCategoryI18n('quick', 'Dårlig tid?'),
  withCategoryI18n('dinner', 'Middag'),
  withCategoryI18n('breakfast', 'Frokost'),
  withCategoryI18n('lunch', 'Lunsj'),
  withCategoryI18n('dessert', 'Dessert'),
]

export const DEFAULT_EXPLORE_SETTINGS: ExploreSettings = {
  featured_ids: [],
  sections: [
    withSectionI18n('quick-easy', 'Raskt og enkelt'),
    withSectionI18n('primus', 'Perfekt på primus'),
    withSectionI18n('breakfast', 'Frokost'),
    withSectionI18n('dinner', 'Middag'),
  ],
  categories: DEFAULT_EXPLORE_CATEGORIES,
  blurb: '',
  blurbNo: '',
  blurbEn: '',
  blurbEnAuto: suggestExploreBlurbEn(''),
  blurbEnOverride: false,
}

export const DEFAULT_COPY: AppCopyMap = {
  'explore.tagline': 'En gryte unna noe godt',
  'explore.search_placeholder': 'Søk etter oppskrift eller ingrediens',
  'explore.empty_results':
    'Ingen oppskrifter matcher søket eller filtrene. Prøv andre ord eller åpne filtre og nullstill valg.',
  'explore.cloud_fallback':
    'Kunne ikke hente oppskrifter fra skyen — viser lokal kopi.',
  'favoritter.helper':
    'Lagre favoritter og mapper, pluss private notater på oppskrifter.',
  'favoritter.empty': 'Ingen lagrede oppskrifter ennå.',
  'handleliste.empty': 'Handlelisten er tom.',
  'hjemme.empty': 'Ingen ingredienser ennå.',
}

export const DEFAULT_THEME: AppThemeTokens = {
  terracotta: '#c8544f',
  teal: '#255957',
  olive: '#859400',
  warmOrange: '#ee7939',
  softYellow: '#eacd6a',
  paleGreen: '#d5dba2',
  bg: '#f7f3eb',
  card: '#eef1df',
  logoBlob: '#d5dba2',
}

export const THEME_PRESETS: { id: string; label: string; tokens: AppThemeTokens }[] =
  [
    { id: 'default', label: 'Standard (nåværende)', tokens: DEFAULT_THEME },
    {
      id: 'deeper-teal',
      label: 'Dypere teal',
      tokens: {
        ...DEFAULT_THEME,
        teal: '#1a4543',
        terracotta: '#b84a45',
      },
    },
    {
      id: 'warmer',
      label: 'Varmere',
      tokens: {
        ...DEFAULT_THEME,
        terracotta: '#d45a3a',
        warmOrange: '#f08a4a',
        softYellow: '#f0d878',
        bg: '#faf6ee',
      },
    },
    {
      id: 'cooler-green',
      label: 'Kjøligere grønn',
      tokens: {
        ...DEFAULT_THEME,
        paleGreen: '#c5d4b0',
        olive: '#6f8a3a',
        logoBlob: '#c5d4b0',
        card: '#e8efd8',
      },
    },
  ]

export const COPY_FIELDS: { key: string; label: string; multiline?: boolean }[] =
  [
    { key: 'explore.tagline', label: 'Explore-tagline' },
    {
      key: 'explore.search_placeholder',
      label: 'Søkefelt-placeholder',
    },
    {
      key: 'explore.empty_results',
      label: 'Tomt søk/filter',
      multiline: true,
    },
    {
      key: 'explore.cloud_fallback',
      label: 'Sky-feilmelding (fallback)',
      multiline: true,
    },
    {
      key: 'favoritter.helper',
      label: 'Konto / favoritter hjelpetekst',
      multiline: true,
    },
    { key: 'favoritter.empty', label: 'Favoritter tom' },
    { key: 'handleliste.empty', label: 'Handleliste tom' },
    { key: 'hjemme.empty', label: 'Hjemme tom' },
  ]

/** Normalize a partially saved category row into full bilingual shape. */
export function normalizeExploreCategory(
  row: Partial<ExploreCategoryConfig> & { id?: string; title?: string },
): ExploreCategoryConfig {
  const id = String(row.id ?? 'category')
  const titleNo = String(row.titleNo ?? row.title ?? '').trim()
  return withCategoryI18n(id, titleNo, {
    ...row,
    titleNo,
    recipe_ids: Array.isArray(row.recipe_ids) ? row.recipe_ids.map(String) : [],
  })
}

export function normalizeExploreSection(
  row: Partial<ExploreSectionConfig> & { id?: string; title?: string },
): ExploreSectionConfig {
  const id = String(row.id ?? 'section')
  const titleNo = String(row.titleNo ?? row.title ?? '').trim()
  return withSectionI18n(id, titleNo, {
    ...row,
    titleNo,
    recipe_ids: Array.isArray(row.recipe_ids) ? row.recipe_ids.map(String) : [],
  })
}

export function normalizeExploreSettings(
  raw: Partial<ExploreSettings> & { blurb?: string },
): ExploreSettings {
  const blurbNo = String(raw.blurbNo ?? raw.blurb ?? '').trim()
  const blurbEn = String(raw.blurbEn ?? '').trim()
  const blurbEnAuto = String(
    raw.blurbEnAuto ?? suggestExploreBlurbEn(blurbNo) ?? '',
  ).trim()
  return {
    featured_ids: Array.isArray(raw.featured_ids)
      ? raw.featured_ids.map(String)
      : [],
    sections: (raw.sections ?? DEFAULT_EXPLORE_SETTINGS.sections).map(
      normalizeExploreSection,
    ),
    categories: (raw.categories ?? DEFAULT_EXPLORE_CATEGORIES).map(
      normalizeExploreCategory,
    ),
    blurb: blurbNo,
    blurbNo,
    blurbEn,
    blurbEnAuto,
    blurbEnOverride: Boolean(raw.blurbEnOverride) && Boolean(blurbEn),
  }
}
