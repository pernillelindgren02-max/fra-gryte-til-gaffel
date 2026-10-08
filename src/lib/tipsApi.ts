import { supabase } from './supabase'
import {
  DEFAULT_TIP_CATEGORIES,
  getDefaultArticleBySlug,
  listDefaultPublished,
  toListItem,
  DEFAULT_TIP_ARTICLES,
} from './tipsDefaults'
import type {
  TipArticle,
  TipArticleListItem,
  TipBlock,
  TipBlockPayload,
  TipBlockType,
  TipCategory,
  TipImage,
  TipStatus,
} from './tipsTypes'
import {
  normalizeTipBlock,
  normalizeTipCategory,
  normalizeTipImage,
  normalizeTipListFields,
} from './tipsNormalize'

const BUCKET = 'tips'

export function tipImagePublicUrl(
  pathOrUrl: string | null | undefined,
): string | null {
  const raw = pathOrUrl?.trim()
  if (!raw) return null
  if (raw.startsWith('http') || raw.startsWith('/')) return raw
  const base = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
  if (!base) return `/images/tips/${raw}`
  return `${base}/storage/v1/object/public/${BUCKET}/${raw}`
}

function mapCategory(row: Record<string, unknown>): TipCategory {
  return normalizeTipCategory({
    ...row,
    name: String(row.name_no ?? row.name ?? ''),
  })
}

function mapListItem(
  row: Record<string, unknown>,
  category?: TipCategory | null,
  topics: TipCategory[] = [],
): TipArticleListItem {
  const fields = normalizeTipListFields(row, category)
  const resolvedTopics =
    topics.length > 0
      ? topics
      : category
        ? [category]
        : []
  const topicIds = resolvedTopics.map((c) => c.id).filter(Boolean)
  return {
    id: String(row.id),
    slug: String(row.slug ?? ''),
    ...fields,
    category_id: row.category_id
      ? String(row.category_id)
      : topicIds[0] ?? null,
    category: resolvedTopics[0] ?? category ?? null,
    topicIds,
    topics: resolvedTopics,
    status: (row.status === 'published' ? 'published' : 'draft') as TipStatus,
    is_featured: Boolean(row.is_featured),
    sort_order: Number(row.sort_order) || 0,
    hero_image_url: tipImagePublicUrl(
      row.hero_image_url == null ? null : String(row.hero_image_url),
    ),
    published_at: row.published_at ? String(row.published_at) : null,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  }
}

async function fetchTopicsForArticles(
  articleIds: string[],
): Promise<Map<string, TipCategory[]>> {
  const map = new Map<string, TipCategory[]>()
  if (!supabase || articleIds.length === 0) return map
  const { data, error } = await supabase
    .from('tip_article_topics')
    .select('article_id, sort_order, tip_categories(*)')
    .in('article_id', articleIds)
    .order('sort_order', { ascending: true })
  if (error || !data) return map
  for (const row of data as Record<string, unknown>[]) {
    const articleId = String(row.article_id)
    const catRaw = row.tip_categories as Record<string, unknown> | null
    if (!catRaw) continue
    const cat = mapCategory(catRaw)
    const list = map.get(articleId) ?? []
    list.push(cat)
    map.set(articleId, list)
  }
  return map
}

function mapBlock(row: Record<string, unknown>, articleSlug = ''): TipBlock {
  const block = normalizeTipBlock(row, articleSlug)
  const withUrl = (p: TipBlockPayload): TipBlockPayload => ({
    ...p,
    url: tipImagePublicUrl(p.url) ?? p.url,
  })
  return {
    ...block,
    payload: withUrl(block.payload),
    payloadNo: withUrl(block.payloadNo),
    payloadEn: withUrl(block.payloadEn),
    payloadEnAuto: withUrl(block.payloadEnAuto),
  }
}

function mapImage(row: Record<string, unknown>, articleSlug = ''): TipImage {
  const image = normalizeTipImage(row, articleSlug)
  return {
    ...image,
    url: tipImagePublicUrl(image.url) ?? '',
  }
}

