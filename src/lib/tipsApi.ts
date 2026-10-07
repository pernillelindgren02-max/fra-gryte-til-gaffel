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
  return {
    id: String(row.id),
    slug: String(row.slug ?? ''),
    name: String(row.name ?? ''),
    sort_order: Number(row.sort_order) || 0,
  }
}

function mapListItem(
  row: Record<string, unknown>,
  category?: TipCategory | null,
): TipArticleListItem {
  return {
    id: String(row.id),
    slug: String(row.slug ?? ''),
    title: String(row.title ?? ''),
    excerpt: String(row.excerpt ?? ''),
    category_id: row.category_id ? String(row.category_id) : null,
    category: category ?? null,
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

function mapBlock(row: Record<string, unknown>): TipBlock {
  const payload =
    row.payload && typeof row.payload === 'object'
      ? (row.payload as TipBlockPayload)
      : {}
  return {
    id: String(row.id),
    article_id: String(row.article_id),
    block_type: String(row.block_type) as TipBlockType,
    sort_order: Number(row.sort_order) || 0,
    payload: {
      ...payload,
      url: tipImagePublicUrl(payload.url) ?? payload.url,
    },
  }
}

function mapImage(row: Record<string, unknown>): TipImage {
  return {
    id: String(row.id),
    article_id: String(row.article_id),
    url: tipImagePublicUrl(String(row.url ?? '')) ?? '',
    caption: String(row.caption ?? ''),
    sort_order: Number(row.sort_order) || 0,
  }
}

export async function fetchTipCategories(): Promise<TipCategory[]> {
  if (!supabase) return DEFAULT_TIP_CATEGORIES
  const { data, error } = await supabase
    .from('tip_categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error || !data?.length) return DEFAULT_TIP_CATEGORIES
  return (data as Record<string, unknown>[]).map(mapCategory)
}

export async function fetchPublishedTips(): Promise<TipArticleListItem[]> {
  if (!supabase) return listDefaultPublished()
  const { data, error } = await supabase
    .from('tip_articles')
    .select('*, tip_categories(*)')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
  if (error || !data?.length) return listDefaultPublished()
  return (data as Record<string, unknown>[]).map((row) => {
    const catRaw = row.tip_categories as Record<string, unknown> | null
    return mapListItem(row, catRaw ? mapCategory(catRaw) : null)
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
  return (data as Record<string, unknown>[]).map((row) => {
    const catRaw = row.tip_categories as Record<string, unknown> | null
    return mapListItem(row, catRaw ? mapCategory(catRaw) : null)
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

  return {
    ...list,
    blocks: ((blocksRes.data as Record<string, unknown>[]) ?? []).map(mapBlock),
    images: ((imagesRes.data as Record<string, unknown>[]) ?? []).map(mapImage),
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
  const list = mapListItem(row, catRaw ? mapCategory(catRaw) : null)
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
  const list = mapListItem(row, catRaw ? mapCategory(catRaw) : null)
  return loadArticleExtras(list.id, list)
}

export type TipArticleInput = {
  slug: string
  title: string
  excerpt: string
  category_id: string | null
  status: TipStatus
  is_featured: boolean
  sort_order: number
  hero_image_url: string | null
}

export async function createTipArticle(
  input: TipArticleInput,
): Promise<TipArticleListItem> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('tip_articles')
    .insert({
      ...input,
      published_at: input.status === 'published' ? now : null,
      updated_at: now,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapListItem(data as Record<string, unknown>)
}

export async function updateTipArticle(
  id: string,
  input: Partial<TipArticleInput>,
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const patch: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString(),
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
  }>,
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error: delErr } = await supabase
    .from('tip_blocks')
    .delete()
    .eq('article_id', articleId)
  if (delErr) throw delErr
  if (blocks.length === 0) return
  const rows = blocks.map((b) => ({
    article_id: articleId,
    block_type: b.block_type,
    sort_order: b.sort_order,
    payload: b.payload,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('tip_blocks').insert(rows)
  if (error) throw error
}

export async function replaceTipImages(
  articleId: string,
  images: Array<{ url: string; caption: string; sort_order: number }>,
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error: delErr } = await supabase
    .from('tip_images')
    .delete()
    .eq('article_id', articleId)
  if (delErr) throw delErr
  if (images.length === 0) return
  const { error } = await supabase.from('tip_images').insert(
    images.map((img) => ({
      article_id: articleId,
      url: img.url,
      caption: img.caption,
      sort_order: img.sort_order,
    })),
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
