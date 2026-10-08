import { supabase } from './supabase'
import {
  DEFAULT_ONBOARDING_STEPS,
  normalizeOnboardingStep,
  type OnboardingStep,
} from './onboardingDefaults'
import {
  suggestOnboardingBodyEn,
  suggestOnboardingTitleEn,
} from '../i18n/editorialAuto'

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
  return normalizeOnboardingStep({
    ...row,
    image_url: onboardingImagePublicUrl(
      row.image_url == null ? null : String(row.image_url),
    ),
  })
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

function stepToDbPayload(step: Partial<OnboardingStep> & { title?: string }) {
  const titleNo = (step.titleNo || step.title || '').trim()
  const bodyNo = (step.bodyNo || step.body || '').trim()
  const titleEnAuto =
    step.titleEnAuto?.trim() || suggestOnboardingTitleEn(step.id || '', titleNo)
  const bodyEnAuto =
    step.bodyEnAuto?.trim() || suggestOnboardingBodyEn(step.id || '', titleNo)
  const titleEnOverride =
    Boolean(step.titleEnOverride) && Boolean((step.titleEn || '').trim())
  const bodyEnOverride =
    Boolean(step.bodyEnOverride) && Boolean((step.bodyEn || '').trim())

  return {
    title: titleNo,
    title_no: titleNo,
    title_en: titleEnOverride ? (step.titleEn || '').trim() : '',
    title_en_auto: titleEnAuto,
    title_en_override: titleEnOverride,
    body: bodyNo,
    body_no: bodyNo,
    body_en: bodyEnOverride ? (step.bodyEn || '').trim() : '',
    body_en_auto: bodyEnAuto,
    body_en_override: bodyEnOverride,
    image_url: step.image_url?.trim() || null,
    sort_order: step.sort_order ?? 0,
    is_active: step.is_active ?? true,
    updated_at: new Date().toISOString(),
  }
}

export async function upsertOnboardingStep(
  step: Partial<OnboardingStep> & { title: string },
): Promise<OnboardingStep> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const payload: Record<string, unknown> = stepToDbPayload(step)
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
  patch: Partial<OnboardingStep>,
): Promise<void> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.')
  const payload = stepToDbPayload({ ...patch, id, title: patch.titleNo || patch.title || '' })
  // Only send fields that were intended when patch is partial toggles
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (
    patch.title != null ||
    patch.titleNo != null ||
    patch.titleEn != null ||
    patch.titleEnOverride != null ||
    patch.titleEnAuto != null
  ) {
    update.title = payload.title
    update.title_no = payload.title_no
    update.title_en = payload.title_en
    update.title_en_auto = payload.title_en_auto
    update.title_en_override = payload.title_en_override
  }
  if (
    patch.body != null ||
    patch.bodyNo != null ||
    patch.bodyEn != null ||
    patch.bodyEnOverride != null ||
    patch.bodyEnAuto != null
  ) {
    update.body = payload.body
    update.body_no = payload.body_no
    update.body_en = payload.body_en
    update.body_en_auto = payload.body_en_auto
    update.body_en_override = payload.body_en_override
  }
  if (patch.image_url !== undefined) update.image_url = payload.image_url
  if (patch.sort_order !== undefined) update.sort_order = payload.sort_order
  if (patch.is_active !== undefined) update.is_active = payload.is_active

  const { error } = await supabase
    .from('onboarding_steps')
    .update(update)
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
