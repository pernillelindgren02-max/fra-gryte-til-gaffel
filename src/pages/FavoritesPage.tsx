import { Link } from 'react-router-dom'
import { RecipeCard } from '../components/RecipeCard'
import { useAuth } from '../context/AuthContext'
import { useUserData } from '../context/UserDataContext'
import { getRecipeById } from '../data/recipes'
import './AccountLists.css'

export function FavoritesPage() {
  const { user, configured, loading } = useAuth()
  const { favoriteIds } = useUserData()
  const recipes = [...favoriteIds]
    .map((id) => getRecipeById(id))
    .filter((recipe): recipe is NonNullable<typeof recipe> => Boolean(recipe))

  return (
    <div className="account-list">
      <header className="account-list__header">
        <h1 className="account-list__title">Favoritter</h1>
        <p className="account-list__lead">
          Oppskrifter du har markert med hjerte.
        </p>
      </header>

      {!configured && (
        <p className="account-list__empty">
          Supabase er ikke konfigurert. Se README for nøkler og schema.
        </p>
      )}

      {configured && !loading && !user && (
        <p className="account-list__empty">
          <Link to="/konto">Logg inn</Link> for å se favorittene dine.
        </p>
      )}

      {user && recipes.length === 0 && (
        <p className="account-list__empty">
          Ingen favoritter ennå. Åpne en oppskrift og trykk på hjertet.
        </p>
      )}

      {recipes.length > 0 && (
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
