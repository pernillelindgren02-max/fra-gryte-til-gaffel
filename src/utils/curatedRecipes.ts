import type { Recipe } from '../data/recipes'
import type { ExploreSettings } from '../lib/siteDefaults'

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

const AUTO_FILTERS: Record<string, (recipe: Recipe) => boolean> = {
  'quick-easy': isQuickAndEasy,
  primus: isPerfectOnPrimus,
  breakfast: isBreakfast,
  dinner: isDinner,
}

export function buildCuratedSections(
  allRecipes: Recipe[],
  settings?: ExploreSettings | null,
): CuratedSection[] {
  const byId = new Map(allRecipes.map((r) => [r.id, r]))

  if (!settings) {
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

  const featured =
    settings.featured_ids.length > 0
      ? settings.featured_ids
          .map((id) => byId.get(id))
          .filter((r): r is Recipe => Boolean(r))
      : []

  const sections: CuratedSection[] = []
  if (featured.length > 0) {
    sections.push({
      id: 'featured',
      title: 'Utvalgt',
      recipes: featured,
    })
  }

  for (const cfg of settings.sections) {
    let recipes: Recipe[]
    if (cfg.mode === 'manual' && cfg.recipe_ids.length > 0) {
      recipes = cfg.recipe_ids
        .map((id) => byId.get(id))
        .filter((r): r is Recipe => Boolean(r))
    } else {
      const filter = AUTO_FILTERS[cfg.id]
      recipes = filter ? allRecipes.filter(filter) : []
    }
    if (recipes.length > 0) {
      sections.push({ id: cfg.id, title: cfg.title, recipes })
    }
  }

  return sections
}
