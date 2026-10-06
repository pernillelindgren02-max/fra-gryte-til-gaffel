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

export type FavoriteRow = {
  user_id: string
  recipe_id: string
  created_at: string
}

export type FolderRecipeRow = {
  folder_id: string
  recipe_id: string
  created_at: string
}

export type RecipeNoteRow = {
  user_id: string
  recipe_id: string
  body: string
  updated_at: string
}

/** Map PostgREST / schema errors to short Norwegian hints. */
export function translateDbError(message: string): string {
  const lower = message.toLowerCase()
  if (
    lower.includes('could not find the table') ||
    lower.includes('schema cache') ||
    (lower.includes('relation') && lower.includes('does not exist'))
  ) {
    return 'Databasetabellene mangler. Kjør supabase/schema.sql i Supabase → SQL Editor.'
  }
  if (lower.includes('permission denied') || lower.includes('rls')) {
    return 'Mangler tilgang. Sjekk at du er innlogget og at RLS-policies er kjørt.'
  }
  if (lower.includes('jwt') || lower.includes('not authenticated')) {
    return 'Du må være innlogget.'
  }
  return message
}
