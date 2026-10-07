import { useState, type FormEvent, type MouseEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RecipeCard } from '../components/RecipeCard'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useUserData } from '../context/UserDataContext'
import { useRecipes } from '../context/RecipesContext'
import { useSiteContent } from '../context/SiteContentContext'
import type { Recipe } from '../data/recipes'
import './AccountLists.css'

const DEFAULT_FOLDER_KEY = 'favoritter'

function recipesFromIds(
  ids: Iterable<string>,
  getById: (id: string) => Recipe | undefined,
) {
  return [...ids]
    .map((id) => getById(id))
    .filter((recipe): recipe is NonNullable<typeof recipe> => Boolean(recipe))
}

function countLabel(n: number) {
  if (n === 0) return 'Tom'
  if (n === 1) return '1 oppskrift'
  return `${n} oppskrifter`
}

export function FavoritesPage() {
  const { folderKey } = useParams<{ folderKey?: string }>()
  const navigate = useNavigate()
  const { user, configured, loading } = useAuth()
  const { getById } = useRecipes()
  const { getCopy } = useSiteContent()
  const { showToast } = useToast()
  const {
    favoriteIds,
    folders,
    folderRecipeIds,
    createFolder,
    renameFolder,
    deleteFolder,
    error: foldersError,
  } = useUserData()
  const [newName, setNewName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const favoriteCount = favoriteIds.size
  const statusMessage = message ?? foldersError
  const openFolder =
    folderKey && folderKey !== DEFAULT_FOLDER_KEY
      ? folders.find((f) => f.id === folderKey)
      : null
  const viewingDefault = folderKey === DEFAULT_FOLDER_KEY
  const viewingFolder = viewingDefault || Boolean(openFolder)

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    const label = newName.trim()
    const { error } = await createFolder(newName)
    setMessage(error)
    if (!error) {
      setNewName('')
      showToast(label ? `Mappen «${label}» er opprettet.` : 'Mappe opprettet.')
    }
  }

  async function onRename(id: string) {
    const err = await renameFolder(id, editName)
    setMessage(err)
    if (!err) {
      setEditingId(null)
      showToast('Mappen er omdøpt.')
    }
  }

  async function onDelete(id: string, name: string) {
    if (!window.confirm(`Slette mappen «${name}»?`)) return
    const err = await deleteFolder(id)
    setMessage(err)
    if (!err) {
      showToast(`Mappen «${name}» er slettet.`)
      if (folderKey === id) navigate('/favoritter')
    }
  }

  function stopAnd(event: MouseEvent, action: () => void) {
    event.preventDefault()
    event.stopPropagation()
    action()
  }

  if (user && folderKey && !viewingDefault && !openFolder && !foldersError) {
    return (
      <div className="account-list">
        <Link to="/favoritter" className="account-list__back">
          ← Alle mapper
        </Link>
        <p className="account-list__empty">Fant ikke mappen.</p>
      </div>
    )
  }

  if (user && viewingFolder) {
    const title = viewingDefault ? 'Favoritter' : (openFolder?.name ?? '')
    const recipes = viewingDefault
      ? recipesFromIds(favoriteIds, getById)
      : recipesFromIds(folderRecipeIds[openFolder!.id] ?? [], getById)

    return (
      <div className="account-list">
        <Link to="/favoritter" className="account-list__back">
          ← Alle mapper
        </Link>
        <header className="account-list__header">
          <h1 className="account-list__title">
            {viewingDefault ? (
              <span className="account-list__title-row">
                <span className="account-list__heart" aria-hidden="true">
                  ♥
                </span>
                Favoritter
              </span>
            ) : (
              title
            )}
          </h1>
          <p className="account-list__lead">{countLabel(recipes.length)}</p>
        </header>

        {recipes.length === 0 ? (
          <p className="account-list__empty">
            {viewingDefault
              ? getCopy(
                  'favoritter.empty',
                  'Ingen favoritter ennå. Åpne en oppskrift og trykk Lagre.',
                )
              : 'Tom mappe — lagre oppskrifter hit fra detaljsiden.'}
          </p>
        ) : (
          <ul className="account-list__grid">
            {recipes.map((recipe) => (
              <li key={recipe.id}>
                <RecipeCard recipe={recipe} layout="grid" />
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="account-list">
      <header className="account-list__header">
        <h1 className="account-list__title">Favoritter</h1>
        <p className="account-list__lead">
          Samle favorittene dine på ett sted.
        </p>
      </header>

      {!configured && (
        <p className="account-list__empty">
          Supabase er ikke konfigurert. Se README for nøkler og schema.
        </p>
      )}

      {configured && !loading && !user && (
        <p className="account-list__empty">
          <Link to="/konto">Logg inn</Link> for å se lagrede oppskrifter.
        </p>
      )}

      {user && (
        <>
          <form className="account-list__create" onSubmit={onCreate}>
            <input
              type="text"
              placeholder="Ny mappe…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button type="submit">Opprett</button>
          </form>
          {statusMessage && (
            <p className="account-list__message">{statusMessage}</p>
          )}

          <ul className="folder-library">
            <li>
              <Link
                to={`/favoritter/${DEFAULT_FOLDER_KEY}`}
                className="folder-tile folder-tile--default"
              >
                <span className="folder-tile__icon" aria-hidden="true">
                  ♥
                </span>
                <span className="folder-tile__body">
                  <span className="folder-tile__name">Favoritter</span>
                  <span className="folder-tile__count">
                    {countLabel(favoriteCount)}
                  </span>
                </span>
                <span className="folder-tile__chevron" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>

            {!foldersError &&
              folders.map((folder) => {
                const count = (folderRecipeIds[folder.id] ?? []).length
                const editing = editingId === folder.id
                return (
                  <li key={folder.id}>
                    {editing ? (
                      <div className="folder-tile folder-tile--edit">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          aria-label="Nytt mappenavn"
                        />
                        <button
                          type="button"
                          onClick={() => void onRename(folder.id)}
                        >
                          Lagre
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                        >
                          Avbryt
                        </button>
                      </div>
                    ) : (
                      <div className="folder-tile">
                        <Link
                          to={`/favoritter/${folder.id}`}
                          className="folder-tile__main"
                        >
                          <span className="folder-tile__body">
                            <span className="folder-tile__name">
                              {folder.name}
                            </span>
                            <span className="folder-tile__count">
                              {countLabel(count)}
                            </span>
                          </span>
                          <span
                            className="folder-tile__chevron"
                            aria-hidden="true"
                          >
                            ›
                          </span>
                        </Link>
                        <div className="folder-tile__actions">
                          <button
                            type="button"
                            onClick={(e) =>
                              stopAnd(e, () => {
                                setEditingId(folder.id)
                                setEditName(folder.name)
                              })
                            }
                          >
                            Gi nytt navn
                          </button>
                          <button
                            type="button"
                            onClick={(e) =>
                              stopAnd(e, () => {
                                void onDelete(folder.id, folder.name)
                              })
                            }
                          >
                            Slett
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
          </ul>
        </>
      )}
    </div>
  )
}
