import type { Recipe } from '../data/recipes'
import { pickEditorial, pickLocalizedList } from './fallback'
import type { AppLocale } from './types'

/** Resolve display fields for the active locale without dropping bilingual source. */
export function localizeRecipe(recipe: Recipe, locale: AppLocale): Recipe {
  const name = pickEditorial(
    recipe.nameNo,
    recipe.nameEn,
    recipe.nameEnAuto,
    recipe.nameEnOverride,
    locale,
  )
  const shortDescription = pickEditorial(
    recipe.shortDescriptionNo,
    recipe.shortDescriptionEn,
    recipe.shortDescriptionEnAuto,
    recipe.shortDescriptionEnOverride,
    locale,
  )
  const steps = pickLocalizedList(recipe.stepsNo, recipe.stepsEn, locale)
  const ingredients = recipe.ingredients.map((ing) => ({
    ...ing,
    name: pickEditorial(
      ing.nameNo,
      ing.nameEn,
      ing.nameEnAuto,
      ing.nameEnOverride,
      locale,
    ),
  }))
  return {
    ...recipe,
    name,
    shortDescription,
    steps,
    ingredients,
  }
}

export function localizeRecipes(
  recipes: Recipe[],
  locale: AppLocale,
): Recipe[] {
  return recipes.map((r) => localizeRecipe(r, locale))
}
