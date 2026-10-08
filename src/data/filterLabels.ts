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
import { translate } from '../i18n/messages'
import type { AppLocale } from '../i18n/types'

/** Stable internal values → translated labels. Default locale NO for legacy callers. */
export function getTimeRangeLabels(
  locale: AppLocale = 'no',
): Record<TimeRange, string> {
  return {
    upTo20: translate(locale, 'time.upTo20'),
    '21to30': translate(locale, 'time.21to30'),
    '31to40': translate(locale, 'time.31to40'),
    '41to60': translate(locale, 'time.41to60'),
  }
}

export function getPreparationLevelLabels(
  locale: AppLocale = 'no',
): Record<PreparationLevel, string> {
  return {
    noCutting: translate(locale, 'prep.noCutting'),
    someCutting: translate(locale, 'prep.someCutting'),
    morePrep: translate(locale, 'prep.morePrep'),
  }
}

export function getIngredientCountLabels(
  locale: AppLocale = 'no',
): Record<IngredientCountRange, string> {
  return {
    '1to4': translate(locale, 'ingCount.1to4'),
    '5to6': translate(locale, 'ingCount.5to6'),
    '7to8': translate(locale, 'ingCount.7to8'),
    moreThan8: translate(locale, 'ingCount.moreThan8'),
  }
}

export function getStorageNeedLabels(
  locale: AppLocale = 'no',
): Record<StorageNeed, string> {
  return {
    noCooling: translate(locale, 'storage.noCooling'),
    fewHoursOk: translate(locale, 'storage.fewHoursOk'),
    needsCooling: translate(locale, 'storage.needsCooling'),
  }
}

export function getMealTypeLabels(
  locale: AppLocale = 'no',
): Record<MealType, string> {
  return {
    breakfast: translate(locale, 'meal.breakfast'),
    lunch: translate(locale, 'meal.lunch'),
    dinner: translate(locale, 'meal.dinner'),
  }
}

export function getPriceLevelLabels(
  locale: AppLocale = 'no',
): Record<PriceLevel, string> {
  return {
    cheap: translate(locale, 'price.cheap'),
    medium: translate(locale, 'price.medium'),
    luxury: translate(locale, 'price.luxury'),
  }
}

export function getDishwashingLevelLabels(
  locale: AppLocale = 'no',
): Record<DishwashingLevel, string> {
  return {
    almostNothing: translate(locale, 'dishes.almostNothing'),
    little: translate(locale, 'dishes.little'),
    extra: translate(locale, 'dishes.extra'),
  }
}

export function getCampingStoveLabels(
  locale: AppLocale = 'no',
): Record<CampingStoveSuitability, string> {
  return {
    perfect: translate(locale, 'stove.perfect'),
    adaptable: translate(locale, 'stove.adaptable'),
    indoorBest: translate(locale, 'stove.indoorBest'),
  }
}

export function getWaterNeedLabels(
  locale: AppLocale = 'no',
): Record<WaterNeed, string> {
  return {
    almostNone: translate(locale, 'water.almostNone'),
    some: translate(locale, 'water.some'),
    lots: translate(locale, 'water.lots'),
  }
}

/** Legacy NO exports — prefer get*Labels(locale) in new code. */
export const timeRangeLabels = getTimeRangeLabels('no')
export const preparationLevelLabels = getPreparationLevelLabels('no')
export const ingredientCountLabels = getIngredientCountLabels('no')
export const storageNeedLabels = getStorageNeedLabels('no')
export const mealTypeLabels = getMealTypeLabels('no')
export const priceLevelLabels = getPriceLevelLabels('no')
export const dishwashingLevelLabels = getDishwashingLevelLabels('no')
export const campingStoveLabels = getCampingStoveLabels('no')
export const waterNeedLabels = getWaterNeedLabels('no')
