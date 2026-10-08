import {
  suggestTipBlockPayloadEn,
  suggestTipCaptionEn,
  suggestTipCategoryEn,
  suggestTipExcerptEn,
  suggestTipTitleEn,
} from '../i18n/editorialAuto'
import type {
  TipArticle,
  TipArticleListItem,
  TipBlock,
  TipBlockPayload,
  TipCategory,
  TipImage,
} from './tipsTypes'

function asPayload(value: unknown): TipBlockPayload {
  if (!value || typeof value !== 'object') return {}
  return { ...(value as TipBlockPayload) }
}

export function normalizeTipCategory(
  raw: Partial<TipCategory> & {
    name?: string
    name_no?: string
    name_en?: string
    name_en_auto?: string
    name_en_override?: boolean
  },
): TipCategory {
  const slug = String(raw.slug ?? '')
  const nameNo = String(raw.nameNo ?? raw.name_no ?? raw.name ?? '').trim()
  const nameEn = String(raw.nameEn ?? raw.name_en ?? '').trim()
  const nameEnAuto = String(
    raw.nameEnAuto ??
      raw.name_en_auto ??
      suggestTipCategoryEn(slug, nameNo) ??
      '',
  ).trim()
  const nameEnOverride =
    raw.nameEnOverride == null && raw.name_en_override == null
      ? Boolean(nameEn)
      : Boolean(raw.nameEnOverride ?? raw.name_en_override) && Boolean(nameEn)
  const isActive =
    raw.isActive == null && (raw as { is_active?: boolean }).is_active == null
      ? true
      : Boolean(
          raw.isActive ?? (raw as { is_active?: boolean }).is_active ?? true,
        )
  return {
    id: String(raw.id ?? ''),
    slug,
    name: nameNo,
    nameNo,
    nameEn,
    nameEnAuto,
    nameEnOverride,
    sort_order: Number(raw.sort_order) || 0,
    isActive,
  }
}

export function normalizeTipListFields(
  raw: Record<string, unknown>,
  category?: TipCategory | null,
): Pick<
  TipArticleListItem,
  | 'title'
  | 'titleNo'
  | 'titleEn'
  | 'titleEnAuto'
  | 'titleEnOverride'
  | 'excerpt'
  | 'excerptNo'
  | 'excerptEn'
  | 'excerptEnAuto'
  | 'excerptEnOverride'
> {
  const slug = String(raw.slug ?? '')
  const titleNo = String(
    raw.titleNo ?? raw.title_no ?? raw.title ?? '',
  ).trim()
  const titleEn = String(raw.titleEn ?? raw.title_en ?? '').trim()
  const titleEnAuto = String(
    raw.titleEnAuto ??
      raw.title_en_auto ??
      suggestTipTitleEn(slug, titleNo) ??
      '',
  ).trim()
  const titleEnOverride =
    raw.titleEnOverride == null && raw.title_en_override == null
      ? Boolean(titleEn)
      : Boolean(raw.titleEnOverride ?? raw.title_en_override) &&
        Boolean(titleEn)

  const excerptNo = String(
    raw.excerptNo ?? raw.excerpt_no ?? raw.excerpt ?? '',
  ).trim()
  const excerptEn = String(raw.excerptEn ?? raw.excerpt_en ?? '').trim()
  const excerptEnAuto = String(
    raw.excerptEnAuto ??
      raw.excerpt_en_auto ??
      suggestTipExcerptEn(slug, excerptNo) ??
      '',
  ).trim()
  const excerptEnOverride =
    raw.excerptEnOverride == null && raw.excerpt_en_override == null
      ? Boolean(excerptEn)
      : Boolean(raw.excerptEnOverride ?? raw.excerpt_en_override) &&
        Boolean(excerptEn)

  void category
  return {
    title: titleNo,
    titleNo,
    titleEn,
    titleEnAuto,
    titleEnOverride,
    excerpt: excerptNo,
    excerptNo,
    excerptEn,
    excerptEnAuto,
    excerptEnOverride,
  }
}

