import { filterGroups, type FilterKey } from '../data/filterConfig'
import type { FilterState } from '../data/recipes'

export type ActiveFilterChip = {
  key: FilterKey
  value: string
  label: string
}

export function listActiveFilterChips(
  filters: FilterState,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []
  for (const group of filterGroups) {
    const selected = filters[group.key] as string[]
    for (const value of selected) {
      const option = group.options.find((item) => item.value === value)
      chips.push({
        key: group.key,
        value,
        label: option?.label ?? value,
      })
    }
  }
  return chips
}

export function removeFilterValue(
  filters: FilterState,
  key: FilterKey,
  value: string,
): FilterState {
  const current = filters[key] as string[]
  return {
    ...filters,
    [key]: current.filter((item) => item !== value),
  }
}
