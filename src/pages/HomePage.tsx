import { useState } from 'react'
import { FilterPanel } from '../components/FilterPanel'
import { RecipeCard } from '../components/RecipeCard'
import { emptyFilters, recipes, type FilterState } from '../data/recipes'
import { filterRecipes } from '../utils/filterRecipes'
import './HomePage.css'

export function HomePage() {
  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const visibleRecipes = filterRecipes(recipes, filters)

  return (
    <div className="home">
      <header className="home__hero">
        <p className="home__brand">Fra gryte til gaffel</p>
        <h1 className="home__tagline">
          God mat trenger ikke et fullt kjøkken
        </h1>
        <p className="home__intro">
          Enkle oppskrifter for én kokeplate — på tur med primus eller hjemme
          uten ovn. Filtrer på tid, oppvask, kjøling og mer.
        </p>
      </header>

      <FilterPanel
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(emptyFilters)}
      />

      <section className="home__results" aria-live="polite">
        <div className="home__results-header">
          <h2 className="home__results-title">Oppskrifter</h2>
          <p className="home__results-count">
            {visibleRecipes.length} av {recipes.length}
          </p>
        </div>

        {visibleRecipes.length === 0 ? (
          <p className="home__empty">
            Ingen oppskrifter matcher filtrene. Prøv å fjerne noen valg, eller
            nullstill alle.
          </p>
        ) : (
          <ul className="home__list">
            {visibleRecipes.map((recipe) => (
              <li key={recipe.id}>
                <RecipeCard recipe={recipe} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
