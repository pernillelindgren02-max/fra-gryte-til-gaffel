import { filterGroups, type FilterKey } from '../data/filterConfig'
import type { FilterState } from '../data/recipes'
import './FilterPanel.css'

interface FilterGroupsProps {
  filters: FilterState
  onChange: (next: FilterState) => void
}

export function FilterGroups({ filters, onChange }: FilterGroupsProps) {
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
  )
}
