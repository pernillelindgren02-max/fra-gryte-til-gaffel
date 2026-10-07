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
  fetchUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  saveNotifyPreference,
  type UserNotification,
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
  items: UserNotification[]
  unreadCount: number
  notifyNewRecipes: boolean
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  setNotifyNewRecipes: (value: boolean) => Promise<string | null>
  markRead: (notificationId: string) => Promise<void>
  markAllRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth()
  const [items, setItems] = useState<UserNotification[]>([])
  const [notifyNewRecipes, setNotifyFlag] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!configured || !user) {
      setItems([])
      setNotifyFlag(true)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [prefs, list] = await Promise.all([
        fetchNotifyPreference(user.id),
        fetchUserNotifications(),
      ])
      setNotifyFlag(prefs)
      setItems(list)
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
      items,
      unreadCount: items.filter((item) => !item.read_at).length,
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
          return translateDbError(
            err instanceof Error ? err.message : String(err),
          )
        }
      },
      async markRead(notificationId) {
        await markNotificationRead(notificationId)
        setItems((prev) =>
          prev.map((item) =>
            item.notification_id === notificationId && !item.read_at
              ? { ...item, read_at: new Date().toISOString() }
              : item,
          ),
        )
      },
      async markAllRead() {
        await markAllNotificationsRead()
        const now = new Date().toISOString()
        setItems((prev) =>
          prev.map((item) =>
            item.read_at ? item : { ...item, read_at: now },
          ),
        )
      },
    }),
    [items, notifyNewRecipes, loading, error, refresh, user],
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