export async function fetchTipCategories(opts?: {
  includeInactive?: boolean
}): Promise<TipCategory[]> {
  if (!supabase) {
    return opts?.includeInactive
      ? DEFAULT_TIP_CATEGORIES
      : DEFAULT_TIP_CATEGORIES.filter((c) => c.isActive)
  }
  const { data, error } = await supabase
    .from('tip_categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error || !data?.length) {
    return opts?.includeInactive
      ? DEFAULT_TIP_CATEGORIES
      : DEFAULT_TIP_CATEGORIES.filter((c) => c.isActive)
  }
  const rows = (data as Record<string, unknown>[]).map(mapCategory)
  return opts?.includeInactive ? rows : rows.filter((c) => c.isActive)
}

export async function fetchPublishedTips(): Promise<TipArticleListItem[]> {
  if (!supabase) return listDefaultPublished()
  const { data, error } = await supabase
    .from('tip_articles')
    .select('*, tip_categories(*)')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
  if (error || !data?.length) return listDefaultPublished()
  const rows = data as Record<string, unknown>[]
  const topicMap = await fetchTopicsForArticles(rows.map((r) => String(r.id)))
  return rows.map((row) => {
    const catRaw = row.tip_categories as Record<string, unknown> | null
    const topics = topicMap.get(String(row.id)) ?? []
    return mapListItem(row, catRaw ? mapCategory(catRaw) : null, topics)
  })
}

export async function fetchAllTipsAdmin(): Promise<TipArticleListItem[]> {
  if (!supabase) {
    return DEFAULT_TIP_ARTICLES.map(toListItem).sort(
      (a, b) => a.sort_order - b.sort_order,
    )
  }
  const { data, error } = await supabase
    .from('tip_articles')
    .select('*, tip_categories(*)')
    .order('sort_order', { ascending: true })
  if (error) throw error
  if (!data?.length) {
    return DEFAULT_TIP_ARTICLES.map(toListItem)
  }
  const rows = data as Record<string, unknown>[]
  const topicMap = await fetchTopicsForArticles(rows.map((r) => String(r.id)))
  return rows.map((row) => {
    const catRaw = row.tip_categories as Record<string, unknown> | null
    const topics = topicMap.get(String(row.id)) ?? []
    return mapListItem(row, catRaw ? mapCategory(catRaw) : null, topics)
  })
}

async function loadArticleExtras(
  articleId: string,
  list: TipArticleListItem,
): Promise<TipArticle> {
  if (!supabase) {
    const local = getDefaultArticleBySlug(list.slug)
    if (local) return local
  }

  const [blocksRes, imagesRes, recipesRes, relatedRes] = await Promise.all([
    supabase!
      .from('tip_blocks')
      .select('*')
      .eq('article_id', articleId)
      .order('sort_order', { ascending: true }),
    supabase!
      .from('tip_images')
      .select('*')
      .eq('article_id', articleId)
      .order('sort_order', { ascending: true }),
    supabase!
      .from('tip_related_recipes')
      .select('*')
      .eq('article_id', articleId)
      .order('sort_order', { ascending: true }),
    supabase!
      .from('tip_related_articles')
      .select('*')
      .eq('article_id', articleId)
      .order('sort_order', { ascending: true }),
  ])

  const relatedIds = ((relatedRes.data as { related_article_id: string }[]) ??
    []).map((r) => r.related_article_id)

  let relatedArticles: TipArticleListItem[] = []
  if (relatedIds.length && supabase) {
    const { data: relRows } = await supabase
      .from('tip_articles')
      .select('*, tip_categories(*)')
      .in('id', relatedIds)
      .eq('status', 'published')
    relatedArticles = ((relRows as Record<string, unknown>[]) ?? []).map(
      (row) => {
        const catRaw = row.tip_categories as Record<string, unknown> | null
        return mapListItem(row, catRaw ? mapCategory(catRaw) : null)
      },
    )
  }

  const slug = list.slug
  return {
    ...list,
    blocks: ((blocksRes.data as Record<string, unknown>[]) ?? []).map((row) =>
      mapBlock(row, slug),
    ),
    images: ((imagesRes.data as Record<string, unknown>[]) ?? []).map((row) =>
      mapImage(row, slug),
    ),
    related_recipe_ids: (
      (recipesRes.data as { recipe_id: string }[]) ?? []
    ).map((r) => r.recipe_id),
    related_article_ids: relatedIds,
    related_articles: relatedArticles,
  }
}

