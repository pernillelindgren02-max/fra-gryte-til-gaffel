import type {
  CampingStoveSuitability,
  DishwashingLevel,
  Ingredient,
  MealType,
  PreparationLevel,
  PriceLevel,
  Recipe,
  StorageNeed,
  WaterNeed,
} from '../data/recipes'
import { ensureBilingualRecipe, recipeImageUrl } from '../data/recipes'
import {
  suggestEnglishDescription,
  suggestEnglishTitle,
} from '../i18n/autoEnglish'
import { normalizeIngredient } from '../i18n/content'
import { DEFAULT_LOCALE } from '../i18n/types'

export type RecipeRow = {
  id: string
  name: string
  name_no?: string | null
  name_en?: string | null
  name_en_auto?: string | null
  name_en_override?: boolean | null
  short_description: string
  short_description_no?: string | null
  short_description_en?: string | null
  short_description_en_auto?: string | null
  short_description_en_override?: boolean | null
  meal_type: string
  time_minutes: number
  servings: number
  preparation_level: string
  storage_need: string
  price_level: string
  dishwashing_level: string
  camping_stove_suitability: string
  water_need: string
  ingredients: unknown
  steps: unknown
  steps_no?: unknown
  steps_en?: unknown
  practical_tags: string[] | unknown
  image_path: string | null
  is_published: boolean
  notify_on_publish?: boolean
  spotify_title?: string | null
  spotify_artist?: string | null
  spotify_url?: string | null
  spotify_code_image?: string | null
  created_at?: string
  updated_at?: string
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item))
}

function asOptionalText(value: unknown): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

function asIngredients(value: unknown): Ingredient[] {
  if (!Array.isArray(value)) return []
  return value.map((item) =>
    normalizeIngredient(
      item as Parameters<typeof normalizeIngredient>[0],
      DEFAULT_LOCALE,
    ),
  )
}

export function mapRowToRecipe(row: RecipeRow, supabaseUrl?: string): Recipe {
  const codePath = asOptionalText(row.spotify_code_image)
  const nameNo = String(row.name_no ?? row.name ?? '').trim()
  const nameEn = String(row.name_en ?? '').trim()
  const nameEnAuto = String(
    row.name_en_auto ?? suggestEnglishTitle(row.id, nameNo) ?? '',
  ).trim()
  // Existing filled name_en without flag → treat as historical override
  const nameEnOverride =
    row.name_en_override == null
      ? Boolean(nameEn)
      : Boolean(row.name_en_override) && Boolean(nameEn)

  const shortDescriptionNo = String(
    row.short_description_no ?? row.short_description ?? '',
  ).trim()
  const shortDescriptionEn = String(row.short_description_en ?? '').trim()
  const shortDescriptionEnAuto = String(
    row.short_description_en_auto ??
      suggestEnglishDescription(row.id, shortDescriptionNo) ??
      '',
  ).trim()
  const shortDescriptionEnOverride =
    row.short_description_en_override == null
      ? Boolean(shortDescriptionEn)
      : Boolean(row.short_description_en_override) &&
        Boolean(shortDescriptionEn)

  const stepsNo = asStringArray(row.steps_no ?? row.steps ?? [])
  const stepsEn = asStringArray(row.steps_en ?? [])

  return ensureBilingualRecipe({
    id: row.id,
    name: nameNo,
    nameNo,
    nameEn,
    nameEnAuto,
    nameEnOverride,
    shortDescription: shortDescriptionNo,
    shortDescriptionNo,
    shortDescriptionEn,
    shortDescriptionEnAuto,
    shortDescriptionEnOverride,
    image: recipeImageUrl(row.image_path, supabaseUrl),
    timeMinutes: row.time_minutes,
    servings: Number(row.servings) > 0 ? Number(row.servings) : 2,
    mealType: row.meal_type as MealType,
    preparationLevel: row.preparation_level as PreparationLevel,
    storageNeed: row.storage_need as StorageNeed,
    priceLevel: row.price_level as PriceLevel,
    dishwashingLevel: row.dishwashing_level as DishwashingLevel,
    campingStoveSuitability:
      row.camping_stove_suitability as CampingStoveSuitability,
    waterNeed: row.water_need as WaterNeed,
    ingredients: asIngredients(row.ingredients),
    steps: stepsNo,
    stepsNo,
    stepsEn,
    practicalTags: asStringArray(row.practical_tags),
    spotifyTitle: asOptionalText(row.spotify_title),
    spotifyArtist: asOptionalText(row.spotify_artist),
    spotifyUrl: asOptionalText(row.spotify_url),
    spotifyCodeImage: codePath
      ? recipeImageUrl(codePath, supabaseUrl)
      : null,
  })
}

