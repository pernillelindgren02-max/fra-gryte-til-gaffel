import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase, translateDbError } from '../lib/supabase'

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
    const { data, error: fetchError } = await supabase
      .from('recipe_notes')
      .select('body')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)
      .maybeSingle()
    setLoading(false)
    if (fetchError) {
      setError(translateDbError(fetchError.message))
      setBody('')
      return
    }
    setBody((data?.body ?? '').trim())
    setError(null)
  }, [recipeId, user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function saveNote(nextBody: string): Promise<string | null> {
    if (!supabase || !user) return 'Du må være innlogget.'
    setSaving(true)
    const trimmed = nextBody.trim()
    if (!trimmed) {
      const { error: delError } = await supabase
        .from('recipe_notes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId)
      setSaving(false)
      if (delError) {
        const msg = translateDbError(delError.message)
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
      const msg = translateDbError(upsertError.message)
      setError(msg)
      return msg
    }
    setBody(trimmed)
    setError(null)
    return null
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