export function normalizeTipBlock(
  raw: Record<string, unknown>,
  articleSlug = '',
): TipBlock {
  const sortOrder = Number(raw.sort_order) || 0
  const payloadNo = asPayload(raw.payload_no ?? raw.payloadNo ?? raw.payload)
  const payloadEn = asPayload(raw.payload_en ?? raw.payloadEn)
  const curated = articleSlug
    ? suggestTipBlockPayloadEn(articleSlug, sortOrder)
    : null
  const payloadEnAuto = asPayload(
    raw.payload_en_auto ?? raw.payloadEnAuto ?? curated ?? {},
  )
  const hasEn =
    Object.keys(payloadEn).length > 0 &&
    JSON.stringify(payloadEn) !== '{}'
  const payloadEnOverride =
    raw.payload_en_override == null && raw.payloadEnOverride == null
      ? hasEn
      : Boolean(raw.payload_en_override ?? raw.payloadEnOverride) && hasEn

  return {
    id: String(raw.id ?? ''),
    article_id: String(raw.article_id ?? ''),
    block_type: String(raw.block_type) as TipBlock['block_type'],
    sort_order: sortOrder,
    payload: payloadNo,
    payloadNo,
    payloadEn,
    payloadEnAuto,
    payloadEnOverride,
  }
}

export function normalizeTipImage(
  raw: Record<string, unknown>,
  articleSlug = '',
): TipImage {
  const sortOrder = Number(raw.sort_order) || 0
  const captionNo = String(
    raw.caption_no ?? raw.captionNo ?? raw.caption ?? '',
  ).trim()
  const captionEn = String(raw.caption_en ?? raw.captionEn ?? '').trim()
  const captionEnAuto = String(
    raw.caption_en_auto ??
      raw.captionEnAuto ??
      suggestTipCaptionEn(articleSlug, sortOrder, captionNo) ??
      '',
  ).trim()
  const captionEnOverride =
    raw.caption_en_override == null && raw.captionEnOverride == null
      ? Boolean(captionEn)
      : Boolean(raw.caption_en_override ?? raw.captionEnOverride) &&
        Boolean(captionEn)

  return {
    id: String(raw.id ?? ''),
    article_id: String(raw.article_id ?? ''),
    url: String(raw.url ?? ''),
    caption: captionNo,
    captionNo,
    captionEn,
    captionEnAuto,
    captionEnOverride,
    sort_order: sortOrder,
  }
}

/** Upgrade a partially typed seed/local article into full bilingual shape. */
export function hydrateTipArticle(article: TipArticle): TipArticle {
  const category = article.category
    ? normalizeTipCategory(article.category)
    : null
  const fields = normalizeTipListFields(
    article as unknown as Record<string, unknown>,
    category,
  )
  const topics = (article.topics?.length
    ? article.topics
    : category
      ? [category]
      : []
  ).map((c) => normalizeTipCategory(c))
  const topicIds =
    article.topicIds?.length > 0
      ? article.topicIds
      : topics.map((c) => c.id).filter(Boolean)
  const searchBody =
    article.searchBody ??
    article.blocks
      .map((b) => {
        const p = b.payloadNo ?? b.payload
        return [p.title, p.text, p.cite, ...(p.items ?? [])]
          .filter(Boolean)
          .join(' ')
      })
      .join(' ')
  return {
    ...article,
    ...fields,
    category: topics[0] ?? category,
    category_id: article.category_id ?? topics[0]?.id ?? null,
    topics,
    topicIds,
    searchBody,
    blocks: article.blocks.map((b) =>
      normalizeTipBlock(
        {
          ...b,
          payload: b.payloadNo ?? b.payload,
          payload_no: b.payloadNo ?? b.payload,
          payload_en: b.payloadEn,
          payload_en_auto: b.payloadEnAuto,
          payload_en_override: b.payloadEnOverride,
        },
        article.slug,
      ),
    ),
    images: article.images.map((img) =>
      normalizeTipImage(
        {
          ...img,
          caption: img.captionNo ?? img.caption,
          caption_no: img.captionNo ?? img.caption,
          caption_en: img.captionEn,
          caption_en_auto: img.captionEnAuto,
          caption_en_override: img.captionEnOverride,
        },
        article.slug,
      ),
    ),
  }
}
