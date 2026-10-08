import { buildNotificationDeepLinkPayload } from './recipeLinks'
import { supabase } from './supabase'

export type AdminNotificationRow = {
  id: string
  recipe_id: string | null
  deep_link: string | null
  title: string
  body: string
  title_no?: string | null
  title_en?: string | null
  title_en_auto?: string | null
  title_en_override?: boolean | null
  body_no?: string | null
  body_en?: string | null
  body_en_auto?: string | null
  body_en_override?: boolean | null
  sent_at: string
  recipient_count: number
  read_count: number
}

export async function fetchNotifyPreference(
  userId: string,
): Promise<boolean> {
  if (!supabase) return true
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('notify_new_recipes')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) {
    const { error: insertError } = await supabase
      .from('notification_preferences')
      .insert({ user_id: userId, notify_new_recipes: true })
    if (insertError) throw insertError
    return true
  }
  return Boolean(data.notify_new_recipes)
}

export async function saveNotifyPreference(
  userId: string,
  notifyNewRecipes: boolean,
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error } = await supabase.from('notification_preferences').upsert({
    user_id: userId,
    notify_new_recipes: notifyNewRecipes,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function adminSendNotification(input: {
  recipeId: string | null
  title: string
  body: string
  titleNo?: string
  titleEn?: string
  titleEnAuto?: string
  titleEnOverride?: boolean
  bodyNo?: string
  bodyEn?: string
  bodyEnAuto?: string
  bodyEnOverride?: boolean
}): Promise<{ notification_id: string; recipient_count: number }> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  void buildNotificationDeepLinkPayload(input.recipeId)

  const titleNo = (input.titleNo ?? input.title).trim()
  const bodyNo = (input.bodyNo ?? input.body).trim()
  const titleEnOverride =
    Boolean(input.titleEnOverride) && Boolean((input.titleEn || '').trim())
  const bodyEnOverride =
    Boolean(input.bodyEnOverride) && Boolean((input.bodyEn || '').trim())

  // Prefer bilingual RPC when available; fall back to legacy 3-arg RPC.
  const bilingual = await supabase.rpc('admin_send_notification_bilingual', {
    p_recipe_id: input.recipeId ?? '',
    p_title_no: titleNo,
    p_body_no: bodyNo,
    p_title_en: titleEnOverride ? (input.titleEn || '').trim() : '',
    p_body_en: bodyEnOverride ? (input.bodyEn || '').trim() : '',
    p_title_en_auto: (input.titleEnAuto || '').trim(),
    p_body_en_auto: (input.bodyEnAuto || '').trim(),
    p_title_en_override: titleEnOverride,
    p_body_en_override: bodyEnOverride,
  })

  if (!bilingual.error && bilingual.data) {
    const result = bilingual.data as {
      notification_id: string
      recipient_count: number
    }
    return result
  }

  const { data, error } = await supabase.rpc('admin_send_notification', {
    p_recipe_id: input.recipeId ?? '',
    p_title: titleNo,
    p_body: bodyNo,
  })
  if (error) throw error

  const result = data as {
    notification_id: string
    recipient_count: number
  }

  // Best-effort patch bilingual columns if RPC was legacy-only.
  if (result.notification_id) {
    await supabase
      .from('notifications')
      .update({
        title_no: titleNo,
        body_no: bodyNo,
        title_en: titleEnOverride ? (input.titleEn || '').trim() : '',
        body_en: bodyEnOverride ? (input.bodyEn || '').trim() : '',
        title_en_auto: (input.titleEnAuto || '').trim(),
        body_en_auto: (input.bodyEnAuto || '').trim(),
        title_en_override: titleEnOverride,
        body_en_override: bodyEnOverride,
      })
      .eq('id', result.notification_id)
  }

  return result
}

export async function adminListNotifications(): Promise<
  AdminNotificationRow[]
> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { data, error } = await supabase.rpc('admin_list_notifications')
  if (error) throw error
  return ((data as AdminNotificationRow[]) ?? []).map((row) => ({
    ...row,
    deep_link:
      row.deep_link ??
      buildNotificationDeepLinkPayload(row.recipe_id).deep_link,
    recipient_count: Number(row.recipient_count),
    read_count: Number(row.read_count),
  }))
}
