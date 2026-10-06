import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase, type FolderRow } from '../lib/supabase'

export function useFolders() {
  const { user } = useAuth()
  const [folders, setFolders] = useState<FolderRow[]>([])
  const [folderRecipeIds, setFolderRecipeIds] = useState<
    Record<string, string[]>
  >({})
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setFolders([])
      setFolderRecipeIds({})
      return
    }
    setLoading(true)
    const { data: folderData } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    const nextFolders = (folderData as FolderRow[] | null) ?? []
    setFolders(nextFolders)

    if (nextFolders.length === 0) {
      setFolderRecipeIds({})
      setLoading(false)
      return
    }

    const { data: links } = await supabase
      .from('folder_recipes')
      .select('folder_id, recipe_id')
      .in(
        'folder_id',
        nextFolders.map((f) => f.id),
      )

    const map: Record<string, string[]> = {}
    for (const folder of nextFolders) map[folder.id] = []
    for (const row of links ?? []) {
      const fid = row.folder_id as string
      const rid = row.recipe_id as string
      if (!map[fid]) map[fid] = []
      map[fid].push(rid)
    }
    setFolderRecipeIds(map)
    setLoading(false)
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function createFolder(name: string): Promise<string | null> {
    if (!supabase || !user) return 'Du må være innlogget.'
    const trimmed = name.trim()
    if (!trimmed) return 'Gi mappen et navn.'
    const { error } = await supabase.from('folders').insert({
      user_id: user.id,
      name: trimmed,
    })
    if (error) return error.message
    await refresh()
    return null
  }

  async function renameFolder(id: string, name: string): Promise<string | null> {
    if (!supabase || !user) return 'Du må være innlogget.'
    const trimmed = name.trim()
    if (!trimmed) return 'Gi mappen et navn.'
    const { error } = await supabase
      .from('folders')
      .update({ name: trimmed })
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) return error.message
    await refresh()
    return null
  }

  async function deleteFolder(id: string): Promise<string | null> {
    if (!supabase || !user) return 'Du må være innlogget.'
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) return error.message
    await refresh()
    return null
  }

  async function setRecipeInFolder(
    folderId: string,
    recipeId: string,
    included: boolean,
  ): Promise<string | null> {
    if (!supabase || !user) return 'Du må være innlogget.'
    if (included) {
      const { error } = await supabase.from('folder_recipes').insert({
        folder_id: folderId,
        recipe_id: recipeId,
      })
      if (error && !error.message.toLowerCase().includes('duplicate')) {
        return error.message
      }
    } else {
      const { error } = await supabase
        .from('folder_recipes')
        .delete()
        .eq('folder_id', folderId)
        .eq('recipe_id', recipeId)
      if (error) return error.message
    }
    await refresh()
    return null
  }

  function foldersForRecipe(recipeId: string): string[] {
    return Object.entries(folderRecipeIds)
      .filter(([, ids]) => ids.includes(recipeId))
      .map(([folderId]) => folderId)
  }

  return {
    folders,
    folderRecipeIds,
    loading,
    refresh,
    createFolder,
    renameFolder,
    deleteFolder,
    setRecipeInFolder,
    foldersForRecipe,
  }
}