export async function fetchTipBySlug(
  slug: string,
  opts?: { allowDraft?: boolean },
): Promise<TipArticle | null> {
  if (!supabase) return getDefaultArticleBySlug(slug)

  let query = supabase
    .from('tip_articles')
    .select('*, tip_categories(*)')
    .eq('slug', slug)
    .maybeSingle()

  const { data, error } = await query
  if (error || !data) {
    return getDefaultArticleBySlug(slug)
  }
  const row = data as Record<string, unknown>
  if (row.status !== 'published' && !opts?.allowDraft) {
    return null
  }
  const catRaw = row.tip_categories as Record<string, unknown> | null
  const topicMap = await fetchTopicsForArticles([String(row.id)])
  const topics = topicMap.get(String(row.id)) ?? []
  const list = mapListItem(row, catRaw ? mapCategory(catRaw) : null, topics)
  return loadArticleExtras(list.id, list)
}

export async function fetchTipByIdAdmin(
  id: string,
): Promise<TipArticle | null> {
  if (!supabase) {
    return DEFAULT_TIP_ARTICLES.find((a) => a.id === id) ?? null
  }
  const { data, error } = await supabase
    .from('tip_articles')
    .select('*, tip_categories(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as Record<string, unknown>
  const catRaw = row.tip_categories as Record<string, unknown> | null
  const topicMap = await fetchTopicsForArticles([String(row.id)])
  const topics = topicMap.get(String(row.id)) ?? []
  const list = mapListItem(row, catRaw ? mapCategory(catRaw) : null, topics)
  return loadArticleExtras(list.id, list)
}

export type TipArticleInput = {
  slug: string
  title: string
  title_no?: string
  title_en?: string
  title_en_auto?: string
  title_en_override?: boolean
  excerpt: string
  excerpt_no?: string
  excerpt_en?: string
  excerpt_en_auto?: string
  excerpt_en_override?: boolean
  category_id: string | null
  /** Multi-topic assignment (ids). First becomes category_id when set. */
  topic_ids?: string[]
  status: TipStatus
  is_featured: boolean
  sort_order: number
  hero_image_url: string | null
}

export type TipCategoryInput = {
  slug: string
  name_no: string
  name_en?: string
  name_en_auto?: string
  name_en_override?: boolean
  sort_order: number
  is_active?: boolean
}

function articleInputToRow(input: TipArticleInput | Partial<TipArticleInput>) {
  const titleNo = (input.title_no ?? input.title ?? '').trim()
  const excerptNo = (input.excerpt_no ?? input.excerpt ?? '').trim()
  const titleEnOverride =
    Boolean(input.title_en_override) && Boolean((input.title_en || '').trim())
  const excerptEnOverride =
    Boolean(input.excerpt_en_override) &&
    Boolean((input.excerpt_en || '').trim())
  return {
    slug: input.slug,
    title: titleNo,
    title_no: titleNo,
    title_en: titleEnOverride ? (input.title_en || '').trim() : '',
    title_en_auto: input.title_en_auto ?? '',
    title_en_override: titleEnOverride,
    excerpt: excerptNo,
    excerpt_no: excerptNo,
    excerpt_en: excerptEnOverride ? (input.excerpt_en || '').trim() : '',
    excerpt_en_auto: input.excerpt_en_auto ?? '',
    excerpt_en_override: excerptEnOverride,
    category_id: input.category_id,
    status: input.status,
    is_featured: input.is_featured,
    sort_order: input.sort_order,
    hero_image_url: input.hero_image_url,
  }
}

export async function createTipArticle(
  input: TipArticleInput,
): Promise<TipArticleListItem> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const now = new Date().toISOString()
  const row = articleInputToRow(input)
  const { data, error } = await supabase
    .from('tip_articles')
    .insert({
      ...row,
      published_at: input.status === 'published' ? now : null,
      updated_at: now,
    })
    .select('*')
    .single()
  if (error) throw error
  const list = mapListItem(data as Record<string, unknown>)
  if (input.topic_ids) {
    try {
      await replaceArticleTopics(list.id, input.topic_ids)
    } catch {
      /* tip_article_topics may not exist until SQL migration */
    }
  }
  return list
}

