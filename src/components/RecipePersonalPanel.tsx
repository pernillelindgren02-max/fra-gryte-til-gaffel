import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUserData } from '../context/UserDataContext'
import { useRecipeNote } from '../hooks/useRecipeNote'
import './RecipePersonalPanel.css'

interface RecipePersonalPanelProps {
  recipeId: string
}

export function RecipePersonalPanel({ recipeId }: RecipePersonalPanelProps) {
  const { user, configured } = useAuth()
  const {
    folders,
    foldersForRecipe,
    setRecipeInFolder,
    createFolder,
  } = useUserData()
  const { body, loading, saving, error, saveNote, deleteNote, setBodyLocal } =
    useRecipeNote(recipeId)
  const [draftNote, setDraftNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const selectedFolderIds = foldersForRecipe(recipeId)

  useEffect(() => {
    setDraftNote(body)
  }, [body])

  if (!configured) {
    return (
      <section className="personal-panel">
        <h2 className="personal-panel__title">Dine ting</h2>
        <p className="personal-panel__hint">
          Favoritter, mapper og notater krever Supabase. Se README for oppsett
          av nøkler.
        </p>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="personal-panel">
        <h2 className="personal-panel__title">Dine ting</h2>
        <p className="personal-panel__hint">
          <Link to="/konto">Logg inn</Link> for å lagre favoritter, mapper og
          private notater.
        </p>
      </section>
    )
  }

  async function onToggleFolder(folderId: string, checked: boolean) {
    const err = await setRecipeInFolder(folderId, recipeId, checked)
    setMessage(err)
  }

  async function onCreateFolder(event: FormEvent) {
    event.preventDefault()
    const err = await createFolder(newFolderName)
    if (!err) {
      setNewFolderName('')
      setMessage('Mappe opprettet.')
    } else {
      setMessage(err)
    }
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
      <h2 className="personal-panel__title">Dine ting</h2>

      <div className="personal-panel__block">
        <h3 className="personal-panel__subtitle">Mapper</h3>
        {folders.length === 0 ? (
          <p className="personal-panel__hint">
            Ingen mapper ennå. Lag f.eks. «Tur», «Ukesmeny» eller «Billig».
          </p>
        ) : (
          <ul className="personal-panel__folder-list">
            {folders.map((folder) => {
              const checked = selectedFolderIds.includes(folder.id)
              return (
                <li key={folder.id}>
                  <label className="personal-panel__check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        void onToggleFolder(folder.id, e.target.checked)
                      }
                    />
                    <span>{folder.name}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
        <form className="personal-panel__row" onSubmit={onCreateFolder}>
          <input
            type="text"
            className="personal-panel__input"
            placeholder="Ny mappe…"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <button type="submit" className="personal-panel__btn">
            Legg til
          </button>
        </form>
      </div>

      <div className="personal-panel__block">
        <h3 className="personal-panel__subtitle">Privat notat</h3>
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
      </div>

      {error && <p className="personal-panel__message">{error}</p>}
      {message && <p className="personal-panel__message">{message}</p>}
    </section>
  )
}
