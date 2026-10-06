import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

export const isSupabaseConfigured =
  url.length > 0 &&
  anonKey.length > 0 &&
  !url.includes('YOUR_PROJECT') &&
  !anonKey.includes('YOUR_ANON')

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null

export type FolderRow = {
  id: string
  user_id: string
  name: string
  created_at: string
}

export type RecipeNoteRow = {
  user_id: string
  recipe_id: string
  body: string
  updated_at: string
}
