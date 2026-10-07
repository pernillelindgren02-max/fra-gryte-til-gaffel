import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

type AuthContextValue = {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  isAdmin: boolean
  adminChecked: boolean
  signUp: (email: string, password: string) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshAdmin: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function translateAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return 'Feil e-post eller passord.'
  }
  if (lower.includes('already registered') || lower.includes('user already')) {
    return 'E-posten er allerede registrert.'
  }
  if (lower.includes('email not confirmed')) {
    return 'E-posten er ikke bekreftet ennå. Sjekk innboksen (og søppelpost).'
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'For mange forsøk. Vent litt og prøv igjen.'
  }
  if (lower.includes('password')) return 'Passordet må være minst 6 tegn.'
  if (lower.includes('email')) return 'Sjekk at e-postadressen er gyldig.'
  return message
}

async function fetchIsAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) return false
  return Boolean(data.is_admin)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminChecked, setAdminChecked] = useState(!isSupabaseConfigured)

  async function syncAdmin(nextSession: Session | null) {
    if (!nextSession?.user) {
      setIsAdmin(false)
      setAdminChecked(true)
      return
    }
    setAdminChecked(false)
    const admin = await fetchIsAdmin(nextSession.user.id)
    setIsAdmin(admin)
    setAdminChecked(true)
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      setAdminChecked(true)
      return
    }

    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await syncAdmin(data.session)
      if (active) setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
        void syncAdmin(nextSession)
        setLoading(false)
      },
    )

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      isAdmin,
      adminChecked,
      async signUp(email, password) {
        if (!supabase) return 'Supabase er ikke konfigurert ennå.'
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })
        if (error) return translateAuthError(error.message)
        if (
          data.user &&
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0
        ) {
          return 'E-posten er allerede registrert.'
        }
        return null
      },
      async signIn(email, password) {
        if (!supabase) return 'Supabase er ikke konfigurert ennå.'
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        return error ? translateAuthError(error.message) : null
      },
      async signOut() {
        if (!supabase) return
        await supabase.auth.signOut()
        setIsAdmin(false)
      },
      async refreshAdmin() {
        await syncAdmin(session)
      },
    }),
    [loading, session, isAdmin, adminChecked],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
