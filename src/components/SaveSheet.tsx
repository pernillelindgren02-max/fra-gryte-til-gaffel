import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useUserData } from '../context/UserDataContext'
import { USER_ERRORS } from '../lib/userErrors'
import './SaveSheet.css'

interface SaveSheetProps {
  open: boolean
  recipeId: string
  onClose: () => void
}

export function SaveSheet({ open, recipeId, onClose }: SaveSheetProps) {
  const { user, configured } = useAuth()
  const {
    folders,
    isFavorite,
    toggleFavorite,
    foldersForRecipe,
    setRecipeInFolder,
    createFolder,
    error: foldersError,
  } = useUserData()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [message, setMessage] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const selectedFolderIds = foldersForRecipe(recipeId)
  const liked = isFavorite(recipeId)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setCreating(false)
      setNewName('')
      setMessage(null)
    }
  }, [open])

  if (!open) return null

  async function onToggleFavorite() {
    if (!user) {
      navigate('/konto', { state: { from: `/oppskrift/${recipeId}` } })
      return
    }
    const wasLiked = liked
    setBusy(true)
    const result = await toggleFavorite(recipeId)
    setBusy(false)
    if (result === 'login') {
      navigate('/konto', { state: { from: `/oppskrift/${recipeId}` } })
      return
    }
    if (result === 'error') {
      setMessage(USER_ERRORS.save)
      showToast(USER_ERRORS.save)
      return
    }
    showToast(
      wasLiked ? 'Fjernet fra favoritter.' : 'Lagret i favoritter.',
    )
  }

  async function onToggleFolder(folderId: string, next: boolean) {
    if (!user) {
      navigate('/konto', { state: { from: `/oppskrift/${recipeId}` } })
      return
    }
    const folderName =
      folders.find((folder) => folder.id === folderId)?.name ?? 'mappen'
    setBusy(true)
    const err = await setRecipeInFolder(folderId, recipeId, next)
    setBusy(false)
    if (err) {
      setMessage(err)
      showToast(err)
      return
    }
    setMessage(null)
    showToast(
      next
        ? `Lagret i «${folderName}».`
        : `Fjernet fra «${folderName}».`,
    )
  }

  async function onCreateFolder(event: FormEvent) {
    event.preventDefault()
    if (!user) {
      navigate('/konto', { state: { from: `/oppskrift/${recipeId}` } })
      return
    }
    setBusy(true)
    const { error, id } = await createFolder(newName)
    if (error || !id) {
      setBusy(false)
      const msg = error ?? USER_ERRORS.save
      setMessage(msg)
      showToast(msg)
      return
    }
    const addErr = await setRecipeInFolder(id, recipeId, true)
    setBusy(false)
    if (addErr) {
      setMessage(addErr)
      showToast(addErr)
      return
    }
    const createdName = newName.trim()
    setNewName('')
    setCreating(false)
    setMessage(null)
    showToast(
      createdName
        ? `Mappe «${createdName}» opprettet.`
        : 'Mappe opprettet og oppskriften lagt til.',
    )
  }

  return (
    <div className="save-sheet" role="presentation">
      <button
        type="button"
        className="save-sheet__backdrop"
        aria-label="Lukk"
        onClick={onClose}
      />
      <div
        className="save-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-sheet-title"
      >
        <div className="save-sheet__handle" aria-hidden="true" />
        <header className="save-sheet__header">
          <h2 id="save-sheet-title" className="save-sheet__title">
            Lagre oppskrift
          </h2>
        </header>

        <div className="save-sheet__body">
          {!configured && (
            <p className="save-sheet__hint">
              Supabase er ikke satt opp ennå. Se README for nøkler.
            </p>
          )}

          {configured && !user && (
            <p className="save-sheet__hint">
              <button
                type="button"
                className="save-sheet__link"
                onClick={() =>
                  navigate('/konto', {
                    state: { from: `/oppskrift/${recipeId}` },
                  })
                }
              >
                Logg inn
              </button>{' '}
              for å lagre i Favoritter eller mapper.
            </p>
          )}

          {configured && user && (
            <>
              {foldersError && (
                <p className="save-sheet__message">{foldersError}</p>
              )}

              <ul className="save-sheet__list">
                <li>
                  <button
                    type="button"
                    className={`save-sheet__row${liked ? ' save-sheet__row--on' : ''}`}
                    onClick={() => void onToggleFavorite()}
                    disabled={busy}
                  >
                    <span className="save-sheet__row-label">Favoritter</span>
                    <span className="save-sheet__check" aria-hidden="true">
                      {liked ? '✓' : ''}
                    </span>
                  </button>
                </li>
                {folders.map((folder) => {
                  const on = selectedFolderIds.includes(folder.id)
                  return (
                    <li key={folder.id}>
                      <button
                        type="button"
                        className={`save-sheet__row${on ? ' save-sheet__row--on' : ''}`}
                        onClick={() => void onToggleFolder(folder.id, !on)}
                        disabled={busy}
                      >
                        <span className="save-sheet__row-label">
                          {folder.name}
                        </span>
                        <span className="save-sheet__check" aria-hidden="true">
                          {on ? '✓' : ''}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              {creating ? (
                <form className="save-sheet__create" onSubmit={onCreateFolder}>
                  <input
                    type="text"
                    placeholder="Navn på mappe…"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" disabled={busy}>
                    Opprett
                  </button>
                  <button
                    type="button"
                    className="save-sheet__cancel"
                    onClick={() => {
                      setCreating(false)
                      setNewName('')
                    }}
                  >
                    Avbryt
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  className="save-sheet__new"
                  onClick={() => setCreating(true)}
                  disabled={busy}
                >
                  + Ny mappe
                </button>
              )}

              {message && <p className="save-sheet__message">{message}</p>}
            </>
          )}
        </div>

        <div className="save-sheet__footer">
          <button type="button" className="save-sheet__done" onClick={onClose}>
            Ferdig
          </button>
        </div>
      </div>
    </div>
  )
}
