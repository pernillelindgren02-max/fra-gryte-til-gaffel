import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function useFavorites() {
  const { user } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setFavoriteIds(new Set())
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('favorites')
      .select('recipe_id')
      .eq('user_id', user.id)
    setLoading(false)
    if (error || !data) {
      setFavoriteIds(new Set())
      return
    }
    setFavoriteIds(new Set(data.map((row) => row.recipe_id as string)))
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const isFavorite = useCallback(
    (recipeId: string) => favoriteIds.has(recipeId),
    [favoriteIds],
  )

  const toggleFavorite = useCallback(
    async (recipeId: string): Promise<'ok' | 'login' | 'error'> => {
      if (!supabase || !user) return 'login'
      const liked = favoriteIds.has(recipeId)
      if (liked) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId)
        if (error) return 'error'
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          next.delete(recipeId)
          return next
        })
      } else {
        const { error } = await supabase.from('favorites').insert({
          user_id: user.id,
          recipe_id: recipeId,
        })
        if (error) return 'error'
        setFavoriteIds((prev) => new Set(prev).add(recipeId))
      }
      return 'ok'
    },
    [favoriteIds, user],
  )

  return { favoriteIds, loading, isFavorite, toggleFavorite, refresh }
}
