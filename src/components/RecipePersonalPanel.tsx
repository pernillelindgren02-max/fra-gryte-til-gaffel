import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRecipeNote } from '../hooks/useRecipeNote'
import './RecipePersonalPanel.css'

interface RecipePersonalPanelProps {
  recipeId: string
}

/** Private notes only — folders/favorites are handled by SaveSheet. */
export function RecipePersonalPanel({ recipeId }: RecipePersonalPanelProps) {
  const { user, configured } = useAuth()
  const { body, loading, saving, error, saveNote, deleteNote, setBodyLocal } =
    useRecipeNote(recipeId)
  const [draftNote, setDraftNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setDraftNote(body)
  }, [body])

  if (!configured) {
    return (
      <section className="personal-panel">
        <h2 className="personal-panel__title">Privat notat</h2>
        <p className="personal-panel__hint">
          Notater krever Supabase. Se README for oppsett av nøkler.
        </p>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="personal-panel">
        <h2 className="personal-panel__title">Privat notat</h2>
        <p className="personal-panel__hint">
          <Link to="/konto">Logg inn</Link> for å lagre private notater.
        </p>
      </section>
    )
  }

  async function onSaveNote() {
    const err = await saveNote(draftNote)
    setMessage(err ?? 'Notat lagret.')
  }

  async function onDeleteNote() {
    const err = await deleteNote()
    if (!err) {
      setDraftNote('')
      setBodyLocal('')
      setMessage('Notat slettet.')
    } else {
      setMessage(err)
    }
  }

  return (
    <section className="personal-panel">
      <h2 className="personal-panel__title">Privat notat</h2>
      {loading ? (
        <p className="personal-panel__hint">Laster notat…</p>
      ) : (
        <>
          <textarea
            className="personal-panel__textarea"
            rows={4}
            placeholder="Egne tips, bytter, porsjoner…"
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
          />
          <div className="personal-panel__actions">
            <button
              type="button"
              className="personal-panel__btn personal-panel__btn--primary"
              onClick={() => void onSaveNote()}
              disabled={saving}
            >
              {saving ? 'Lagrer…' : 'Lagre notat'}
            </button>
            {body && (
              <button
                type="button"
                className="personal-panel__btn personal-panel__btn--ghost"
                onClick={() => void onDeleteNote()}
              >
                Slett
              </button>
            )}
          </div>
        </>
      )}
      {error && <p className="personal-panel__message">{error}</p>}
      {message && <p className="personal-panel__message">{message}</p>}
    </section>
  )
}
