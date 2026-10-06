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
  signUp: (email: string, password: string) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function translateAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login')) return 'Feil e-post eller passord.'
  if (lower.includes('already registered')) return 'E-posten er allerede registrert.'
  if (lower.includes('password')) return 'Passordet må være minst 6 tegn.'
  if (lower.includes('email')) return 'Sjekk at e-postadressen er gyldig.'
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
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
      async signUp(email, password) {
        if (!supabase) return 'Supabase er ikke konfigurert ennå.'
        const { error } = await supabase.auth.signUp({ email, password })
        return error ? translateAuthError(error.message) : null
      },
      async signIn(email, password) {
        if (!supabase) return 'Supabase er ikke konfigurert ennå.'
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        return error ? translateAuthError(error.message) : null
      },
      async signOut() {
        if (!supabase) return
        await supabase.auth.signOut()
      },
    }),
    [loading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
