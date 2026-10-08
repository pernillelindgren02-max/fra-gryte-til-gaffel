import { localRecipes, type Recipe } from '../data/recipes'
import { mapRecipeToRow, mapRowToRecipe, type RecipeRow } from './recipeMapper'
import { supabase } from './supabase'

const BUCKET = 'recipe-images'

export function supabasePublicUrl(): string {
  return (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
}

export async function fetchAllRecipesForAdmin(): Promise<RecipeRow[]> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data as RecipeRow[]) ?? []
}

export async function fetchAdminRecipe(
  id: string,
): Promise<RecipeRow | null> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as RecipeRow | null) ?? null
}

export async function upsertRecipeRow(
  row: Omit<RecipeRow, 'created_at' | 'updated_at'> & {
    updated_at?: string
  },
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const payload = {
    ...row,
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('recipes').upsert(payload)
  if (error) throw error
}

export async function deleteRecipeRow(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}

export async function setPublished(
  id: string,
  isPublished: boolean,
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error } = await supabase
    .from('recipes')
    .update({
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function uploadRecipeImage(
  recipeId: string,
  file: File,
): Promise<string> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${recipeId}.${ext === 'jpeg' ? 'jpg' : ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  return path
}

/** Spotify Code / scannable image — stored beside the main recipe photo. */
export async function uploadSpotifyCodeImage(
  recipeId: string,
  file: File,
): Promise<string> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const safeExt = ext === 'jpeg' ? 'jpg' : ext
  const path = `${recipeId}-spotify-code.${safeExt}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  return path
}

export async function removeRecipeImage(path: string): Promise<void> {
  if (!supabase || !path) return
  await supabase.storage.from(BUCKET).remove([path])
}

async function uploadFromPublicPath(
  recipeId: string,
  publicPath: string,
): Promise<string | null> {
  if (!supabase) return null
  try {
    const res = await fetch(publicPath)
    if (!res.ok) return null
    const blob = await res.blob()
    const ext = publicPath.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${recipeId}.${ext === 'jpeg' ? 'jpg' : ext}`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, {
        upsert: true,
        contentType: blob.type || 'image/jpeg',
      })
    if (error) return null
    return path
  } catch {
    return null
  }
}

/** One-time import of local seed recipes + images (admin session required). */
export async function importLocalRecipes(): Promise<{
  imported: number
  errors: string[]
}> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const errors: string[] = []
  let imported = 0

  for (const recipe of localRecipes) {
    try {
      let imagePath =
        recipe.image.replace(/^\/images\/recipes\//, '') || null
      const uploaded = await uploadFromPublicPath(recipe.id, recipe.image)
      if (uploaded) imagePath = uploaded

      const row = mapRecipeToRow(recipe, {
        image_path: imagePath,
        is_published: true,
      })
      await upsertRecipeRow(row)
      imported += 1
    } catch (err) {
      errors.push(
        `${recipe.id}: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  return { imported, errors }
}

export function rowAsEditableRecipe(row: RecipeRow): Recipe {
  return mapRowToRecipe(row, supabasePublicUrl())
}

export function emptyDraftRecipe(): Recipe {
  return {
    id: '',
    name: '',
    nameNo: '',
    nameEn: '',
    nameEnAuto: '',
    nameEnOverride: false,
    shortDescription: '',
    shortDescriptionNo: '',
    shortDescriptionEn: '',
    shortDescriptionEnAuto: '',
    shortDescriptionEnOverride: false,
    image: '/images/recipes/placeholder-dish.jpg',
    timeMinutes: 20,
    servings: 2,
    mealType: 'dinner',
    preparationLevel: 'someCutting',
    storageNeed: 'fewHoursOk',
    priceLevel: 'medium',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'some',
    ingredients: [
      {
        id: 'new-ingredient',
        nameNo: '',
        nameEn: '',
        nameEnAuto: '',
        nameEnOverride: false,
        name: '',
        quantity: null,
        unit: null,
      },
    ],
    steps: [''],
    stepsNo: [''],
    stepsEn: [],
    practicalTags: [],
  }
}

export async function duplicateRecipeRow(sourceId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const source = await fetchAdminRecipe(sourceId)
  if (!source) throw new Error('Fant ikke oppskriften å duplisere.')
  const base = `${source.id}-kopi`
  let nextId = base
  let n = 2
  while (true) {
    const existing = await fetchAdminRecipe(nextId)
    if (!existing) break
    nextId = `${base}-${n}`
    n += 1
  }
  const row = {
    ...source,
    id: nextId,
    name: `${source.name} (kopi)`,
    is_published: false,
    notify_on_publish: false,
    updated_at: new Date().toISOString(),
  }
  delete (row as { created_at?: string }).created_at
  await upsertRecipeRow(row)
  return nextId
}

export function slugifyId(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)
}
