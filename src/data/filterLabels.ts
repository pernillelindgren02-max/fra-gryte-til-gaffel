import type {
  CampingStoveSuitability,
  DishwashingLevel,
  IngredientCountRange,
  MealType,
  PreparationLevel,
  PriceLevel,
  StorageNeed,
  TimeRange,
  WaterNeed,
} from './recipes'

export const timeRangeLabels: Record<TimeRange, string> = {
  upTo20: '20 min eller mindre',
  '21to30': '21–30',
  '31to40': '31–40',
  '41to60': '41–60',
}

export const preparationLevelLabels: Record<PreparationLevel, string> = {
  noCutting: 'Ingen kutting',
  someCutting: 'Litt kutting',
  morePrep: 'Mer forberedelser',
}

export const ingredientCountLabels: Record<IngredientCountRange, string> = {
  '1to4': '1–4',
  '5to6': '5–6',
  '7to8': '7–8',
  moreThan8: 'Mer enn 8',
}

export const storageNeedLabels: Record<StorageNeed, string> = {
  noCooling: 'Ingen kjøling nødvendig',
  fewHoursOk: 'Tåler noen timer uten kjøling',
  needsCooling: 'Krever kjøling',
}

export const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Frokost',
  lunch: 'Lunsj',
  dinner: 'Middag',
}

export const priceLevelLabels: Record<PriceLevel, string> = {
  cheap: 'Billig',
  medium: 'Middels',
  luxury: 'Luksus',
}

export const dishwashingLevelLabels: Record<DishwashingLevel, string> = {
  almostNothing: 'Nesten ingenting',
  little: 'Lite',
  extra: 'Litt ekstra',
}

export const campingStoveLabels: Record<CampingStoveSuitability, string> = {
  perfect: 'Perfekt på primus',
  adaptable: 'Kan tilpasses primus',
  indoorBest: 'Best inne, men fungerer på primus',
}

export const waterNeedLabels: Record<WaterNeed, string> = {
  almostNone: 'Nesten ikke vann',
  some: 'Litt vann',
  lots: 'Krever mye vann',
}