function ingredientsForDb(ingredients: Ingredient[]) {
  return ingredients.map((ing) => ({
    id: ing.id,
    name_no: ing.nameNo || ing.name,
    name_en: ing.nameEnOverride ? ing.nameEn || '' : '',
    name_en_auto: ing.nameEnAuto || '',
    name_en_override: Boolean(ing.nameEnOverride),
    // legacy mirror for older clients
    name: ing.nameNo || ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
  }))
}

export function mapRecipeToRow(
  recipe: Recipe,
  extras: {
    image_path: string | null
    is_published: boolean
    notify_on_publish?: boolean
  },
): Omit<RecipeRow, 'created_at' | 'updated_at'> {
  const imagePath =
    extras.image_path ??
    (recipe.image.startsWith('/images/')
      ? recipe.image.replace('/images/recipes/', '')
      : recipe.image.includes('/recipe-images/')
        ? recipe.image.split('/recipe-images/').pop() ?? null
        : null)

  const nameNo = recipe.nameNo || recipe.name
  const shortNo = recipe.shortDescriptionNo || recipe.shortDescription
  const stepsNo =
    recipe.stepsNo?.length > 0 ? recipe.stepsNo : recipe.steps

  const nameEnAuto =
    recipe.nameEnAuto || suggestEnglishTitle(recipe.id, nameNo)
  const shortEnAuto =
    recipe.shortDescriptionEnAuto ||
    suggestEnglishDescription(recipe.id, shortNo)

  return {
    id: recipe.id,
    // Legacy columns stay Norwegian so old clients keep working
    name: nameNo,
    name_no: nameNo,
    name_en: recipe.nameEnOverride ? recipe.nameEn || '' : '',
    name_en_auto: nameEnAuto,
    name_en_override: Boolean(recipe.nameEnOverride),
    short_description: shortNo,
    short_description_no: shortNo,
    short_description_en: recipe.shortDescriptionEnOverride
      ? recipe.shortDescriptionEn || ''
      : '',
    short_description_en_auto: shortEnAuto,
    short_description_en_override: Boolean(recipe.shortDescriptionEnOverride),
    meal_type: recipe.mealType,
    time_minutes: recipe.timeMinutes,
    servings: recipe.servings > 0 ? recipe.servings : 2,
    preparation_level: recipe.preparationLevel,
    storage_need: recipe.storageNeed,
    price_level: recipe.priceLevel,
    dishwashing_level: recipe.dishwashingLevel,
    camping_stove_suitability: recipe.campingStoveSuitability,
    water_need: recipe.waterNeed,
    ingredients: ingredientsForDb(recipe.ingredients),
    steps: stepsNo,
    steps_no: stepsNo,
    steps_en: recipe.stepsEn ?? [],
    practical_tags: recipe.practicalTags,
    image_path: imagePath,
    is_published: extras.is_published,
    notify_on_publish: extras.notify_on_publish ?? false,
    spotify_title: recipe.spotifyTitle?.trim() || null,
    spotify_artist: recipe.spotifyArtist?.trim() || null,
    spotify_url: recipe.spotifyUrl?.trim() || null,
    spotify_code_image: (() => {
      const raw = recipe.spotifyCodeImage?.trim()
      if (!raw) return null
      if (raw.includes('/recipe-images/')) {
        return raw.split('/recipe-images/').pop() ?? null
      }
      if (raw.startsWith('/images/'))
        return raw.replace(/^\/images\/recipes\//, '')
      if (raw.startsWith('http')) return raw
      return raw
    })(),
  }
}
