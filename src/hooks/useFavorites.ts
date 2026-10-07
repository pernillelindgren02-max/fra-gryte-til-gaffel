import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { logTechError, toUserSaveError } from '../lib/userErrors'

export function useFavorites() {
  const { user } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [favoritesLoading, setFavoritesLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setFavoriteIds(new Set())
      setFavoritesLoading(false)
      return
    }
    setFavoritesLoading(true)
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('recipe_id')
        .eq('user_id', user.id)
      if (error || !data) {
        if (error) logTechError('favorites.refresh', error)
        setFavoriteIds(new Set())
        setFavoritesLoading(false)
        return
      }
      setFavoriteIds(
        new Set(
          data
            .map((row) => row.recipe_id as string)
            .filter((id) => typeof id === 'string' && id.trim()),
        ),
      )
    } catch (err) {
      logTechError('favorites.refresh', err)
      setFavoriteIds(new Set())
    }
    setFavoritesLoading(false)
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
        if (error) {
          toUserSaveError(error, 'favorites.remove')
          return 'error'
        }
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
        if (error) {
          toUserSaveError(error, 'favorites.add')
          return 'error'
        }
        setFavoriteIds((prev) => new Set(prev).add(recipeId))
      }
      return 'ok'
    },
    [favoriteIds, user],
  )

  return { favoriteIds, favoritesLoading, isFavorite, toggleFavorite, refresh }
}
