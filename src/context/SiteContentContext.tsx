import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchAppCopy,
  fetchAppTheme,
  fetchExploreSettings,
} from '../lib/siteContentApi'
import {
  DEFAULT_COPY,
  DEFAULT_EXPLORE_SETTINGS,
  DEFAULT_THEME,
  type AppCopyMap,
  type AppThemeTokens,
  type ExploreSettings,
} from '../lib/siteDefaults'
import { applyThemeToDocument } from '../lib/themeValidate'
import { isSupabaseConfigured } from '../lib/supabase'

type SiteContentValue = {
  copy: AppCopyMap
  theme: AppThemeTokens
  explore: ExploreSettings
  loading: boolean
  refresh: () => Promise<void>
  getCopy: (key: string, fallback?: string) => string
}

const SiteContentContext = createContext<SiteContentValue | null>(null)

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [copy, setCopy] = useState<AppCopyMap>({ ...DEFAULT_COPY })
  const [theme, setTheme] = useState<AppThemeTokens>({ ...DEFAULT_THEME })
  const [explore, setExplore] = useState<ExploreSettings>({
    ...DEFAULT_EXPLORE_SETTINGS,
  })
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setCopy({ ...DEFAULT_COPY })
      setTheme({ ...DEFAULT_THEME })
      setExplore({ ...DEFAULT_EXPLORE_SETTINGS })
      applyThemeToDocument(DEFAULT_THEME)
      setLoading(false)
      return
    }
    setLoading(true)
    const [nextCopy, nextTheme, nextExplore] = await Promise.all([
      fetchAppCopy(),
      fetchAppTheme(),
      fetchExploreSettings(),
    ])
    setCopy(nextCopy)
    setTheme(nextTheme)
    setExplore(nextExplore)
    applyThemeToDocument(nextTheme)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<SiteContentValue>(
    () => ({
      copy,
      theme,
      explore,
      loading,
      refresh,
      getCopy(key, fallback) {
        return copy[key] ?? fallback ?? DEFAULT_COPY[key] ?? ''
      },
    }),
    [copy, theme, explore, loading, refresh],
  )

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  )
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext)
  if (!ctx) {
    throw new Error('useSiteContent must be used within SiteContentProvider')
  }
  return ctx
}
