import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { RecipeCard } from '../components/RecipeCard'
import { useAuth } from '../context/AuthContext'
import { useUserData } from '../context/UserDataContext'
import { getRecipeById } from '../data/recipes'
import './AccountLists.css'

export function FoldersPage() {
  const { user, configured, loading } = useAuth()
  const {
    folders,
    folderRecipeIds,
    createFolder,
    renameFolder,
    deleteFolder,
  } = useUserData()
  const [newName, setNewName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    const err = await createFolder(newName)
    setMessage(err)
    if (!err) setNewName('')
  }

  async function onRename(id: string) {
    const err = await renameFolder(id, editName)
    setMessage(err)
    if (!err) setEditingId(null)
  }

  async function onDelete(id: string, name: string) {
    if (!window.confirm(`Slette mappen «${name}»?`)) return
    const err = await deleteFolder(id)
    setMessage(err)
  }

  return (
    <div className="account-list">
      <header className="account-list__header">
        <h1 className="account-list__title">Mapper</h1>
        <p className="account-list__lead">
          Samle oppskrifter i egne lister. Forslag: Tur, Ukesmeny, Billig.
        </p>
      </header>

      {!configured && (
        <p className="account-list__empty">
          Supabase er ikke konfigurert. Se README for nøkler og schema.
        </p>
      )}

      {configured && !loading && !user && (
        <p className="account-list__empty">
          <Link to="/konto">Logg inn</Link> for å lage mapper.
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
          {message && <p className="account-list__message">{message}</p>}

          {folders.length === 0 ? (
            <p className="account-list__empty">Ingen mapper ennå.</p>
          ) : (
            <div className="account-list__folders">
              {folders.map((folder) => {
                const recipes = (folderRecipeIds[folder.id] ?? [])
                  .map((id) => getRecipeById(id))
                  .filter(
                    (recipe): recipe is NonNullable<typeof recipe> =>
                      Boolean(recipe),
                  )
                return (
                  <section key={folder.id} className="account-folder">
                    <div className="account-folder__head">
                      {editingId === folder.id ? (
                        <div className="account-folder__edit">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
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
                        <>
                          <h2 className="account-folder__title">{folder.name}</h2>
                          <div className="account-folder__actions">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(folder.id)
                                setEditName(folder.name)
                              }}
                            >
                              Gi nytt navn
                            </button>
                            <button
                              type="button"
                              onClick={() => void onDelete(folder.id, folder.name)}
                            >
                              Slett
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {recipes.length === 0 ? (
                      <p className="account-list__empty">
                        Tom mappe — legg til oppskrifter fra detaljsiden.
                      </p>
                    ) : (
                      <ul className="account-list__grid">
                        {recipes.map((recipe) => (
                          <li key={recipe.id}>
                            <RecipeCard recipe={recipe} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
