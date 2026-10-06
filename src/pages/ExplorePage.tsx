import { useMemo, useState } from 'react'
import { FilterSheet } from '../components/FilterSheet'
import { RecipeCard } from '../components/RecipeCard'
import { emptyFilters, recipes, type FilterState } from '../data/recipes'
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
  }, [filters, searchQuery])

  const curatedSections = useMemo(
    () => buildCuratedSections(recipes),
    [],
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
        <p className="explore__brand">Fra gryte til gaffel</p>
        <h1 className="explore__tagline">
          God mat trenger ikke et fullt kjøkken
        </h1>
      </header>

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
            <ul className="explore-results__list">
              {matchingRecipes.map((recipe) => (
                <li key={recipe.id}>
                  <RecipeCard recipe={recipe} />
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
              <ul className="explore-section__rail">
                {section.recipes.map((recipe) => (
                  <li key={`${section.id}-${recipe.id}`}>
                    <RecipeCard recipe={recipe} layout="rail" />
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