export async function updateTipArticle(
  id: string,
  input: Partial<TipArticleInput>,
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.slug != null) patch.slug = input.slug
  if (
    input.title != null ||
    input.title_no != null ||
    input.title_en != null ||
    input.title_en_override != null
  ) {
    Object.assign(patch, articleInputToRow({
      slug: input.slug ?? '',
      title: input.title ?? input.title_no ?? '',
      title_no: input.title_no,
      title_en: input.title_en,
      title_en_auto: input.title_en_auto,
      title_en_override: input.title_en_override,
      excerpt: input.excerpt ?? input.excerpt_no ?? '',
      excerpt_no: input.excerpt_no,
      excerpt_en: input.excerpt_en,
      excerpt_en_auto: input.excerpt_en_auto,
      excerpt_en_override: input.excerpt_en_override,
      category_id: input.category_id ?? null,
      status: input.status ?? 'draft',
      is_featured: input.is_featured ?? false,
      sort_order: input.sort_order ?? 0,
      hero_image_url: input.hero_image_url ?? null,
    }))
  } else {
    if (input.excerpt != null || input.excerpt_no != null) {
      const excerptNo = (input.excerpt_no ?? input.excerpt ?? '').trim()
      patch.excerpt = excerptNo
      patch.excerpt_no = excerptNo
    }
    if (input.excerpt_en != null || input.excerpt_en_override != null) {
      const override =
        Boolean(input.excerpt_en_override) &&
        Boolean((input.excerpt_en || '').trim())
      patch.excerpt_en = override ? (input.excerpt_en || '').trim() : ''
      patch.excerpt_en_override = override
      if (input.excerpt_en_auto != null)
        patch.excerpt_en_auto = input.excerpt_en_auto
    }
    if (input.category_id !== undefined) patch.category_id = input.category_id
    if (input.status != null) patch.status = input.status
    if (input.is_featured != null) patch.is_featured = input.is_featured
    if (input.sort_order != null) patch.sort_order = input.sort_order
    if (input.hero_image_url !== undefined)
      patch.hero_image_url = input.hero_image_url
  }
  if (input.status === 'published') {
    patch.published_at = new Date().toISOString()
  }
  const { error } = await supabase
    .from('tip_articles')
    .update(patch)
    .eq('id', id)
  if (error) throw error
}

export async function deleteTipArticle(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error } = await supabase.from('tip_articles').delete().eq('id', id)
  if (error) throw error
}

export async function replaceTipBlocks(
  articleId: string,
  blocks: Array<{
    block_type: TipBlockType
    sort_order: number
    payload: TipBlockPayload
    payload_no?: TipBlockPayload
    payload_en?: TipBlockPayload
    payload_en_auto?: TipBlockPayload
    payload_en_override?: boolean
  }>,
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error: delErr } = await supabase
    .from('tip_blocks')
    .delete()
    .eq('article_id', articleId)
  if (delErr) throw delErr
  if (blocks.length === 0) return
  const rows = blocks.map((b) => {
    const payloadNo = b.payload_no ?? b.payload
    const hasEn =
      Boolean(b.payload_en_override) &&
      b.payload_en &&
      Object.keys(b.payload_en).length > 0
    return {
      article_id: articleId,
      block_type: b.block_type,
      sort_order: b.sort_order,
      payload: payloadNo,
      payload_no: payloadNo,
      payload_en: hasEn ? b.payload_en : {},
      payload_en_auto: b.payload_en_auto ?? {},
      payload_en_override: Boolean(hasEn),
      updated_at: new Date().toISOString(),
    }
  })
  const { error } = await supabase.from('tip_blocks').insert(rows)
  if (error) throw error
}

export async function replaceTipImages(
  articleId: string,
  images: Array<{
    url: string
    caption: string
    caption_no?: string
    caption_en?: string
    caption_en_auto?: string
    caption_en_override?: boolean
    sort_order: number
  }>,
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error: delErr } = await supabase
    .from('tip_images')
    .delete()
    .eq('article_id', articleId)
  if (delErr) throw delErr
  if (images.length === 0) return
  const { error } = await supabase.from('tip_images').insert(
    images.map((img) => {
      const captionNo = (img.caption_no ?? img.caption).trim()
      const override =
        Boolean(img.caption_en_override) &&
        Boolean((img.caption_en || '').trim())
      return {
        article_id: articleId,
        url: img.url,
        caption: captionNo,
        caption_no: captionNo,
        caption_en: override ? (img.caption_en || '').trim() : '',
        caption_en_auto: img.caption_en_auto ?? '',
        caption_en_override: override,
        sort_order: img.sort_order,
      }
    }),
  )
  if (error) throw error
}

