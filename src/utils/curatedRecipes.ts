import type { Recipe } from '../data/recipes'

export function isQuickAndEasy(recipe: Recipe): boolean {
  return (
    recipe.timeMinutes <= 30 &&
    (recipe.preparationLevel === 'noCutting' ||
      recipe.preparationLevel === 'someCutting')
  )
}

export function isPerfectOnPrimus(recipe: Recipe): boolean {
  return recipe.campingStoveSuitability === 'perfect'
}

export function isBreakfast(recipe: Recipe): boolean {
  return recipe.mealType === 'breakfast'
}

export function isDinner(recipe: Recipe): boolean {
  return recipe.mealType === 'dinner'
}

export interface CuratedSection {
  id: string
  title: string
  recipes: Recipe[]
}

export function buildCuratedSections(allRecipes: Recipe[]): CuratedSection[] {
  const sections: CuratedSection[] = [
    {
      id: 'quick-easy',
      title: 'Raskt og enkelt',
      recipes: allRecipes.filter(isQuickAndEasy),
    },
    {
      id: 'primus',
      title: 'Perfekt på primus',
      recipes: allRecipes.filter(isPerfectOnPrimus),
    },
    {
      id: 'breakfast',
      title: 'Frokost',
      recipes: allRecipes.filter(isBreakfast),
    },
    {
      id: 'dinner',
      title: 'Middag',
      recipes: allRecipes.filter(isDinner),
    },
  ]

  return sections.filter((section) => section.recipes.length > 0)
}
