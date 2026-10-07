export type ExploreSectionMode = 'auto' | 'manual'

export type ExploreSectionConfig = {
  id: string
  title: string
  mode: ExploreSectionMode
  recipe_ids: string[]
}

export type ExploreSettings = {
  featured_ids: string[]
  sections: ExploreSectionConfig[]
  blurb: string
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

export const DEFAULT_EXPLORE_SETTINGS: ExploreSettings = {
  featured_ids: [],
  sections: [
    {
      id: 'quick-easy',
      title: 'Raskt og enkelt',
      mode: 'auto',
      recipe_ids: [],
    },
    {
      id: 'primus',
      title: 'Perfekt på primus',
      mode: 'auto',
      recipe_ids: [],
    },
    {
      id: 'breakfast',
      title: 'Frokost',
      mode: 'auto',
      recipe_ids: [],
    },
    {
      id: 'dinner',
      title: 'Middag',
      mode: 'auto',
      recipe_ids: [],
    },
  ],
  blurb: '',
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
