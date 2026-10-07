import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { USER_ERRORS, toUserLoadError, toUserSaveError } from '../lib/userErrors'

export function useRecipeNote(recipeId: string) {
  const { user } = useAuth()
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setBody('')
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('recipe_notes')
        .select('body')
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId)
        .maybeSingle()
      if (fetchError) {
        setError(toUserLoadError(fetchError, 'notes.refresh'))
        // Keep existing draft/body if we already have local text
        setLoading(false)
        return
      }
      setBody((data?.body ?? '').trim())
      setError(null)
    } catch (err) {
      setError(toUserLoadError(err, 'notes.refresh'))
    }
    setLoading(false)
  }, [recipeId, user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function saveNote(nextBody: string): Promise<string | null> {
    if (!supabase || !user) return USER_ERRORS.login
    setSaving(true)
    const trimmed = nextBody.trim()
    try {
      if (!trimmed) {
        const { error: delError } = await supabase
          .from('recipe_notes')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId)
        setSaving(false)
        if (delError) {
          const msg = toUserSaveError(delError, 'notes.delete')
          setError(msg)
          return msg
        }
        setBody('')
        setError(null)
        return null
      }

      const { error: upsertError } = await supabase.from('recipe_notes').upsert(
        {
          user_id: user.id,
          recipe_id: recipeId,
          body: trimmed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,recipe_id' },
      )
      setSaving(false)
      if (upsertError) {
        const msg = toUserSaveError(upsertError, 'notes.save')
        setError(msg)
        return msg
      }
      setBody(trimmed)
      setError(null)
      return null
    } catch (err) {
      setSaving(false)
      const msg = toUserSaveError(err, 'notes.save')
      setError(msg)
      return msg
    }
  }

  async function deleteNote(): Promise<string | null> {
    return saveNote('')
  }

  return {
    body,
    loading,
    saving,
    error,
    saveNote,
    deleteNote,
    setBodyLocal: setBody,
    refresh,
  }
}
