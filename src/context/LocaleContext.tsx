import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { translate, type MessageKey, type TranslateVars } from '../i18n/messages'
import {
  DEFAULT_LOCALE,
  isAppLocale,
  type AppLocale,
} from '../i18n/types'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const LOCAL_KEY = 'fgtg-locale-v1'
const CHOICE_KEY = 'fgtg-locale-chosen-v1'

type LocaleContextValue = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => Promise<void>
  t: (key: MessageKey, vars?: TranslateVars) => string
  /** True until user has explicitly chosen (first-time sheet). */
  needsLanguageChoice: boolean
  markLanguageChosen: () => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function readLocalLocale(): AppLocale {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (isAppLocale(raw)) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE
}

function readChosen(): boolean {
  try {
    return localStorage.getItem(CHOICE_KEY) === '1'
  } catch {
    return false
  }
}

async function fetchProfileLocale(userId: string): Promise<AppLocale | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('preferred_locale')
      .eq('id', userId)
      .maybeSingle()
    if (error || !data) return null
    const value = (data as { preferred_locale?: string }).preferred_locale
    return isAppLocale(value) ? value : null
  } catch {
    return null
  }
}

async function saveProfileLocale(
  userId: string,
  locale: AppLocale,
): Promise<void> {
  if (!supabase) return
  try {
    await supabase
      .from('profiles')
      .upsert({ id: userId, preferred_locale: locale }, { onConflict: 'id' })
  } catch {
    /* fail silent — local still works */
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [locale, setLocaleState] = useState<AppLocale>(() => readLocalLocale())
  const [needsLanguageChoice, setNeedsLanguageChoice] = useState(
    () => !readChosen(),
  )

  // On login: prefer account preference if set
  useEffect(() => {
    if (!user?.id) return
    let active = true
    void fetchProfileLocale(user.id).then((profileLocale) => {
      if (!active || !profileLocale) return
      setLocaleState(profileLocale)
      try {
        localStorage.setItem(LOCAL_KEY, profileLocale)
        localStorage.setItem(CHOICE_KEY, '1')
      } catch {
        /* ignore */
      }
      setNeedsLanguageChoice(false)
    })
    return () => {
      active = false
    }
  }, [user?.id])

  const setLocale = useCallback(
    async (next: AppLocale) => {
      setLocaleState(next)
      try {
        localStorage.setItem(LOCAL_KEY, next)
        localStorage.setItem(CHOICE_KEY, '1')
      } catch {
        /* ignore */
      }
      setNeedsLanguageChoice(false)
      document.documentElement.lang = next === 'en' ? 'en' : 'nb'
      if (user?.id) {
        await saveProfileLocale(user.id, next)
      }
    },
    [user?.id],
  )

  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'nb'
  }, [locale])

  const markLanguageChosen = useCallback(() => {
    try {
      localStorage.setItem(CHOICE_KEY, '1')
    } catch {
      /* ignore */
    }
    setNeedsLanguageChoice(false)
  }, [])

  const t = useCallback(
    (key: MessageKey, vars?: TranslateVars) => translate(locale, key, vars),
    [locale],
  )

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      needsLanguageChoice,
      markLanguageChosen,
    }),
    [locale, setLocale, t, needsLanguageChoice, markLanguageChosen],
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
