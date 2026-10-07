import { supabase } from './supabase'
import {
  getAnonymousSessionId,
  getAnalyticsEnv,
  trackEvent,
  type AnalyticsEnv,
} from './analytics'
import {
  analyzeFeedbackText,
  type FeedbackCategory,
  type FeedbackSentiment,
} from './feedbackAnalysis'

export type ProductFeedbackRow = {
  id: string
  created_at: string
  anonymous_session_id: string
  user_id: string | null
  env: AnalyticsEnv
  category: FeedbackCategory
  body: string
  page_path: string | null
  recipe_id: string | null
  tags: string[]
  sentiment: FeedbackSentiment | null
  status: 'new' | 'reviewed' | 'archived'
}

const LOCAL_KEY = 'fgtg-product-feedback-v1'
const LOCAL_MAX = 100

function pushLocal(row: ProductFeedbackRow): void {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    const list: ProductFeedbackRow[] = raw
      ? (JSON.parse(raw) as ProductFeedbackRow[])
      : []
    list.unshift(row)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, LOCAL_MAX)))
  } catch {
    /* ignore */
  }
}

export function readLocalFeedback(): ProductFeedbackRow[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as ProductFeedbackRow[]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function submitProductFeedback(opts: {
  body: string
  category?: FeedbackCategory
  pagePath?: string | null
  recipeId?: string | null
  userId?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const body = opts.body.trim().slice(0, 2000)
    if (body.length < 3) return { ok: false, error: 'Skriv litt mer (minst 3 tegn).' }

    const { sentiment, tags } = analyzeFeedbackText(body)
    const env = getAnalyticsEnv()
    const row: ProductFeedbackRow = {
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
      anonymous_session_id: getAnonymousSessionId(),
      user_id: opts.userId ?? null,
      env,
      category: opts.category ?? 'general',
      body,
      page_path: opts.pagePath?.slice(0, 120) ?? null,
      recipe_id: opts.recipeId ?? null,
      tags,
      sentiment,
      status: 'new',
    }

    pushLocal(row)
    trackEvent('feedback_submit', {
      source: 'feedback',
      path: opts.pagePath ?? null,
      recipeId: opts.recipeId ?? null,
      userId: opts.userId ?? null,
      properties: {
        category: row.category,
        sentiment: sentiment ?? 'neutral',
        tag_count: tags.length,
        char_bucket: body.length > 200 ? 'long' : 'short',
      },
    })

    if (supabase) {
      void supabase
        .from('product_feedback')
        .insert({
          anonymous_session_id: row.anonymous_session_id,
          user_id: row.user_id,
          env: row.env,
          category: row.category,
          body: row.body,
          page_path: row.page_path,
          recipe_id: row.recipe_id,
          tags: row.tags,
          sentiment: row.sentiment,
          status: 'new',
        })
        .then(() => {
          /* fail silent for UI — local copy kept */
        })
    }

    return { ok: true }
  } catch {
    return { ok: false, error: 'Kunne ikke sende. Prøv igjen.' }
  }
}

export async function fetchProductFeedback(opts?: {
  env?: AnalyticsEnv | 'all'
}): Promise<{ rows: ProductFeedbackRow[]; source: 'supabase' | 'local' }> {
  const envFilter = opts?.env ?? 'all'
  const filter = (list: ProductFeedbackRow[]) =>
    envFilter === 'all' ? list : list.filter((r) => r.env === envFilter)

  if (supabase) {
    try {
      let q = supabase
        .from('product_feedback')
        .select(
          'id, created_at, anonymous_session_id, user_id, env, category, body, page_path, recipe_id, tags, sentiment, status',
        )
        .order('created_at', { ascending: false })
        .limit(500)
      if (envFilter !== 'all') q = q.eq('env', envFilter)
      const { data, error } = await q
      if (!error && data) {
        return { rows: data as ProductFeedbackRow[], source: 'supabase' }
      }
    } catch {
      /* local */
    }
  }
  return { rows: filter(readLocalFeedback()), source: 'local' }
}

export async function updateFeedbackStatus(
  id: string,
  status: ProductFeedbackRow['status'],
): Promise<void> {
  if (!supabase || id.startsWith('local-')) return
  try {
    await supabase.from('product_feedback').update({ status }).eq('id', id)
  } catch {
    /* silent */
  }
}
