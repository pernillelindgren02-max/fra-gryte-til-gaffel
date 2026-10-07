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
import { recipeImageUrl } from '../data/recipes'

export type RecipeRow = {
  id: string
  name: string
  short_description: string
  meal_type: string
  time_minutes: number
  servings: number
  preparation_level: string
  storage_need: string
  price_level: string
  dishwashing_level: string
  camping_stove_suitability: string
  water_need: string
  ingredients: Ingredient[] | unknown
  steps: string[] | unknown
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

function asIngredients(value: unknown): Ingredient[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const row = item as Partial<Ingredient>
    return {
      name: String(row.name ?? ''),
      quantity:
        row.quantity === null || row.quantity === undefined
          ? null
          : Number(row.quantity),
      unit: (row.unit ?? null) as Ingredient['unit'],
    }
  })
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

export function mapRowToRecipe(row: RecipeRow, supabaseUrl?: string): Recipe {
  const codePath = asOptionalText(row.spotify_code_image)
  return {
    id: row.id,
    name: row.name,
    shortDescription: row.short_description,
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
    steps: asStringArray(row.steps),
    practicalTags: asStringArray(row.practical_tags),
    spotifyTitle: asOptionalText(row.spotify_title),
    spotifyArtist: asOptionalText(row.spotify_artist),
    spotifyUrl: asOptionalText(row.spotify_url),
    spotifyCodeImage: codePath
      ? recipeImageUrl(codePath, supabaseUrl)
      : null,
  }
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

  return {
    id: recipe.id,
    name: recipe.name,
    short_description: recipe.shortDescription,
    meal_type: recipe.mealType,
    time_minutes: recipe.timeMinutes,
    servings: recipe.servings > 0 ? recipe.servings : 2,
    preparation_level: recipe.preparationLevel,
    storage_need: recipe.storageNeed,
    price_level: recipe.priceLevel,
    dishwashing_level: recipe.dishwashingLevel,
    camping_stove_suitability: recipe.campingStoveSuitability,
    water_need: recipe.waterNeed,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
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
      if (raw.startsWith('/images/')) return raw.replace(/^\/images\/recipes\//, '')
      if (raw.startsWith('http')) return raw
      return raw
    })(),
  }
}
