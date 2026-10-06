/**
 * Shared Supabase client + types used by auth / favorites / folders / notes.
 * Client setup lives in `supabaseClient.ts`.
 */
export {
  isSupabaseConfigured,
  supabase,
  testSupabaseConnection,
} from './supabaseClient'

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
