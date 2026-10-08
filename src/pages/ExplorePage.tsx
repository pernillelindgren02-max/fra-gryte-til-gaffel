import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ClearableSearchInput } from '../components/ClearableSearchInput'
import {
  searchQueryBucket,
  trackEvent,
  validatedSearchTerm,
} from '../lib/analytics'
import { EmptyState } from '../components/EmptyState'
import { FilterSheet } from '../components/FilterSheet'
import { InlineError } from '../components/InlineError'
import { RecipeCard } from '../components/RecipeCard'
import {
  ExploreResultsSkeleton,
  ExploreSkeleton,
} from '../components/skeleton'
import { useLocale } from '../context/LocaleContext'
import { useRecipes } from '../context/RecipesContext'
import { useSiteContent } from '../context/SiteContentContext'
import {
  EXPLORE_CATEGORIES,
  getCategoryDef,
} from '../data/exploreCategories'
import { getBrand } from '../i18n/brand'
import { localizeExploreSettings } from '../i18n/localizeExplore'
import { emptyFilters, type FilterState, type Recipe } from '../data/recipes'
import {
  clearExploreScrollFreeze,
  loadExploreSession,
  saveExploreSession,
} from '../lib/exploreSession'
import { USER_ERRORS } from '../lib/userErrors'
import {
  buildCuratedSections,
  getExploreCategories,
  resolveCategoryRecipes,
} from '../utils/curatedRecipes'
import { ensureEvenRecipes } from '../utils/evenRecipes'
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
  pool: Recipe[],
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
        rest: ensureEvenRecipes(rest, pool),
      })
      return
    }

    if (isEditorialSlot) {
      blocks.push({
        kind: 'editorial',
        id: section.id,
        title: section.title,
        recipes: ensureEvenRecipes(section.recipes, pool),
      })
      return
    }

    blocks.push({
      kind: 'grid',
      id: section.id,
      title: section.title,
      recipes: ensureEvenRecipes(section.recipes, pool),
      spacing: index % 2 === 0 ? 'roomy' : 'tight',
    })
  })

  return blocks
}

