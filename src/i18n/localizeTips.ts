import type {
  TipArticle,
  TipArticleListItem,
  TipBlock,
  TipBlockPayload,
  TipCategory,
  TipImage,
} from '../lib/tipsTypes'
import { pickEditorial } from './fallback'
import type { AppLocale } from './types'

function resolvePayloadField(
  no: string | undefined,
  en: string | undefined,
  auto: string | undefined,
  isOverride: boolean,
  locale: AppLocale,
): string {
  return pickEditorial(no ?? '', en ?? '', auto ?? '', isOverride, locale)
}

export function localizeTipPayload(
  payloadNo: TipBlockPayload,
  payloadEn: TipBlockPayload,
  payloadEnAuto: TipBlockPayload,
  isOverride: boolean,
  locale: AppLocale,
): TipBlockPayload {
  const source = isOverride && Object.keys(payloadEn).length > 0
    ? payloadEn
    : Object.keys(payloadEnAuto).length > 0
      ? payloadEnAuto
      : null

  if (locale === 'no') {
    return { ...payloadNo }
  }

  if (!source) {
    return { ...payloadNo }
  }

  // Merge: prefer EN source fields, fall back to NO for missing keys
  return {
    ...payloadNo,
    text: resolvePayloadField(
      payloadNo.text,
      payloadEn.text,
      payloadEnAuto.text,
      isOverride,
      locale,
    ) || payloadNo.text,
    title: resolvePayloadField(
      payloadNo.title,
      payloadEn.title,
      payloadEnAuto.title,
      isOverride,
      locale,
    ) || payloadNo.title,
    cite: resolvePayloadField(
      payloadNo.cite,
      payloadEn.cite,
      payloadEnAuto.cite,
      isOverride,
      locale,
    ) || payloadNo.cite,
    caption: resolvePayloadField(
      payloadNo.caption,
      payloadEn.caption,
      payloadEnAuto.caption,
      isOverride,
      locale,
    ) || payloadNo.caption,
    url: payloadNo.url || payloadEn.url || payloadEnAuto.url,
    items:
      locale === 'en' &&
      (isOverride
        ? payloadEn.items
        : payloadEnAuto.items)?.length
        ? (isOverride ? payloadEn.items : payloadEnAuto.items)
        : payloadNo.items,
  }
}

export function localizeTipCategory(
  category: TipCategory,
  locale: AppLocale,
): TipCategory {
  return {
    ...category,
    name: pickEditorial(
      category.nameNo || category.name,
      category.nameEn,
      category.nameEnAuto,
      category.nameEnOverride,
      locale,
    ),
  }
}

export function localizeTipListItem(
  item: TipArticleListItem,
  locale: AppLocale,
): TipArticleListItem {
  return {
    ...item,
    title: pickEditorial(
      item.titleNo || item.title,
      item.titleEn,
      item.titleEnAuto,
      item.titleEnOverride,
      locale,
    ),
    excerpt: pickEditorial(
      item.excerptNo || item.excerpt,
      item.excerptEn,
      item.excerptEnAuto,
      item.excerptEnOverride,
      locale,
    ),
    category: item.category
      ? localizeTipCategory(item.category, locale)
      : item.category,
  }
}

export function localizeTipBlock(block: TipBlock, locale: AppLocale): TipBlock {
  return {
    ...block,
    payload: localizeTipPayload(
      block.payloadNo,
      block.payloadEn,
      block.payloadEnAuto,
      block.payloadEnOverride,
      locale,
    ),
  }
}

export function localizeTipImage(image: TipImage, locale: AppLocale): TipImage {
  return {
    ...image,
    caption: pickEditorial(
      image.captionNo || image.caption,
      image.captionEn,
      image.captionEnAuto,
      image.captionEnOverride,
      locale,
    ),
  }
}

export function localizeTipArticle(
  article: TipArticle,
  locale: AppLocale,
): TipArticle {
  const list = localizeTipListItem(article, locale)
  return {
    ...article,
    ...list,
    blocks: article.blocks.map((b) => localizeTipBlock(b, locale)),
    images: article.images.map((img) => localizeTipImage(img, locale)),
    related_articles: article.related_articles?.map((a) =>
      localizeTipListItem(a, locale),
    ),
  }
}
