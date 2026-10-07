import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase, translateDbError, type FolderRow } from '../lib/supabase'

export function useFolders() {
  const { user } = useAuth()
  const [folders, setFolders] = useState<FolderRow[]>([])
  const [folderRecipeIds, setFolderRecipeIds] = useState<
    Record<string, string[]>
  >({})
  const [foldersLoading, setFoldersLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setFolders([])
      setFolderRecipeIds({})
      setError(null)
      setFoldersLoading(false)
      return
    }
    setFoldersLoading(true)
    const { data: folderData, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (folderError) {
      setFolders([])
      setFolderRecipeIds({})
      setError(translateDbError(folderError.message))
      setFoldersLoading(false)
      return
    }

    const nextFolders = (folderData as FolderRow[] | null) ?? []
    setFolders(nextFolders)

    if (nextFolders.length === 0) {
      setFolderRecipeIds({})
      setError(null)
      setFoldersLoading(false)
      return
    }

    const { data: links, error: linkError } = await supabase
      .from('folder_recipes')
      .select('folder_id, recipe_id')
      .in(
        'folder_id',
        nextFolders.map((f) => f.id),
      )

    if (linkError) {
      setFolderRecipeIds({})
      setError(translateDbError(linkError.message))
      setFoldersLoading(false)
      return
    }

    const map: Record<string, string[]> = {}
    for (const folder of nextFolders) map[folder.id] = []
    for (const row of links ?? []) {
      const fid = row.folder_id as string
      const rid = row.recipe_id as string
      if (!map[fid]) map[fid] = []
      map[fid].push(rid)
    }
    setFolderRecipeIds(map)
    setError(null)
    setFoldersLoading(false)
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function createFolder(
    name: string,
  ): Promise<{ error: string | null; id?: string }> {
    if (!supabase || !user) return { error: 'Du må være innlogget.' }
    const trimmed = name.trim()
    if (!trimmed) return { error: 'Gi mappen et navn.' }
    const { data, error: insertError } = await supabase
      .from('folders')
      .insert({
        user_id: user.id,
        name: trimmed,
      })
      .select('id')
      .single()
    if (insertError) {
      const msg = translateDbError(insertError.message)
      setError(msg)
      return { error: msg }
    }
    await refresh()
    return { error: null, id: data?.id as string | undefined }
  }

  async function renameFolder(id: string, name: string): Promise<string | null> {
    if (!supabase || !user) return 'Du må være innlogget.'
    const trimmed = name.trim()
    if (!trimmed) return 'Gi mappen et navn.'
    const { error: updateError } = await supabase
      .from('folders')
      .update({ name: trimmed })
      .eq('id', id)
      .eq('user_id', user.id)
    if (updateError) {
      const msg = translateDbError(updateError.message)
      setError(msg)
      return msg
    }
    await refresh()
    return null
  }

  async function deleteFolder(id: string): Promise<string | null> {
    if (!supabase || !user) return 'Du må være innlogget.'
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (deleteError) {
      const msg = translateDbError(deleteError.message)
      setError(msg)
      return msg
    }
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
      const { error: insertError } = await supabase.from('folder_recipes').insert({
        folder_id: folderId,
        recipe_id: recipeId,
      })
      if (
        insertError &&
        !insertError.message.toLowerCase().includes('duplicate')
      ) {
        const msg = translateDbError(insertError.message)
        setError(msg)
        return msg
      }
    } else {
      const { error: deleteError } = await supabase
        .from('folder_recipes')
        .delete()
        .eq('folder_id', folderId)
        .eq('recipe_id', recipeId)
      if (deleteError) {
        const msg = translateDbError(deleteError.message)
        setError(msg)
        return msg
      }
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
    foldersLoading,
    error,
    refresh,
    createFolder,
    renameFolder,
    deleteFolder,
    setRecipeInFolder,
    foldersForRecipe,
  }
}
