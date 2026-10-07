import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase, type FolderRow } from '../lib/supabase'
import {
  USER_ERRORS,
  toUserLoadError,
  toUserSaveError,
} from '../lib/userErrors'

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
    try {
      const { data: folderData, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (folderError) {
        setFolders([])
        setFolderRecipeIds({})
        setError(toUserLoadError(folderError, 'folders.refresh'))
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
        setError(toUserLoadError(linkError, 'folders.links'))
        setFoldersLoading(false)
        return
      }

      const map: Record<string, string[]> = {}
      for (const folder of nextFolders) map[folder.id] = []
      for (const row of links ?? []) {
        const fid = row.folder_id as string
        const rid = row.recipe_id as string
        if (!fid || !rid) continue
        if (!map[fid]) map[fid] = []
        map[fid].push(rid)
      }
      setFolderRecipeIds(map)
      setError(null)
    } catch (err) {
      setFolders([])
      setFolderRecipeIds({})
      setError(toUserLoadError(err, 'folders.refresh'))
    }
    setFoldersLoading(false)
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function createFolder(
    name: string,
  ): Promise<{ error: string | null; id?: string }> {
    if (!supabase || !user) return { error: USER_ERRORS.login }
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
      const msg = toUserSaveError(insertError, 'folders.create')
      setError(msg)
      return { error: msg }
    }
    await refresh()
    return { error: null, id: data?.id as string | undefined }
  }

  async function renameFolder(id: string, name: string): Promise<string | null> {
    if (!supabase || !user) return USER_ERRORS.login
    const trimmed = name.trim()
    if (!trimmed) return 'Gi mappen et navn.'
    const { error: updateError } = await supabase
      .from('folders')
      .update({ name: trimmed })
      .eq('id', id)
      .eq('user_id', user.id)
    if (updateError) {
      const msg = toUserSaveError(updateError, 'folders.rename')
      setError(msg)
      return msg
    }
    await refresh()
    return null
  }

  async function deleteFolder(id: string): Promise<string | null> {
    if (!supabase || !user) return USER_ERRORS.login
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (deleteError) {
      const msg = toUserSaveError(deleteError, 'folders.delete')
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
    if (!supabase || !user) return USER_ERRORS.login
    if (included) {
      const { error: insertError } = await supabase.from('folder_recipes').insert({
        folder_id: folderId,
        recipe_id: recipeId,
      })
      if (
        insertError &&
        !insertError.message.toLowerCase().includes('duplicate')
      ) {
        const msg = toUserSaveError(insertError, 'folders.addRecipe')
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
        const msg = toUserSaveError(deleteError, 'folders.removeRecipe')
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
