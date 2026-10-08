import {
  suggestEnglishDescription,
  suggestEnglishIngredient,
  suggestEnglishTitle,
} from './autoEnglish'
import { pickEditorial, pickLocalizedList } from './fallback'
import type { AppLocale } from './types'

/** Canonical ingredient id — language-independent matching key. */
export function slugifyIngredientId(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'ingredient'
}

export type BilingualIngredientInput = {
  id?: string | null
  name?: string | null
  name_no?: string | null
  name_en?: string | null
  nameNo?: string | null
  nameEn?: string | null
  name_en_auto?: string | null
  nameEnAuto?: string | null
  name_en_override?: boolean | null
  nameEnOverride?: boolean | null
  quantity?: number | null
  unit?: string | null
}

export type LocalizedIngredient = {
  id: string
  nameNo: string
  nameEn: string
  nameEnAuto: string
  nameEnOverride: boolean
  /** Display name for active locale (resolved). */
  name: string
  quantity: number | null
  unit: import('../data/recipes').IngredientUnit
}

export function normalizeIngredient(
  raw: BilingualIngredientInput,
  locale: AppLocale = 'no',
): LocalizedIngredient {
  const nameNo = String(
    raw.nameNo ?? raw.name_no ?? raw.name ?? '',
  ).trim()
  const nameEn = String(raw.nameEn ?? raw.name_en ?? '').trim()
  const id = String(raw.id ?? '').trim() || slugifyIngredientId(nameNo || nameEn)
  const nameEnAuto = String(
    raw.nameEnAuto ??
      raw.name_en_auto ??
      suggestEnglishIngredient(id, nameNo) ??
      '',
  ).trim()
  const nameEnOverride =
    Boolean(raw.nameEnOverride ?? raw.name_en_override) && Boolean(nameEn)
  return {
    id,
    nameNo,
    nameEn,
    nameEnAuto,
    nameEnOverride,
    name: pickEditorial(nameNo, nameEn, nameEnAuto, nameEnOverride, locale),
    quantity:
      raw.quantity === null || raw.quantity === undefined
        ? null
        : Number(raw.quantity),
    unit: (raw.unit ?? null) as LocalizedIngredient['unit'],
  }
}

export type BilingualRecipeFields = {
  name?: string | null
  name_no?: string | null
  name_en?: string | null
  nameNo?: string | null
  nameEn?: string | null
  name_en_auto?: string | null
  nameEnAuto?: string | null
  name_en_override?: boolean | null
  nameEnOverride?: boolean | null
  shortDescription?: string | null
  short_description?: string | null
  short_description_no?: string | null
  short_description_en?: string | null
  shortDescriptionNo?: string | null
  shortDescriptionEn?: string | null
  short_description_en_auto?: string | null
  shortDescriptionEnAuto?: string | null
  short_description_en_override?: boolean | null
  shortDescriptionEnOverride?: boolean | null
  steps?: unknown
  steps_no?: unknown
  steps_en?: unknown
  stepsNo?: unknown
  stepsEn?: unknown
  ingredients?: unknown
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item ?? ''))
}

export function resolveRecipeText(
  raw: BilingualRecipeFields,
  locale: AppLocale,
): {
  name: string
  nameNo: string
  nameEn: string
  nameEnAuto: string
  nameEnOverride: boolean
  shortDescription: string
  shortDescriptionNo: string
  shortDescriptionEn: string
  shortDescriptionEnAuto: string
  shortDescriptionEnOverride: boolean
  steps: string[]
  stepsNo: string[]
  stepsEn: string[]
  ingredients: LocalizedIngredient[]
} {
  const nameNo = String(
    raw.nameNo ?? raw.name_no ?? raw.name ?? '',
  ).trim()
  const nameEn = String(raw.nameEn ?? raw.name_en ?? '').trim()
  const recipeId = String(
    (raw as { id?: string | null }).id ?? '',
  ).trim()
  const nameEnAuto = String(
    raw.nameEnAuto ??
      raw.name_en_auto ??
      suggestEnglishTitle(recipeId, nameNo) ??
      '',
  ).trim()
  const nameEnOverride =
    Boolean(raw.nameEnOverride ?? raw.name_en_override) && Boolean(nameEn)

  const shortDescriptionNo = String(
    raw.shortDescriptionNo ??
      raw.short_description_no ??
      raw.shortDescription ??
      raw.short_description ??
      '',
  ).trim()
  const shortDescriptionEn = String(
    raw.shortDescriptionEn ?? raw.short_description_en ?? '',
  ).trim()
  const shortDescriptionEnAuto = String(
    raw.shortDescriptionEnAuto ??
      raw.short_description_en_auto ??
      suggestEnglishDescription(recipeId, shortDescriptionNo) ??
      '',
  ).trim()
  const shortDescriptionEnOverride =
    Boolean(
      raw.shortDescriptionEnOverride ?? raw.short_description_en_override,
    ) && Boolean(shortDescriptionEn)

  const stepsNo = asStringArray(
    raw.stepsNo ?? raw.steps_no ?? raw.steps ?? [],
  )
  const stepsEn = asStringArray(raw.stepsEn ?? raw.steps_en ?? [])

  const ingRaw = Array.isArray(raw.ingredients) ? raw.ingredients : []
  const ingredients = ingRaw.map((item) =>
    normalizeIngredient(item as BilingualIngredientInput, locale),
  )

  return {
    nameNo,
    nameEn,
    nameEnAuto,
    nameEnOverride,
    name: pickEditorial(nameNo, nameEn, nameEnAuto, nameEnOverride, locale),
    shortDescriptionNo,
    shortDescriptionEn,
    shortDescriptionEnAuto,
    shortDescriptionEnOverride,
    shortDescription: pickEditorial(
      shortDescriptionNo,
      shortDescriptionEn,
      shortDescriptionEnAuto,
      shortDescriptionEnOverride,
      locale,
    ),
    stepsNo,
    stepsEn,
    steps: pickLocalizedList(stepsNo, stepsEn, locale),
    ingredients,
  }
}