export async function replaceRelatedRecipes(
  articleId: string,
  recipeIds: string[],
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  await supabase
    .from('tip_related_recipes')
    .delete()
    .eq('article_id', articleId)
  if (!recipeIds.length) return
  const { error } = await supabase.from('tip_related_recipes').insert(
    recipeIds.map((recipe_id, i) => ({
      article_id: articleId,
      recipe_id,
      sort_order: i + 1,
    })),
  )
  if (error) throw error
}

export async function replaceRelatedArticles(
  articleId: string,
  relatedIds: string[],
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  await supabase
    .from('tip_related_articles')
    .delete()
    .eq('article_id', articleId)
  if (!relatedIds.length) return
  const { error } = await supabase.from('tip_related_articles').insert(
    relatedIds
      .filter((id) => id !== articleId)
      .map((related_article_id, i) => ({
        article_id: articleId,
        related_article_id,
        sort_order: i + 1,
      })),
  )
  if (error) throw error
}

export async function uploadTipImage(
  articleId: string,
  file: File,
  kind: 'hero' | 'extra' = 'extra',
): Promise<string> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ext === 'jpeg' ? 'jpg' : ext
  const path = `${articleId}/${kind}-${Date.now()}.${safeExt}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  return path
}

export async function removeTipStoragePath(pathOrUrl: string): Promise<void> {
  if (!supabase || !pathOrUrl) return
  if (pathOrUrl.startsWith('/images/')) return
  const key = pathOrUrl.includes(`/${BUCKET}/`)
    ? pathOrUrl.split(`/${BUCKET}/`).pop()!
    : pathOrUrl.replace(/^\//, '')
  await supabase.storage.from(BUCKET).remove([key])
}

/** Replace multi-topic assignment; first id also written to category_id. */
export async function replaceArticleTopics(
  articleId: string,
  topicIds: string[],
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const unique = [...new Set(topicIds.map((id) => id.trim()).filter(Boolean))]
  await supabase.from('tip_article_topics').delete().eq('article_id', articleId)
  if (unique.length) {
    const { error } = await supabase.from('tip_article_topics').insert(
      unique.map((category_id, i) => ({
        article_id: articleId,
        category_id,
        sort_order: i + 1,
      })),
    )
    if (error) throw error
  }
  const { error: artErr } = await supabase
    .from('tip_articles')
    .update({
      category_id: unique[0] ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', articleId)
  if (artErr) throw artErr
}

export async function upsertTipCategory(
  input: TipCategoryInput,
  id?: string,
): Promise<TipCategory> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const nameNo = input.name_no.trim()
  const nameEnOverride =
    Boolean(input.name_en_override) && Boolean((input.name_en || '').trim())
  const row = {
    slug: input.slug.trim(),
    name: nameNo,
    name_no: nameNo,
    name_en: nameEnOverride ? (input.name_en || '').trim() : '',
    name_en_auto: input.name_en_auto ?? '',
    name_en_override: nameEnOverride,
    sort_order: input.sort_order,
    is_active: input.is_active !== false,
    updated_at: new Date().toISOString(),
  }
  if (id) {
    const { data, error } = await supabase
      .from('tip_categories')
      .update(row)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return mapCategory(data as Record<string, unknown>)
  }
  const { data, error } = await supabase
    .from('tip_categories')
    .insert(row)
    .select('*')
    .single()
  if (error) throw error
  return mapCategory(data as Record<string, unknown>)
}

export async function setTipCategoryActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error } = await supabase
    .from('tip_categories')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function reorderTipCategories(
  orderedIds: string[],
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase!
        .from('tip_categories')
        .update({ sort_order: index + 1, updated_at: new Date().toISOString() })
        .eq('id', id),
    ),
  )
}
