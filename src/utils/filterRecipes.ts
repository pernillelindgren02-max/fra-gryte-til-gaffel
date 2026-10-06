import {
  getIngredientCount,
  getIngredientCountRange,
  getTimeRange,
  type FilterState,
  type Recipe,
} from '../data/recipes'

function matchesAny<T>(selected: T[], value: T): boolean {
  if (selected.length === 0) return true
  return selected.includes(value)
}

export function filterRecipes(
  recipes: Recipe[],
  filters: FilterState,
): Recipe[] {
  return recipes.filter((recipe) => {
    const timeRange = getTimeRange(recipe.timeMinutes)
    const ingredientRange = getIngredientCountRange(getIngredientCount(recipe))

    const matchesTime =
      filters.timeRanges.length === 0 ||
      (timeRange !== null && filters.timeRanges.includes(timeRange))

    return (
      matchesTime &&
      matchesAny(filters.preparationLevels, recipe.preparationLevel) &&
      matchesAny(filters.ingredientCountRanges, ingredientRange) &&
      matchesAny(filters.storageNeeds, recipe.storageNeed) &&
      matchesAny(filters.mealTypes, recipe.mealType) &&
      matchesAny(filters.priceLevels, recipe.priceLevel) &&
      matchesAny(filters.dishwashingLevels, recipe.dishwashingLevel) &&
      matchesAny(
        filters.campingStoveSuitabilities,
        recipe.campingStoveSuitability,
      ) &&
      matchesAny(filters.waterNeeds, recipe.waterNeed)
    )
  })
}

export function countActiveFilters(filters: FilterState): number {
  return Object.values(filters).reduce((sum, values) => sum + values.length, 0)
}