export function ExplorePage() {
  const { recipes, loading, error, refresh } = useRecipes()
  const { explore: exploreRaw, getCopy, theme } = useSiteContent()
  const { locale, t } = useLocale()
  const brand = getBrand(locale)
  const explore = useMemo(
    () => localizeExploreSettings(exploreRaw, locale),
    [exploreRaw, locale],
  )
  const initial = useRef(loadExploreSession())
  const [searchQuery, setSearchQuery] = useState(initial.current.searchQuery)
  const [filters, setFilters] = useState<FilterState>(initial.current.filters)
  const [draftFilters, setDraftFilters] = useState<FilterState>(
    initial.current.filters,
  )
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [categoryId, setCategoryId] = useState<string | null>(
    initial.current.categoryId,
  )
  const restoredScroll = useRef(false)

  const activeFilterCount = countActiveFilters(filters)
  const activeChips = useMemo(() => listActiveFilterChips(filters), [filters])
  const hasSearch = searchQuery.trim().length > 0
  const hasActiveConstraints = hasSearch || activeFilterCount > 0
  const showFeedSkeleton = loading && recipes.length === 0
  const categoryConfigs = useMemo(
    () => getExploreCategories(explore),
    [explore],
  )
  const activeCategoryConfig = useMemo(
    () => categoryConfigs.find((c) => c.id === categoryId) ?? null,
    [categoryConfigs, categoryId],
  )
  const activeCategoryDef = categoryId ? getCategoryDef(categoryId) : undefined

  const matchingRecipes = useMemo(() => {
    const filtered = filterRecipes(recipes, filters)
    const searched = searchRecipes(filtered, searchQuery)
    // Same pool → trim odd card (don't inject unrelated search hits).
    return ensureEvenRecipes(searched, searched)
  }, [filters, searchQuery, recipes])

  const categoryRecipes = useMemo(() => {
    if (!activeCategoryConfig) return []
    return resolveCategoryRecipes(activeCategoryConfig, recipes)
  }, [activeCategoryConfig, recipes])

  const curatedSections = useMemo(
    () =>
      buildCuratedSections(
        recipes,
        explore,
        locale === 'en' ? 'Featured' : 'Utvalgt',
      ),
    [recipes, explore, locale],
  )

  const exploreBlocks = useMemo(
    () => buildExploreBlocks(curatedSections, recipes),
    [curatedSections, recipes],
  )

  const scrollYRef = useRef(initial.current.scrollY)

  useLayoutEffect(() => {
    clearExploreScrollFreeze()
  }, [])

  useEffect(() => {
    saveExploreSession({
      searchQuery,
      filters,
      scrollY: scrollYRef.current,
      categoryId,
    })
  }, [searchQuery, filters, categoryId])

  // useLayoutEffect so cleanup runs in the layout phase. Ignore sudden jumps
  // toward the top while a recipe route scrolls the window (listener may still
  // be attached briefly during the transition).
  useLayoutEffect(() => {
    function onScroll() {
      const y = window.scrollY
      const prev = scrollYRef.current
      if (prev > 100 && y < 100 && y < prev - 50) return
      scrollYRef.current = y
      saveExploreSession({
        searchQuery,
        filters,
        scrollY: scrollYRef.current,
        categoryId,
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      saveExploreSession({
        searchQuery,
        filters,
        scrollY: scrollYRef.current,
        categoryId,
      })
    }
  }, [searchQuery, filters, categoryId])

  useLayoutEffect(() => {
    if (restoredScroll.current || showFeedSkeleton) return
    restoredScroll.current = true
    const y = initial.current.scrollY
    if (y > 0) {
      window.scrollTo(0, y)
      scrollYRef.current = y
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
    trackEvent('explore_filter_apply', {
      source: 'explore',
      properties: { active_count: countActiveFilters(draftFilters) },
    })
  }

  function clearAllFilters() {
    setFilters(emptyFilters)
    setDraftFilters(emptyFilters)
  }

  function clearSearch() {
    setSearchQuery('')
  }

  function openCategory(id: string) {
    setCategoryId(id)
    setSearchQuery('')
    setFilters(emptyFilters)
    setDraftFilters(emptyFilters)
    window.scrollTo(0, 0)
    trackEvent('explore_category_open', {
      source: 'explore',
      properties: { category_id: id },
    })
  }

  const knownSearchTerms = useMemo(() => {
    const names = recipes.map((r) => r.name)
    const cats = EXPLORE_CATEGORIES.flatMap((c) => [c.id, c.label])
    return [...names, ...cats]
  }, [recipes])

  const exploreCardSource = hasSearch
    ? 'search'
    : categoryId
      ? 'category'
      : 'explore'

  // Debounced search — length bucket + optional validated term (known vocab only).
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) return
    const timer = window.setTimeout(() => {
      const resultCount = searchRecipes(filterRecipes(recipes, filters), q)
        .length
      const validated = validatedSearchTerm(q, knownSearchTerms)
      trackEvent('explore_search', {
        source: 'explore',
        properties: {
          query_bucket: searchQueryBucket(q),
          q_len: Math.min(q.length, 64),
          has_query: '1',
          ...(validated ? { validated_term: validated } : {}),
          zero_results: resultCount === 0 ? 1 : 0,
          result_bucket:
            resultCount === 0
              ? '0'
              : resultCount <= 3
                ? '1-3'
                : resultCount <= 10
                  ? '4-10'
                  : '11+',
        },
      })
    }, 700)
    return () => window.clearTimeout(timer)
  }, [searchQuery, recipes, filters, knownSearchTerms])

  function clearCategory() {
    setCategoryId(null)
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
          <p className="explore__brand" aria-label={brand.name}>
            {locale === 'en' ? (
              <>
                <span className="explore__brand-line">One Pot</span>
                <span className="explore__brand-line">Wonder</span>
              </>
            ) : (
              <>
                <span className="explore__brand-line">Fra Gryte</span>
                <span className="explore__brand-line">Til Gaffel</span>
              </>
            )}
          </p>
        </div>
        <h1 className="explore__tagline">
          {t('explore.tagline') ||
            getCopy('explore.tagline', 'En gryte unna noe godt')}
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
        <ClearableSearchInput
          className="explore-search__clearable"
          label="Søk"
          placeholder={
            t('explore.searchPlaceholder') ||
            getCopy(
              'explore.search_placeholder',
              'Søk etter oppskrift eller ingrediens',
            )
          }
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={clearSearch}
        />
        <button
          type="button"
          className={`explore-search__filter-btn${activeFilterCount > 0 ? ' explore-search__filter-btn--active' : ''}`}
          aria-label={
            activeFilterCount > 0
              ? `${t('explore.filters')}, ${activeFilterCount}`
              : t('explore.filters')
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

      <div className="explore-categories" aria-label={t('explore.categories')}>
        <ul className="explore-categories__track">
          {EXPLORE_CATEGORIES.map((cat) => {
            const selected = categoryId === cat.id
            const cfg = categoryConfigs.find((c) => c.id === cat.id)
            const label =
              cfg?.title ||
              (locale === 'en'
                ? explore.categories.find((c) => c.id === cat.id)?.title
                : null) ||
              cat.label
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  className={`explore-category${selected ? ' explore-category--on' : ''}`}
                  aria-pressed={selected}
                  onClick={() =>
                    selected ? clearCategory() : openCategory(cat.id)
                  }
                >
                  <span className="explore-category__art">
                    <img src={cat.image} alt="" width={72} height={72} />
                  </span>
                  <span className="explore-category__label">{label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {activeFilterCount > 0 && !categoryId && (
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
        hasActiveConstraints || categoryId ? (
          <ExploreResultsSkeleton />
        ) : (
          <ExploreSkeleton />
        )
      ) : categoryId && activeCategoryConfig ? (
        <section className="explore-results" aria-live="polite">
          <div className="explore-results__header">
            <h2 className="explore-results__title">
              {activeCategoryDef?.label ?? activeCategoryConfig.title}
            </h2>
            <button
              type="button"
              className="explore-filter-bar__clear"
              onClick={clearCategory}
            >
              Vis alle
            </button>
          </div>
          {categoryRecipes.length === 0 ? (
            <EmptyState
              lead="Ingen oppskrifter i denne kategorien ennå."
              actionLabel="Vis alle oppskrifter"
              to="/"
              onActionClick={clearCategory}
            />
          ) : (
            <ul className="explore-feed">
              {categoryRecipes.map((recipe) => (
                <li key={recipe.id}>
                  <RecipeCard
                    recipe={recipe}
                    layout="grid"
                    analyticsSource={exploreCardSource}
                    entrySource={exploreCardSource}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
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
                  <RecipeCard
                    recipe={recipe}
                    layout="grid"
                    analyticsSource={exploreCardSource}
                    entrySource={exploreCardSource}
                  />
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
                    <RecipeCard
                      recipe={block.recipe}
                      layout="featured"
                      analyticsSource="explore"
                      entrySource="explore"
                    />
                  </div>
                  {block.rest.length > 0 && (
                    <ul className="explore-feed explore-feed--after-feature">
                      {block.rest.map((recipe) => (
                        <li key={`${block.id}-${recipe.id}`}>
                          <RecipeCard
                            recipe={recipe}
                            layout="grid"
                            analyticsSource="explore"
                            entrySource="explore"
                          />
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
                        <RecipeCard
                          recipe={recipe}
                          layout="grid"
                          analyticsSource="explore"
                          entrySource="explore"
                        />
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
                      <RecipeCard
                        recipe={recipe}
                        layout="grid"
                        analyticsSource="explore"
                        entrySource="explore"
                      />
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
