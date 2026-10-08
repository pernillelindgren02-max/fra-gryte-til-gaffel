import { resolveEnglishText } from './autoEnglish'
import type { AppLocale } from './types'

/**
 * Consistent bilingual fallback for simple NO/EN pairs
 * (no override/auto layer). Prefer locale → other → ''.
 * Never returns undefined/null.
 */
export function pickLocalized(
  no: string | null | undefined,
  en: string | null | undefined,
  locale: AppLocale,
): string {
  const n = typeof no === 'string' ? no.trim() : ''
  const e = typeof en === 'string' ? en.trim() : ''
  if (locale === 'en') {
    if (e) return e
    if (n) return n
    return ''
  }
  if (n) return n
  if (e) return e
  return ''
}

/**
 * Editorial fields with Admin override + automatic English default.
 * EN priority: manual override → auto/default → NO → ''.
 * NO: Norwegian first, then any EN as last resort.
 */
export function pickEditorial(
  no: string | null | undefined,
  manualEn: string | null | undefined,
  autoEn: string | null | undefined,
  isOverride: boolean,
  locale: AppLocale,
): string {
  const n = typeof no === 'string' ? no.trim() : ''
  if (locale === 'en') {
    return resolveEnglishText({
      no: n,
      manualEn,
      autoEn,
      isOverride,
    })
  }
  if (n) return n
  const manual =
    typeof manualEn === 'string' ? manualEn.trim() : ''
  const auto = typeof autoEn === 'string' ? autoEn.trim() : ''
  return manual || auto || ''
}

export function pickLocalizedList(
  no: string[] | null | undefined,
  en: string[] | null | undefined,
  locale: AppLocale,
): string[] {
  const n = Array.isArray(no)
    ? no.map((s) => String(s ?? '').trim()).filter(Boolean)
    : []
  const e = Array.isArray(en)
    ? en.map((s) => String(s ?? '').trim()).filter(Boolean)
    : []
  if (locale === 'en') {
    if (e.length > 0) return e
    return n
  }
  if (n.length > 0) return n
  return e
}
