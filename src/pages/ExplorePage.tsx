import { useEffect, useMemo, useRef, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { FilterSheet } from '../components/FilterSheet'
import { InlineError } from '../components/InlineError'
import { RecipeCard } from '../components/RecipeCard'
import {
  ExploreResultsSkeleton,
  ExploreSkeleton,
} from '../components/skeleton'
import { useRecipes } from '../context/RecipesContext'
import { useSiteContent } from '../context/SiteContentContext'
import { emptyFilters, type FilterState, type Recipe } from '../data/recipes'
import {
  loadExploreSession,
  saveExploreSession,
} from '../lib/exploreSession'
import { USER_ERRORS } from '../lib/userErrors'
import { buildCuratedSections } from '../utils/curatedRecipes'
import {
  listActiveFilterChips,
  removeFilterValue,
} from '../utils/activeFilterChips'
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

type ExploreBlock =
  | {
      kind: 'featured'
      id: string
      title: string
      recipe: Recipe
      rest: Recipe[]
    }
  | {
      kind: 'grid'
      id: string
      title: string
      recipes: Recipe[]
      spacing: 'tight' | 'roomy'
    }
  | {
      kind: 'editorial'
      id: string
      title: string
      recipes: Recipe[]
    }

function buildExploreBlocks(
  sections: ReturnType<typeof buildCuratedSections>,
): ExploreBlock[] {
  if (sections.length === 0) return []

  const blocks: ExploreBlock[] = []
  let featuredTaken = false

  sections.forEach((section, index) => {
    const isEditorialSlot = index === 1 || index === 3

    if (!featuredTaken && section.recipes.length > 0) {
      featuredTaken = true
      const [hero, ...rest] = section.recipes
      blocks.push({
        kind: 'featured',
        id: section.id,
        title: section.title,
        recipe: hero,
        rest,
      })
      return
    }

    if (isEditorialSlot) {
      blocks.push({
        kind: 'editorial',
        id: section.id,
        title: section.title,
        recipes: section.recipes,
      })
      return
    }

    blocks.push({
      kind: 'grid',
      id: section.id,
      title: section.title,
      recipes: section.recipes,
      spacing: index % 2 === 0 ? 'roomy' : 'tight',
    })
  })

  return blocks
}

export function ExplorePage() {
  const { recipes, loading, error, refresh } = useRecipes()
  const { explore, getCopy, theme } = useSiteContent()
  const initial = useRef(loadExploreSession())
  const [searchQuery, setSearchQuery] = useState(initial.current.searchQuery)
  const [filters, setFilters] = useState<FilterState>(initial.current.filters)
  const [draftFilters, setDraftFilters] = useState<FilterState>(
    initial.current.filters,
  )
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const restoredScroll = useRef(false)

  const activeFilterCount = countActiveFilters(filters)
  const activeChips = useMemo(() => listActiveFilterChips(filters), [filters])
  const hasSearch = searchQuery.trim().length > 0
  const hasActiveConstraints = hasSearch || activeFilterCount > 0
  const showFeedSkeleton = loading && recipes.length === 0

  const matchingRecipes = useMemo(() => {
    const filtered = filterRecipes(recipes, filters)
    return searchRecipes(filtered, searchQuery)
  }, [filters, searchQuery, recipes])

  const curatedSections = useMemo(
    () => buildCuratedSections(recipes, explore),
    [recipes, explore],
  )

  const exploreBlocks = useMemo(
    () => buildExploreBlocks(curatedSections),
    [curatedSections],
  )

  useEffect(() => {
    saveExploreSession({
      searchQuery,
      filters,
      scrollY: window.scrollY,
    })
  }, [searchQuery, filters])

  useEffect(() => {
    function onScroll() {
      saveExploreSession({
        searchQuery,
        filters,
        scrollY: window.scrollY,
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [searchQuery, filters])

  useEffect(() => {
    if (restoredScroll.current || showFeedSkeleton) return
    restoredScroll.current = true
    const y = initial.current.scrollY
    if (y > 0) {
      requestAnimationFrame(() => window.scrollTo(0, y))
    }
  }, [showFeedSkeleton, matchingRecipes.length, exploreBlocks.length])

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

  function clearAllFilters() {
    setFilters(emptyFilters)
    setDraftFilters(emptyFilters)
  }

  function clearSearch() {
    setSearchQuery('')
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
            style={{ color: theme.logoBlob }}
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
        <h1 className="explore__tagline">
          {getCopy('explore.tagline', 'En gryte unna noe godt')}
        </h1>
        {explore.blurb.trim() ? (
          <p className="explore__blurb">{explore.blurb}</p>
        ) : null}
      </header>

      {error && !loading && (
        <InlineError
          message={
            error === USER_ERRORS.cloudFallback
              ? getCopy('explore.cloud_fallback', USER_ERRORS.cloudFallback)
              : error
          }
          onRetry={() => void refresh()}
        />
      )}

      <div className="explore-search">
        <label className="explore-search__field">
          <span className="visually-hidden">Søk</span>
          <input
            type="search"
            className="explore-search__input"
            placeholder={getCopy(
              'explore.search_placeholder',
              'Søk etter oppskrift eller ingrediens',
            )}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            enterKeyHint="search"
          />
        </label>
        <button
          type="button"
          className={`explore-search__filter-btn${activeFilterCount > 0 ? ' explore-search__filter-btn--active' : ''}`}
          aria-label={
            activeFilterCount > 0
              ? `Filtre, ${activeFilterCount} aktive`
              : 'Åpne filtre'
          }
          onClick={openFilterSheet}
        >
          <FiltersIcon />
          {activeFilterCount > 0 ? (
            <span className="explore-search__filter-count" aria-hidden="true">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      {activeFilterCount > 0 && (
        <div className="explore-filter-bar">
          <div className="explore-filter-bar__head">
            <p className="explore-filter-bar__label">
              Filter ({activeFilterCount})
            </p>
            <button
              type="button"
              className="explore-filter-bar__clear"
              onClick={clearAllFilters}
            >
              Nullstill
            </button>
          </div>
          <ul className="explore-filter-chips">
            {activeChips.map((chip) => (
              <li key={`${chip.key}:${chip.value}`}>
                <button
                  type="button"
                  className="explore-filter-chip"
                  onClick={() =>
                    setFilters((prev) =>
                      removeFilterValue(prev, chip.key, chip.value),
                    )
                  }
                  aria-label={`Fjern filter ${chip.label}`}
                >
                  <span>{chip.label}</span>
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showFeedSkeleton ? (
        hasActiveConstraints ? (
          <ExploreResultsSkeleton />
        ) : (
          <ExploreSkeleton />
        )
      ) : hasActiveConstraints ? (
        <section className="explore-results" aria-live="polite">
          <div className="explore-results__header">
            <h2 className="explore-results__title">Resultater</h2>
            <p className="explore-results__count">
              {matchingRecipes.length} oppskrift
              {matchingRecipes.length === 1 ? '' : 'er'}
            </p>
          </div>

          {matchingRecipes.length === 0 ? (
            <EmptyState
              lead="Ingen oppskrifter matcher akkurat nå. Prøv andre ord, eller fjern noen filtre."
              actionLabel="Gå til Utforsk"
              to="/"
              onActionClick={() => {
                clearSearch()
                clearAllFilters()
              }}
              secondaryLabel={
                activeFilterCount > 0
                  ? 'Nullstill filtre'
                  : hasSearch
                    ? 'Tøm søk'
                    : undefined
              }
              onSecondaryClick={
                activeFilterCount > 0
                  ? clearAllFilters
                  : hasSearch
                    ? clearSearch
                    : undefined
              }
            />
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
          {exploreBlocks.map((block) => {
            if (block.kind === 'featured') {
              return (
                <section
                  key={block.id}
                  className="explore-section explore-section--featured"
                >
                  <h2 className="explore-section__title">{block.title}</h2>
                  <div className="explore-featured">
                    <RecipeCard recipe={block.recipe} layout="featured" />
                  </div>
                  {block.rest.length > 0 && (
                    <ul className="explore-feed explore-feed--after-feature">
                      {block.rest.map((recipe) => (
                        <li key={`${block.id}-${recipe.id}`}>
                          <RecipeCard recipe={recipe} layout="grid" />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )
            }

            if (block.kind === 'editorial') {
              return (
                <section
                  key={block.id}
                  className="explore-section explore-section--editorial"
                >
                  <div className="explore-editorial">
                    <h2 className="explore-editorial__title">{block.title}</h2>
                  </div>
                  <ul className="explore-feed">
                    {block.recipes.map((recipe) => (
                      <li key={`${block.id}-${recipe.id}`}>
                        <RecipeCard recipe={recipe} layout="grid" />
                      </li>
                    ))}
                  </ul>
                </section>
              )
            }

            return (
              <section
                key={block.id}
                className={`explore-section explore-section--${block.spacing}`}
              >
                <h2 className="explore-section__title">{block.title}</h2>
                <ul className="explore-feed">
                  {block.recipes.map((recipe) => (
                    <li key={`${block.id}-${recipe.id}`}>
                      <RecipeCard recipe={recipe} layout="grid" />
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      <FilterSheet
        open={filterSheetOpen}
        draftFilters={draftFilters}
        onDraftChange={setDraftFilters}
        onApply={applyFilters}
        onClose={closeFilterSheet}
        activeCount={countActiveFilters(draftFilters)}
      />
    </div>
  )
}
