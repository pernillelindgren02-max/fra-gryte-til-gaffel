import { supabase } from './supabase'

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
