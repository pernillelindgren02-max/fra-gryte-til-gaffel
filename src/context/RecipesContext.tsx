import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { localRecipes, type Recipe } from '../data/recipes'
import { mapRowToRecipe, type RecipeRow } from '../lib/recipeMapper'
import { hasSpotifyMood } from '../lib/spotifyLink'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  USER_ERRORS,
  logTechError,
  toUserLoadError,
} from '../lib/userErrors'

/** Dev-only: show local seed mood when cloud row has none (before SQL/admin fill). */
function withLocalSpotifyDemo(recipes: Recipe[]): Recipe[] {
  if (!import.meta.env.DEV) return recipes
  const localById = new Map(localRecipes.map((r) => [r.id, r]))
  return recipes.map((recipe) => {
    if (hasSpotifyMood(recipe)) return recipe
    const local = localById.get(recipe.id)
    if (!local || !hasSpotifyMood(local)) return recipe
    return {
      ...recipe,
      spotifyTitle: local.spotifyTitle ?? null,
      spotifyArtist: local.spotifyArtist ?? null,
      spotifyUrl: local.spotifyUrl ?? null,
      spotifyCodeImage: local.spotifyCodeImage ?? null,
    }
  })
}

type RecipesContextValue = {
  recipes: Recipe[]
  loading: boolean
  error: string | null
  source: 'supabase' | 'local'
  refresh: () => Promise<void>
  getById: (id: string) => Recipe | undefined
}

const RecipesContext = createContext<RecipesContextValue | null>(null)

function supabaseUrl(): string {
  return (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
}

function safeMapRows(rows: RecipeRow[], url: string): Recipe[] {
  const mapped: Recipe[] = []
  for (const row of rows) {
    try {
      if (!row || typeof row !== 'object' || !row.id) continue
      mapped.push(mapRowToRecipe(row, url))
    } catch (err) {
      logTechError('RecipesContext.map', err)
    }
  }
  return mapped
}

export function RecipesProvider({ children }: { children: ReactNode }) {
  // With Supabase, start empty so first paint can show skeletons until fetch
  // settles (cloud rows or local fallback). Without Supabase, seed is instant.
  const [recipes, setRecipes] = useState<Recipe[]>(
    isSupabaseConfigured ? [] : localRecipes,
  )
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'supabase' | 'local'>('local')

  const refresh = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setRecipes(localRecipes)
      setSource('local')
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_published', true)
        .order('name', { ascending: true })

      if (fetchError) {
        logTechError('RecipesContext.fetch', fetchError)
        setRecipes(localRecipes)
        setSource('local')
        setError(USER_ERRORS.cloudFallback)
        setLoading(false)
        return
      }

      const rows = (data as RecipeRow[] | null) ?? []
      if (!Array.isArray(rows) || rows.length === 0) {
        setRecipes(localRecipes)
        setSource('local')
        setError(null)
        setLoading(false)
        return
      }

      const url = supabaseUrl()
      const mapped = withLocalSpotifyDemo(safeMapRows(rows, url))
      if (mapped.length === 0) {
        setRecipes(localRecipes)
        setSource('local')
        setError(USER_ERRORS.cloudFallback)
        setLoading(false)
        return
      }

      setRecipes(mapped)
      setSource('supabase')
      setError(null)
      setLoading(false)
    } catch (err) {
      setRecipes(localRecipes)
      setSource('local')
      setError(toUserLoadError(err, 'RecipesContext'))
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<RecipesContextValue>(
    () => ({
      recipes,
      loading,
      error,
      source,
      refresh,
      getById(id: string) {
        return recipes.find((recipe) => recipe.id === id)
      },
    }),
    [recipes, loading, error, source, refresh],
  )

  return (
    <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>
  )
}

export function useRecipes() {
  const ctx = useContext(RecipesContext)
  if (!ctx) throw new Error('useRecipes must be used within RecipesProvider')
  return ctx
}
