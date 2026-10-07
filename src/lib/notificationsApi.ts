import { supabase } from './supabase'

export type NotificationPreference = {
  notify_new_recipes: boolean
}

export type UserNotification = {
  notification_id: string
  title: string
  body: string
  recipe_id: string | null
  sent_at: string
  read_at: string | null
}

export type AdminNotificationRow = {
  id: string
  recipe_id: string | null
  title: string
  body: string
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

export async function fetchUserNotifications(): Promise<UserNotification[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('notification_recipients')
    .select(
      'notification_id, read_at, notifications ( title, body, recipe_id, sent_at )',
    )
    .order('created_at', { ascending: false })
  if (error) throw error

  const rows: UserNotification[] = []
  for (const row of data ?? []) {
    const n = row.notifications as
      | {
          title: string
          body: string
          recipe_id: string | null
          sent_at: string
        }
      | {
          title: string
          body: string
          recipe_id: string | null
          sent_at: string
        }[]
      | null
    const msg = Array.isArray(n) ? n[0] : n
    if (!msg) continue
    rows.push({
      notification_id: row.notification_id as string,
      title: msg.title,
      body: msg.body,
      recipe_id: msg.recipe_id,
      sent_at: msg.sent_at,
      read_at: (row.read_at as string | null) ?? null,
    })
  }
  return rows
}

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error } = await supabase
    .from('notification_recipients')
    .update({ read_at: new Date().toISOString() })
    .eq('notification_id', notificationId)
    .is('read_at', null)
  if (error) throw error
}

export async function markAllNotificationsRead(): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error } = await supabase
    .from('notification_recipients')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
  if (error) throw error
}

export async function adminSendNotification(input: {
  recipeId: string | null
  title: string
  body: string
}): Promise<{ notification_id: string; recipient_count: number }> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { data, error } = await supabase.rpc('admin_send_notification', {
    p_recipe_id: input.recipeId ?? '',
    p_title: input.title,
    p_body: input.body,
  })
  if (error) throw error
  const result = data as {
    notification_id: string
    recipient_count: number
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
    recipient_count: Number(row.recipient_count),
    read_count: Number(row.read_count),
  }))
}
