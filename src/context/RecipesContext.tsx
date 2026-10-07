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
import { isSupabaseConfigured, supabase } from '../lib/supabase'

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

export function RecipesProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>(localRecipes)
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
    const { data, error: fetchError } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_published', true)
      .order('name', { ascending: true })

    if (fetchError) {
      // Table missing or RLS — fall back to local seed so the app still works.
      setRecipes(localRecipes)
      setSource('local')
      setError(fetchError.message)
      setLoading(false)
      return
    }

    const rows = (data as RecipeRow[] | null) ?? []
    if (rows.length === 0) {
      setRecipes(localRecipes)
      setSource('local')
      setError(null)
      setLoading(false)
      return
    }

    const url = supabaseUrl()
    setRecipes(rows.map((row) => mapRowToRecipe(row, url)))
    setSource('supabase')
    setError(null)
    setLoading(false)
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
