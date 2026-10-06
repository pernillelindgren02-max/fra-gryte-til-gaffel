import type { FilterState } from '../data/recipes'
import { countActiveFilters } from '../utils/filterRecipes'
import { FilterGroups } from './FilterGroups'
import './FilterPanel.css'

interface FilterPanelProps {
  filters: FilterState
  onChange: (next: FilterState) => void
  onReset: () => void
}

/** Inline filter panel (used in docs/tests; main app uses FilterSheet). */
export function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const activeCount = countActiveFilters(filters)

  return (
    <section className="filter-panel" aria-label="Filtre">
      <div className="filter-panel__header">
        <h2 className="filter-panel__title">Filtrer oppskrifter</h2>
        {activeCount > 0 && (
          <button type="button" className="filter-panel__reset" onClick={onReset}>
            Nullstill alle ({activeCount})
          </button>
        )}
      </div>
      <FilterGroups filters={filters} onChange={onChange} />
    </section>
  )
}
