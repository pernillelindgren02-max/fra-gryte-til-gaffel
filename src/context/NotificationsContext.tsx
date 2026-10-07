import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import {
  fetchNotifyPreference,
  saveNotifyPreference,
} from '../lib/notificationsApi'
import { translateDbError } from '../lib/supabase'

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return String(err)
}

type NotificationsContextValue = {
  notifyNewRecipes: boolean
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  setNotifyNewRecipes: (value: boolean) => Promise<string | null>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
)

/** User-facing: preference only. No in-app inbox. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth()
  const [notifyNewRecipes, setNotifyFlag] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!configured || !user) {
      setNotifyFlag(true)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const prefs = await fetchNotifyPreference(user.id)
      setNotifyFlag(prefs)
      setError(null)
    } catch (err) {
      setError(translateDbError(errorMessage(err)))
    } finally {
      setLoading(false)
    }
  }, [configured, user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifyNewRecipes,
      loading,
      error,
      refresh,
      async setNotifyNewRecipes(next) {
        if (!user) return 'Du må være innlogget.'
        try {
          await saveNotifyPreference(user.id, next)
          setNotifyFlag(next)
          return null
        } catch (err) {
          return translateDbError(errorMessage(err))
        }
      },
    }),
    [notifyNewRecipes, loading, error, refresh, user],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error(
      'useNotifications must be used within NotificationsProvider',
    )
  }
  return ctx
}
