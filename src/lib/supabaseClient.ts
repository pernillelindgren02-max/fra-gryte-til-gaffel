import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
/** Prefer publishable key; anon key still accepted for older .env files. */
const publishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  ''
).trim()

function looksLikePlaceholder(value: string): boolean {
  const lower = value.toLowerCase()
  return (
    value.length === 0 ||
    lower.includes('your_project') ||
    lower.includes('your_') ||
    lower.includes('xxxx') ||
    lower === 'eyj...'
  )
}

export const isSupabaseConfigured =
  !looksLikePlaceholder(url) && !looksLikePlaceholder(publishableKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/**
 * Minimal connection check — runs once when the client module loads.
 * Open the browser console (DevTools → Console) after restarting Vite.
 */
export async function testSupabaseConnection(): Promise<void> {
  if (!supabase) {
    console.info(
      '[Supabase] Ikke konfigurert. Lim inn VITE_SUPABASE_URL og VITE_SUPABASE_PUBLISHABLE_KEY i .env.local og restart Vite.',
    )
    return
  }

  try {
    const { error } = await supabase.auth.getSession()
    if (error) {
      console.warn('[Supabase] Tilkobling feilet:', error.message)
      return
    }
    console.info('[Supabase] Tilkobling OK (auth.getSession).')
  } catch (err) {
    console.warn('[Supabase] Tilkobling feilet:', err)
  }
}

void testSupabaseConnection()
