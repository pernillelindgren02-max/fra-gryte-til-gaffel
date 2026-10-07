import { supabase } from './supabase'
import {
  DEFAULT_ONBOARDING_STEPS,
  type OnboardingStep,
} from './onboardingDefaults'

const BUCKET = 'onboarding'

export function onboardingImagePublicUrl(
  pathOrUrl: string | null | undefined,
): string | null {
  const raw = pathOrUrl?.trim()
  if (!raw) return null
  if (raw.startsWith('http') || raw.startsWith('/')) return raw
  const base = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
  if (!base) return `/images/onboarding/${raw}`
  return `${base}/storage/v1/object/public/${BUCKET}/${raw}`
}

function mapRow(row: Record<string, unknown>): OnboardingStep {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    body: String(row.body ?? ''),
    image_url: onboardingImagePublicUrl(
      row.image_url == null ? null : String(row.image_url),
    ),
    sort_order: Number(row.sort_order) || 0,
    is_active: Boolean(row.is_active),
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  }
}

/** Active steps for the consumer onboarding flow. */
export async function fetchActiveOnboardingSteps(): Promise<OnboardingStep[]> {
  if (!supabase) return DEFAULT_ONBOARDING_STEPS
  const { data, error } = await supabase
    .from('onboarding_steps')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error || !data || data.length === 0) {
    return DEFAULT_ONBOARDING_STEPS
  }
  return (data as Record<string, unknown>[]).map(mapRow)
}

/** All steps for admin (including inactive). */
export async function fetchAllOnboardingSteps(): Promise<OnboardingStep[]> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { data, error } = await supabase
    .from('onboarding_steps')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return ((data as Record<string, unknown>[]) ?? []).map(mapRow)
}

export async function upsertOnboardingStep(
  step: Partial<OnboardingStep> & { title: string },
): Promise<OnboardingStep> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const payload: Record<string, unknown> = {
    title: step.title.trim(),
    body: (step.body ?? '').trim(),
    image_url: step.image_url?.trim() || null,
    sort_order: step.sort_order ?? 0,
    is_active: step.is_active ?? true,
    updated_at: new Date().toISOString(),
  }
  if (step.id && !step.id.startsWith('local-')) {
    payload.id = step.id
  }
  const { data, error } = await supabase
    .from('onboarding_steps')
    .upsert(payload)
    .select('*')
    .single()
  if (error) throw error
  return mapRow(data as Record<string, unknown>)
}

export async function updateOnboardingStep(
  id: string,
  patch: Partial<
    Pick<
      OnboardingStep,
      'title' | 'body' | 'image_url' | 'sort_order' | 'is_active'
    >
  >,
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error } = await supabase
    .from('onboarding_steps')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteOnboardingStep(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const { error } = await supabase.from('onboarding_steps').delete().eq('id', id)
  if (error) throw error
}

export async function reorderOnboardingSteps(
  orderedIds: string[],
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase!
        .from('onboarding_steps')
        .update({
          sort_order: index + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id),
    ),
  )
}

export async function uploadOnboardingImage(
  stepId: string,
  file: File,
): Promise<string> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ext === 'jpeg' ? 'jpg' : ext
  const path = `${stepId}.${safeExt}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  return path
}

export async function removeOnboardingImage(path: string): Promise<void> {
  if (!supabase || !path) return
  const key = path.includes(`/${BUCKET}/`)
    ? path.split(`/${BUCKET}/`).pop()!
    : path.replace(/^\//, '')
  if (key.startsWith('images/')) return
  await supabase.storage.from(BUCKET).remove([key])
}
