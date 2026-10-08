import type { AppLocale } from '../i18n/types'
import type { TipArticleListItem, TipCategory } from '../lib/tipsTypes'

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function topicHaystack(item: TipArticleListItem, locale: AppLocale): string {
  const cats = item.topics?.length
    ? item.topics
    : item.category
      ? [item.category]
      : []
  return cats
    .map((c) =>
      [
        c.slug,
        c.name,
        c.nameNo,
        c.nameEn,
        c.nameEnAuto,
        locale === 'en'
          ? c.nameEn || c.nameEnAuto || c.nameNo
          : c.nameNo || c.name,
      ].join(' '),
    )
    .join(' ')
}

/**
 * Locale-aware tip search across title, excerpt, topic names, and optional body.
 */
export function searchTips(
  items: TipArticleListItem[],
  query: string,
  locale: AppLocale,
): TipArticleListItem[] {
  const q = normalize(query)
  if (!q) return items
  return items.filter((item) => {
    const hay = normalize(
      [
        item.title,
        item.titleNo,
        item.titleEn,
        item.titleEnAuto,
        item.excerpt,
        item.excerptNo,
        item.excerptEn,
        item.excerptEnAuto,
        topicHaystack(item, locale),
        item.searchBody ?? '',
      ].join(' '),
    )
    return hay.includes(q)
  })
}

/** Keep articles that have ≥1 of the selected topic ids (OR within topics). */
export function filterTipsByTopicIds(
  items: TipArticleListItem[],
  topicIds: string[],
): TipArticleListItem[] {
  if (topicIds.length === 0) return items
  const set = new Set(topicIds)
  return items.filter((item) => {
    const ids =
      item.topicIds?.length > 0
        ? item.topicIds
        : item.category_id
          ? [item.category_id]
          : []
    return ids.some((id) => set.has(id))
  })
}

export function activeTipTopics(
  categories: TipCategory[],
): TipCategory[] {
  return categories.filter((c) => c.isActive !== false)
}
