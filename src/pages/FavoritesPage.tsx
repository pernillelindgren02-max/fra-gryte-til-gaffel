import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RecipeCard } from '../components/RecipeCard'
import { EmptyState } from '../components/EmptyState'
import { InlineError } from '../components/InlineError'
import {
  FolderListSkeleton,
  FolderRecipesSkeleton,
} from '../components/skeleton'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useUserData } from '../context/UserDataContext'
import { useRecipes } from '../context/RecipesContext'
import { useSiteContent } from '../context/SiteContentContext'
import type { Recipe } from '../data/recipes'
import { trackEvent } from '../lib/analytics'
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
  const { user, configured, loading: authLoading } = useAuth()
  const { getById, loading: recipesLoading } = useRecipes()
  const { getCopy } = useSiteContent()
  const { showToast } = useToast()
  const {
    favoriteIds,
    favoritesLoading,
    folders,
    folderRecipeIds,
    foldersLoading,
    createFolder,
    renameFolder,
    deleteFolder,
    refresh,
    error: foldersError,
  } = useUserData()
  const [newName, setNewName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const favoriteCount = favoriteIds.size
  const openFolder =
    folderKey && folderKey !== DEFAULT_FOLDER_KEY
      ? folders.find((f) => f.id === folderKey)
      : null
  const viewingDefault = folderKey === DEFAULT_FOLDER_KEY
  const viewingFolder = viewingDefault || Boolean(openFolder)
  const folderMetaLoading = Boolean(user) && foldersLoading
  const favoritesMetaLoading = Boolean(user) && favoritesLoading

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    const label = newName.trim()
    const { error } = await createFolder(newName)
    if (error) {
      setMessage(error)
      showToast(error)
      return
    }
    setMessage(null)
    setNewName('')
    // Privacy: never send folder name — count only.
    trackEvent('favorites_folder_create', { source: 'favorites' })
    showToast(label ? `Mappen «${label}» er opprettet.` : 'Mappe opprettet.')
  }

  useEffect(() => {
    if (!folderKey) return
    trackEvent('favorites_folder_open', {
      source: 'favorites',
      properties: {
        folder_kind: folderKey === DEFAULT_FOLDER_KEY ? 'default' : 'custom',
      },
    })
  }, [folderKey])

  async function onRename(id: string) {
    const err = await renameFolder(id, editName)
    if (err) {
      setMessage(err)
      showToast(err)
      return
    }
    setMessage(null)
    setEditingId(null)
    showToast('Mappen er omdøpt.')
  }

  async function onDelete(id: string, name: string) {
    if (!window.confirm(`Slette mappen «${name}»?`)) return
    const err = await deleteFolder(id)
    if (err) {
      setMessage(err)
      showToast(err)
      return
    }
    setMessage(null)
    showToast(`Mappen «${name}» er slettet.`)
    if (folderKey === id) navigate('/favoritter')
  }

  function stopAnd(event: MouseEvent, action: () => void) {
    event.preventDefault()
    event.stopPropagation()
    action()
  }

  if (
    user &&
    folderKey &&
    !viewingDefault &&
    !openFolder &&
    !foldersError &&
    !folderMetaLoading
  ) {
    return (
      <div className="account-list">
        <Link to="/favoritter" className="account-list__back">
          ← Alle mapper
        </Link>
        <p className="account-list__empty">Fant ikke mappen.</p>
      </div>
    )
  }

  if (user && folderKey && (viewingFolder || folderMetaLoading || favoritesMetaLoading)) {
    const title = viewingDefault ? 'Favoritter' : (openFolder?.name ?? '')
    const listLoading =
      recipesLoading ||
      (viewingDefault ? favoritesMetaLoading : folderMetaLoading) ||
      (!viewingDefault && folderMetaLoading)
    const recipes = viewingDefault
      ? recipesFromIds(favoriteIds, getById)
      : openFolder
        ? recipesFromIds(folderRecipeIds[openFolder.id] ?? [], getById)
        : []

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
            ) : listLoading && !title ? (
              <span className="visually-hidden">Laster mappe…</span>
            ) : (
              title
            )}
          </h1>
          <p className="account-list__lead">
            {listLoading ? '…' : countLabel(recipes.length)}
          </p>
        </header>

        {listLoading ? (
          <FolderRecipesSkeleton />
        ) : recipes.length === 0 ? (
          <EmptyState
            lead={
              viewingDefault
                ? getCopy(
                    'favoritter.empty',
                    'Ingen favoritter ennå. Utforsk oppskrifter og lagre dem med hjertet.',
                  )
                : 'Tom mappe. Finn oppskrifter og lagre dem hit fra detaljsiden.'
            }
            actionLabel={
              viewingDefault ? 'Utforsk oppskrifter' : 'Finn oppskrifter'
            }
            to="/"
          />
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

      {configured && authLoading && (
        <FolderListSkeleton count={3} />
      )}

      {configured && !authLoading && !user && (
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
          {foldersError && (
            <InlineError
              message={foldersError}
              onRetry={() => void refresh()}
            />
          )}
          {message && !foldersError && (
            <p className="account-list__message">{message}</p>
          )}

          {folderMetaLoading || favoritesMetaLoading ? (
            <FolderListSkeleton count={3} />
          ) : (
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
          )}
        </>
      )}
    </div>
  )
}
