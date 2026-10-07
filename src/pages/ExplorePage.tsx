import { useMemo, useState } from 'react'
import { FilterSheet } from '../components/FilterSheet'
import { RecipeCard } from '../components/RecipeCard'
import { useRecipes } from '../context/RecipesContext'
import { emptyFilters, type FilterState } from '../data/recipes'
import { buildCuratedSections } from '../utils/curatedRecipes'
import { countActiveFilters, filterRecipes } from '../utils/filterRecipes'
import { searchRecipes } from '../utils/searchRecipes'
import './ExplorePage.css'

function FiltersIcon() {
  return (
    <svg
      className="explore-search__filter-icon"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="6" cy="6" r="2" fill="currentColor" />
      <circle cx="14" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="18" r="2" fill="currentColor" />
    </svg>
  )
}

export function ExplorePage() {
  const { recipes, loading, error } = useRecipes()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const activeFilterCount = countActiveFilters(filters)
  const hasSearch = searchQuery.trim().length > 0
  const hasActiveConstraints = hasSearch || activeFilterCount > 0

  const matchingRecipes = useMemo(() => {
    const filtered = filterRecipes(recipes, filters)
    return searchRecipes(filtered, searchQuery)
  }, [filters, searchQuery, recipes])

  const curatedSections = useMemo(
    () => buildCuratedSections(recipes),
    [recipes],
  )

  function openFilterSheet() {
    setDraftFilters(filters)
    setFilterSheetOpen(true)
  }

  function closeFilterSheet() {
    setDraftFilters(filters)
    setFilterSheetOpen(false)
  }

  function applyFilters() {
    setFilters(draftFilters)
    setFilterSheetOpen(false)
  }

  return (
    <div className="explore">
      <header className="explore__hero">
        <div className="explore__brand-mark">
          <svg
            className="explore__brand-blob"
            viewBox="0 0 320 170"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M48 88c-18-28 8-62 42-70 28-7 48 8 78 4 26-4 52-22 78-12 30 12 42 42 34 70-6 22 8 48-14 64-24 18-58 8-86 14-30 6-58 24-86 12-28-12-26-42-46-82Z"
            />
          </svg>
          <p className="explore__brand" aria-label="Fra Gryte Til Gaffel">
            <span className="explore__brand-line">Fra Gryte</span>
            <span className="explore__brand-line">Til Gaffel</span>
          </p>
        </div>
        <h1 className="explore__tagline">En gryte unna noe godt</h1>
      </header>

      {loading && (
        <p className="explore-results__empty" aria-live="polite">
          Laster oppskrifter…
        </p>
      )}
      {error && !loading && (
        <p className="explore-results__empty" role="status">
          Kunne ikke hente oppskrifter fra skyen — viser lokal kopi.
        </p>
      )}

      <div className="explore-search">
        <label className="explore-search__field">
          <span className="visually-hidden">Søk</span>
          <input
            type="search"
            className="explore-search__input"
            placeholder="Søk etter oppskrift eller ingrediens"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            enterKeyHint="search"
          />
        </label>
        <button
          type="button"
          className="explore-search__filter-btn"
          aria-label={
            activeFilterCount > 0
              ? `Åpne filtre, ${activeFilterCount} aktive`
              : 'Åpne filtre'
          }
          onClick={openFilterSheet}
        >
          <FiltersIcon />
          {activeFilterCount > 0 && (
            <span className="explore-search__filter-badge" aria-hidden="true">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {hasActiveConstraints ? (
        <section className="explore-results" aria-live="polite">
          <div className="explore-results__header">
            <h2 className="explore-results__title">Resultater</h2>
            <p className="explore-results__count">
              {matchingRecipes.length} oppskrift
              {matchingRecipes.length === 1 ? '' : 'er'}
            </p>
          </div>

          {matchingRecipes.length === 0 ? (
            <p className="explore-results__empty">
              Ingen oppskrifter matcher søket eller filtrene. Prøv andre ord
              eller åpne filtre og nullstill valg.
            </p>
          ) : (
            <ul className="explore-feed">
              {matchingRecipes.map((recipe) => (
                <li key={recipe.id}>
                  <RecipeCard recipe={recipe} layout="grid" />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className="explore-sections">
          {curatedSections.map((section) => (
            <section key={section.id} className="explore-section">
              <h2 className="explore-section__title">{section.title}</h2>
              <ul className="explore-feed">
                {section.recipes.map((recipe) => (
                  <li key={`${section.id}-${recipe.id}`}>
                    <RecipeCard recipe={recipe} layout="grid" />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <FilterSheet
        open={filterSheetOpen}
        draftFilters={draftFilters}
        onDraftChange={setDraftFilters}
        onApply={applyFilters}
        onClose={closeFilterSheet}
      />
    </div>
  )
}
