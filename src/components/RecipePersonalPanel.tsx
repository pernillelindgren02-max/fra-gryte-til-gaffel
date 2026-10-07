import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useRecipeNote } from '../hooks/useRecipeNote'
import { USER_ERRORS } from '../lib/userErrors'
import { InlineError } from './InlineError'
import './RecipePersonalPanel.css'

interface RecipePersonalPanelProps {
  recipeId: string
}

/** Subtle private comment — opens compact editor only when needed. */
export function RecipePersonalPanel({ recipeId }: RecipePersonalPanelProps) {
  const { user, configured } = useAuth()
  const { showToast } = useToast()
  const { body, loading, saving, error, saveNote, deleteNote, refresh } =
    useRecipeNote(recipeId)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!editing) setDraft(body)
  }, [body, editing])

  useEffect(() => {
    if (!editing) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setEditing(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [editing])

  function openEditor() {
    setDraft(body)
    setMessage(null)
    setEditing(true)
  }

  async function onSave(event: FormEvent) {
    event.preventDefault()
    const err = await saveNote(draft)
    if (err) {
      setMessage(err)
      showToast(err)
      return
    }
    setEditing(false)
    setMessage(null)
    showToast('Kommentar lagret.')
  }

  async function onDelete() {
    const previous = draft
    const err = await deleteNote()
    if (err) {
      setDraft(previous)
      setMessage(err)
      showToast(err)
      return
    }
    setDraft('')
    setEditing(false)
    setMessage(null)
  }

  if (!configured) {
    return (
      <section className="kommentar">
        <p className="kommentar__hint">
          Kommentar krever Supabase. Se README for nøkler.
        </p>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="kommentar">
        <p className="kommentar__hint">
          <Link to="/konto">Logg inn</Link> for å legge til en kommentar.
        </p>
      </section>
    )
  }

  return (
    <section className="kommentar">
      {loading ? (
        <p className="kommentar__hint">Laster…</p>
      ) : body ? (
        <div className="kommentar__existing">
          <div className="kommentar__existing-head">
            <h2 className="kommentar__label">Min kommentar</h2>
            <button
              type="button"
              className="kommentar__text-btn"
              onClick={openEditor}
            >
              Rediger
            </button>
          </div>
          <p className="kommentar__body">{body}</p>
        </div>
      ) : (
        <button
          type="button"
          className="kommentar__add"
          onClick={openEditor}
        >
          Legg til kommentar
        </button>
      )}

      {error && !editing && (
        <InlineError
          compact
          message={error}
          onRetry={() => void refresh()}
        />
      )}
      {message && !editing && !error && (
        <p className="kommentar__message">{message}</p>
      )}

      {editing && (
        <div className="kommentar-sheet" role="presentation">
          <button
            type="button"
            className="kommentar-sheet__backdrop"
            aria-label="Lukk"
            onClick={() => setEditing(false)}
          />
          <form
            className="kommentar-sheet__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kommentar-sheet-title"
            onSubmit={onSave}
          >
            <div className="kommentar-sheet__handle" aria-hidden="true" />
            <h2 id="kommentar-sheet-title" className="kommentar-sheet__title">
              Kommentar
            </h2>
            <textarea
              className="kommentar-sheet__textarea"
              rows={4}
              placeholder="Egne tips, bytter, porsjoner…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            {(message || error) && (
              <InlineError
                compact
                message={message ?? error}
                onRetry={
                  error
                    ? () => {
                        void refresh()
                      }
                    : undefined
                }
                retryLabel={USER_ERRORS.retry}
              />
            )}
            <div className="kommentar-sheet__actions">
              {body && (
                <button
                  type="button"
                  className="kommentar-sheet__ghost"
                  onClick={() => void onDelete()}
                  disabled={saving}
                >
                  Slett
                </button>
              )}
              <button
                type="button"
                className="kommentar-sheet__secondary"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="kommentar-sheet__primary"
                disabled={saving}
              >
                {saving ? 'Lagrer…' : 'Lagre'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
