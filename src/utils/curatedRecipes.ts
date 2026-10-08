import type { Recipe } from '../data/recipes'
import { getIngredientCount } from '../data/recipes'
import type { ExploreCategoryConfig, ExploreSettings } from '../lib/siteDefaults'
import { DEFAULT_EXPLORE_SETTINGS } from '../lib/siteDefaults'
import { ensureEvenRecipes } from './evenRecipes'

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

export function isLunch(recipe: Recipe): boolean {
  return recipe.mealType === 'lunch'
}

export function isFewIngredients(recipe: Recipe): boolean {
  return getIngredientCount(recipe) <= 4
}

export function isQuick(recipe: Recipe): boolean {
  return recipe.timeMinutes <= 20
}

const DESSERT_HINT =
  /dessert|kake|bolle|pannekake|crumble|syltetøy|kanel|sjokolade|søt/i

export function isDessert(recipe: Recipe): boolean {
  if (recipe.practicalTags.some((tag) => DESSERT_HINT.test(tag))) return true
  return DESSERT_HINT.test(`${recipe.name} ${recipe.shortDescription}`)
}

export interface CuratedSection {
  id: string
  title: string
  recipes: Recipe[]
}

const SECTION_AUTO_FILTERS: Record<string, (recipe: Recipe) => boolean> = {
  'quick-easy': isQuickAndEasy,
  primus: isPerfectOnPrimus,
  breakfast: isBreakfast,
  dinner: isDinner,
}

export const CATEGORY_AUTO_FILTERS: Record<
  string,
  (recipe: Recipe) => boolean
> = {
  primus: isPerfectOnPrimus,
  'few-ingredients': isFewIngredients,
  quick: isQuick,
  dinner: isDinner,
  breakfast: isBreakfast,
  lunch: isLunch,
  dessert: isDessert,
}

export function resolveCategoryRecipes(
  category: ExploreCategoryConfig,
  allRecipes: Recipe[],
): Recipe[] {
  const byId = new Map(allRecipes.map((r) => [r.id, r]))
  let recipes: Recipe[]
  if (category.mode === 'manual' && category.recipe_ids.length > 0) {
    recipes = category.recipe_ids
      .map((id) => byId.get(id))
      .filter((r): r is Recipe => Boolean(r))
  } else {
    const filter = CATEGORY_AUTO_FILTERS[category.id]
    recipes = filter ? allRecipes.filter(filter) : []
  }
  return ensureEvenRecipes(recipes, allRecipes)
}

export function getExploreCategories(
  settings?: ExploreSettings | null,
): ExploreCategoryConfig[] {
  const fromSettings = settings?.categories
  if (fromSettings && fromSettings.length > 0) return fromSettings
  return DEFAULT_EXPLORE_SETTINGS.categories
}

export function buildCuratedSections(
  allRecipes: Recipe[],
  settings?: ExploreSettings | null,
  featuredTitle = 'Utvalgt',
): CuratedSection[] {
  const byId = new Map(allRecipes.map((r) => [r.id, r]))

  if (!settings) {
    const sections: CuratedSection[] = [
      {
        id: 'quick-easy',
        title: 'Raskt og enkelt',
        recipes: ensureEvenRecipes(
          allRecipes.filter(isQuickAndEasy),
          allRecipes,
        ),
      },
      {
        id: 'primus',
        title: 'Perfekt på primus',
        recipes: ensureEvenRecipes(
          allRecipes.filter(isPerfectOnPrimus),
          allRecipes,
        ),
      },
      {
        id: 'breakfast',
        title: 'Frokost',
        recipes: ensureEvenRecipes(
          allRecipes.filter(isBreakfast),
          allRecipes,
        ),
      },
      {
        id: 'dinner',
        title: 'Middag',
        recipes: ensureEvenRecipes(allRecipes.filter(isDinner), allRecipes),
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
      title: featuredTitle,
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
      const filter = SECTION_AUTO_FILTERS[cfg.id]
      recipes = filter ? allRecipes.filter(filter) : []
    }
    recipes = ensureEvenRecipes(recipes, allRecipes)
    if (recipes.length > 0) {
      sections.push({ id: cfg.id, title: cfg.title, recipes })
    }
  }

  return sections
}
