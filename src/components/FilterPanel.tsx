import {
  campingStoveLabels,
  dishwashingLevelLabels,
  ingredientCountLabels,
  mealTypeLabels,
  preparationLevelLabels,
  priceLevelLabels,
  storageNeedLabels,
  timeRangeLabels,
  waterNeedLabels,
} from '../data/filterLabels'
import type { FilterState } from '../data/recipes'
import { countActiveFilters } from '../utils/filterRecipes'
import './FilterPanel.css'

interface FilterPanelProps {
  filters: FilterState
  onChange: (next: FilterState) => void
  onReset: () => void
}

type FilterKey = keyof FilterState

interface FilterGroupConfig {
  key: FilterKey
  title: string
  options: { value: string; label: string }[]
}

const filterGroups: FilterGroupConfig[] = [
  {
    key: 'timeRanges',
    title: 'Tid',
    options: Object.entries(timeRangeLabels).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    key: 'preparationLevels',
    title: 'Forberedelser',
    options: Object.entries(preparationLevelLabels).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    key: 'ingredientCountRanges',
    title: 'Antall ingredienser',
    options: Object.entries(ingredientCountLabels).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    key: 'storageNeeds',
    title: 'Oppbevaring',
    options: Object.entries(storageNeedLabels).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    key: 'mealTypes',
    title: 'Måltid',
    options: Object.entries(mealTypeLabels).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    key: 'priceLevels',
    title: 'Pris',
    options: Object.entries(priceLevelLabels).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    key: 'dishwashingLevels',
    title: 'Oppvask',
    options: Object.entries(dishwashingLevelLabels).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    key: 'campingStoveSuitabilities',
    title: 'Turvennlighet',
    options: Object.entries(campingStoveLabels).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    key: 'waterNeeds',
    title: 'Vannbehov',
    options: Object.entries(waterNeedLabels).map(([value, label]) => ({
      value,
      label,
    })),
  },
]

export function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const activeCount = countActiveFilters(filters)

  function toggleFilter(key: FilterKey, value: string) {
    const current = filters[key] as string[]
    const nextValues = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]

    onChange({
      ...filters,
      [key]: nextValues,
    })
  }

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

      <div className="filter-panel__groups">
        {filterGroups.map((group) => (
          <div key={group.key} className="filter-group">
            <h3 className="filter-group__title">{group.title}</h3>
            <div className="filter-group__chips" role="group" aria-label={group.title}>
              {group.options.map((option) => {
                const selected = (filters[group.key] as string[]).includes(
                  option.value,
                )
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`filter-chip${selected ? ' filter-chip--selected' : ''}`}
                    aria-pressed={selected}
                    onClick={() => toggleFilter(group.key, option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
