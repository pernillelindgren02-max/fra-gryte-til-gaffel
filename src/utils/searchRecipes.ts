import type { Recipe } from '../data/recipes'
import {
  campingStoveLabels,
  dishwashingLevelLabels,
  mealTypeLabels,
  preparationLevelLabels,
  priceLevelLabels,
  storageNeedLabels,
} from '../data/filterLabels'

/** Fold Norwegian letters for forgiving search (ø→o, æ→ae, å→a). */
function foldNb(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
}

function normalize(text: string): string {
  return foldNb(text.trim())
}

function tokenize(query: string): string[] {
  return normalize(query)
    .split(/[\s,;.|/+\-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
}

/** Synonyms / filter-ish keywords → haystack fragments. */
const SYNONYM_FRAGMENTS: Record<string, string[]> = {
  billig: ['billig', 'cheap'],
  rimelig: ['billig', 'cheap'],
  luksus: ['luksus', 'luxury'],
  dyrt: ['luksus', 'luxury'],
  dyr: ['luksus', 'luxury'],
  frokost: ['frokost', 'breakfast'],
  lunsj: ['lunsj', 'lunch'],
  middag: ['middag', 'dinner'],
  primus: ['primus', 'perfekt', 'tilpasses', 'perfect', 'adaptable'],
  camping: ['primus', 'perfekt', 'tilpasses', 'perfect', 'adaptable'],
  bal: ['primus', 'perfekt', 'tilpasses'],
  oppvask: ['oppvask', 'nesten', 'lite', 'ekstra'],
  liteoppvask: ['nesten', 'lite'],
  rask: ['min'],
  raskt: ['min'],
  enkelt: ['ingen kutting', 'litt kutting', 'nocutting', 'somecutting'],
  holdbart: ['ingen kjoling', 'tåler', 'taler', 'nocooling', 'fewhours'],
  lagring: ['kjoling', 'cooling', 'nocooling'],
  forberedelse: ['kutting', 'forberedelser', 'preparation'],
  kutting: ['kutting', 'forberedelser'],
}

function expandToken(token: string): string[] {
  const fragments = new Set<string>([token])

  const timeMatch = token.match(/^(\d+)\s*min(?:utter?)?$/)
  if (timeMatch) {
    fragments.add(timeMatch[1])
    fragments.add(`${timeMatch[1]} min`)
  }

  const syn = SYNONYM_FRAGMENTS[token]
  if (syn) syn.forEach((s) => fragments.add(normalize(s)))

  return [...fragments]
}

function recipeHaystack(recipe: Recipe): string {
  const parts = [
    recipe.name,
    recipe.nameNo,
    recipe.nameEn,
    recipe.nameEnAuto,
    recipe.shortDescription,
    recipe.shortDescriptionNo,
    recipe.shortDescriptionEn,
    recipe.shortDescriptionEnAuto,
    ...recipe.ingredients.flatMap((ingredient) => [
      ingredient.name,
      ingredient.nameNo,
      ingredient.nameEn,
      ingredient.nameEnAuto,
      ingredient.id,
    ]),
    ...recipe.practicalTags,
    mealTypeLabels[recipe.mealType],
    recipe.mealType,
    `${recipe.timeMinutes} min`,
    `${recipe.timeMinutes}min`,
    String(recipe.timeMinutes),
    priceLevelLabels[recipe.priceLevel],
    recipe.priceLevel,
    dishwashingLevelLabels[recipe.dishwashingLevel],
    recipe.dishwashingLevel,
    campingStoveLabels[recipe.campingStoveSuitability],
    recipe.campingStoveSuitability,
    preparationLevelLabels[recipe.preparationLevel],
    recipe.preparationLevel,
    storageNeedLabels[recipe.storageNeed],
    recipe.storageNeed,
  ]
  return normalize(parts.join(' '))
}

function tokenMatches(haystack: string, token: string): boolean {
  const candidates = expandToken(token)
  return candidates.some((candidate) => haystack.includes(candidate))
}

export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const tokens = tokenize(query)
  if (tokens.length === 0) {
    const term = normalize(query)
    if (!term) return recipes
    return recipes.filter((recipe) => recipeHaystack(recipe).includes(term))
  }

  return recipes.filter((recipe) => {
    const haystack = recipeHaystack(recipe)
    return tokens.every((token) => tokenMatches(haystack, token))
  })
}
