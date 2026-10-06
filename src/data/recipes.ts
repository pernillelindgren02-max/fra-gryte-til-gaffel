export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type PreparationLevel = 'noCutting' | 'someCutting' | 'morePrep'
export type StorageNeed = 'noCooling' | 'fewHoursOk' | 'needsCooling'
export type PriceLevel = 'cheap' | 'medium' | 'luxury'
export type DishwashingLevel = 'almostNothing' | 'little' | 'extra'
export type CampingStoveSuitability = 'perfect' | 'adaptable' | 'indoorBest'
export type WaterNeed = 'almostNone' | 'some' | 'lots'

export type TimeRange = 'upTo20' | '21to30' | '31to40' | '41to60'
export type IngredientCountRange = '1to4' | '5to6' | '7to8' | 'moreThan8'

export interface Recipe {
  id: string
  name: string
  shortDescription: string
  timeMinutes: number
  mealType: MealType
  preparationLevel: PreparationLevel
  storageNeed: StorageNeed
  priceLevel: PriceLevel
  dishwashingLevel: DishwashingLevel
  campingStoveSuitability: CampingStoveSuitability
  waterNeed: WaterNeed
  ingredients: string[]
  steps: string[]
  practicalTags: string[]
}

export interface FilterState {
  timeRanges: TimeRange[]
  preparationLevels: PreparationLevel[]
  ingredientCountRanges: IngredientCountRange[]
  storageNeeds: StorageNeed[]
  mealTypes: MealType[]
  priceLevels: PriceLevel[]
  dishwashingLevels: DishwashingLevel[]
  campingStoveSuitabilities: CampingStoveSuitability[]
  waterNeeds: WaterNeed[]
}

export const emptyFilters: FilterState = {
  timeRanges: [],
  preparationLevels: [],
  ingredientCountRanges: [],
  storageNeeds: [],
  mealTypes: [],
  priceLevels: [],
  dishwashingLevels: [],
  campingStoveSuitabilities: [],
  waterNeeds: [],
}

export const recipes: Recipe[] = [
  {
    id: 'primus-pasta-pesto',
    name: 'Primuspasta med pesto',
    shortDescription:
      'Rask one-pot pasta som koker ferdig i én gryte på primus. Lite utstyr, stor smak.',
    timeMinutes: 18,
    mealType: 'dinner',
    preparationLevel: 'noCutting',
    storageNeed: 'noCooling',
    priceLevel: 'cheap',
    dishwashingLevel: 'almostNothing',
    campingStoveSuitability: 'perfect',
    waterNeed: 'some',
    ingredients: [
      '200 g pasta',
      '4 dl vann',
      '2 ss ferdig pesto',
      '1 neve parmesan (valgfritt)',
    ],
    steps: [
      'Hell pasta og vann i gryta. Kok opp på medium varme.',
      'Rør av og til til pastaen er mør og væsken nesten er kokt inn (ca. 10–12 min).',
      'Ta av varmen. Rør inn pesto.',
      'Server med parmesan om du har det.',
    ],
    practicalTags: ['Én gryte', 'Ingen kutting', 'Primusvennlig'],
  },
  {
    id: 'egg-i-boks',
    name: 'Egg i boks',
    shortDescription:
      'Lunsjegger med hermetiske bønner og krydder — ingen kjøling, klar på under halvtimen.',
    timeMinutes: 25,
    mealType: 'lunch',
    preparationLevel: 'someCutting',
    storageNeed: 'fewHoursOk',
    priceLevel: 'medium',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'almostNone',
    ingredients: [
      '4 egg',
      '1 boks hvite bønner (400 g)',
      '1 ss olje',
      '1 ts paprika',
      'Salt og pepper',
      'Litt frisk urt eller tørket oregano',
    ],
    steps: [
      'Varm olje i panna. Hell av litt væske fra bønnene og ha dem i.',
      'Krydre med paprika, salt og pepper. Varm i 3–4 min.',
      'Lag fire fordypninger og knakk i et egg i hver.',
      'Sett lokk på og la eggene stivne på lav varme (ca. 6–8 min).',
      'Strø over urter og server rett fra panna.',
    ],
    practicalTags: ['Hermetikk', 'Liten oppvask', 'Mettende'],
  },
  {
    id: 'turgryte-linser',
    name: 'Turgryte med linser',
    shortDescription:
      'Varmende linsegryte for middag på tur eller i et lite kjøkken. Tåler litt forberedelse, god belønning.',
    timeMinutes: 40,
    mealType: 'dinner',
    preparationLevel: 'morePrep',
    storageNeed: 'needsCooling',
    priceLevel: 'cheap',
    dishwashingLevel: 'extra',
    campingStoveSuitability: 'indoorBest',
    waterNeed: 'lots',
    ingredients: [
      '1 gul løk',
      '2 gulrøtter',
      '2 dl røde linser',
      '1 boks hakkede tomater',
      '6 dl vann eller buljong',
      '2 ss olje',
      '1 ts spisskummen',
      '1 ts salt',
      'Pepper etter smak',
    ],
    steps: [
      'Skrell og hakk løk og gulrot i små biter.',
      'Varm olje i gryta. Surr grønnsakene i 5 min.',
      'Tilsett linser, tomater, vann/buljong og krydder.',
      'Kok opp, sett ned varmen og la småkoke i 20–25 min til linsene er møre.',
      'Smak til med salt og pepper. Server varm.',
    ],
    practicalTags: ['Mettende', 'Billig', 'Restemat'],
  },
]

export function getIngredientCount(recipe: Recipe): number {
  return recipe.ingredients.length
}

export function getTimeRange(minutes: number): TimeRange | null {
  if (minutes <= 20) return 'upTo20'
  if (minutes <= 30) return '21to30'
  if (minutes <= 40) return '31to40'
  if (minutes <= 60) return '41to60'
  return null
}

export function getIngredientCountRange(count: number): IngredientCountRange {
  if (count <= 4) return '1to4'
  if (count <= 6) return '5to6'
  if (count <= 8) return '7to8'
  return 'moreThan8'
}

export function getRecipeById(id: string): Recipe | undefined {
  return recipes.find((recipe) => recipe.id === id)
}
