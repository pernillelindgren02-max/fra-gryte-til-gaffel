import { useEffect } from 'react'
import { emptyFilters, type FilterState, type Recipe } from '../data/recipes'
import type { FridgeItem } from '../context/PantryContext'
import type { ExploreIngredientRef } from '../lib/exploreSession'
import { useLocale } from '../context/LocaleContext'
import { ExploreIngredientFilter } from './ExploreIngredientFilter'
import { FilterGroups } from './FilterGroups'
import './FilterSheet.css'

interface FilterSheetProps {
  open: boolean
  draftFilters: FilterState
  onDraftChange: (next: FilterState) => void
  draftIngredients: ExploreIngredientRef[]
  onDraftIngredientsChange: (next: ExploreIngredientRef[]) => void
  pantry: FridgeItem[]
  recipes: Recipe[]
  onApply: () => void
  onClose: () => void
  activeCount?: number
}

export function FilterSheet({
  open,
  draftFilters,
  onDraftChange,
  draftIngredients,
  onDraftIngredientsChange,
  pantry,
  recipes,
  onApply,
  onClose,
  activeCount = 0,
}: FilterSheetProps) {
  const { t, locale } = useLocale()

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

  if (!open) return null

  const title =
    activeCount > 0
      ? locale === 'en'
        ? `Filters (${activeCount})`
        : `Filtre (${activeCount})`
      : t('explore.filterRecipes')

  return (
    <div className="filter-sheet" role="presentation">
      <button
        type="button"
        className="filter-sheet__backdrop"
        aria-label={t('explore.closeFilters')}
        onClick={onClose}
      />
      <div
        className="filter-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
      >
        <div className="filter-sheet__handle" aria-hidden="true" />
        <header className="filter-sheet__header">
          <h2 id="filter-sheet-title" className="filter-sheet__title">
            {title}
          </h2>
        </header>

        <div className="filter-sheet__body">
          <ExploreIngredientFilter
            selected={draftIngredients}
            onChange={onDraftIngredientsChange}
            pantry={pantry}
            recipes={recipes}
          />
          <FilterGroups filters={draftFilters} onChange={onDraftChange} />
        </div>

        <footer className="filter-sheet__footer">
          {activeCount > 0 ? (
            <button
              type="button"
              className="filter-sheet__secondary"
              onClick={() => {
                onDraftChange(emptyFilters)
                onDraftIngredientsChange([])
              }}
            >
              {t('explore.clearAll')}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="filter-sheet__primary"
            onClick={onApply}
          >
            {t('explore.showResults')}
          </button>
        </footer>
      </div>
    </div>
  )
}
