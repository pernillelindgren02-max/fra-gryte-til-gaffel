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
} from './filterLabels'
import type { FilterState } from './recipes'

export type FilterKey = keyof FilterState

export interface FilterGroupConfig {
  key: FilterKey
  title: string
  options: { value: string; label: string }[]
}

export const filterGroups: FilterGroupConfig[] = [
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
