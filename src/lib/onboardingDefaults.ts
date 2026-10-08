import {
  suggestOnboardingBodyEn,
  suggestOnboardingTitleEn,
} from '../i18n/editorialAuto'

export type OnboardingStep = {
  id: string
  /** Resolved display title for active locale. */
  title: string
  titleNo: string
  titleEn: string
  titleEnAuto: string
  titleEnOverride: boolean
  /** Resolved display body for active locale. */
  body: string
  bodyNo: string
  bodyEn: string
  bodyEnAuto: string
  bodyEnOverride: boolean
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

function step(
  id: string,
  titleNo: string,
  bodyNo: string,
  image_url: string,
  sort_order: number,
): OnboardingStep {
  const titleEnAuto = suggestOnboardingTitleEn(id, titleNo)
  const bodyEnAuto = suggestOnboardingBodyEn(id, titleNo)
  return {
    id,
    title: titleNo,
    titleNo,
    titleEn: '',
    titleEnAuto,
    titleEnOverride: false,
    body: bodyNo,
    bodyNo,
    bodyEn: '',
    bodyEnAuto,
    bodyEnOverride: false,
    image_url,
    sort_order,
    is_active: true,
  }
}

/** Local fallback when Supabase is empty / offline — same copy as SQL seed. */
export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  step(
    'local-1',
    'Fra gryte til gaffel',
    'Enkle oppskrifter for begrenset kjøkken — én kokeplate, mindre mas.',
    '/images/onboarding/step-1.svg',
    1,
  ),
  step(
    'local-2',
    'Mindre styr',
    'Filtrer på tid, utstyr og humør. Finn noe godt uten å overtenke.',
    '/images/onboarding/step-2.svg',
    2,
  ),
  step(
    'local-3',
    'Bruk det du har',
    'Skriv inn det du har hjemme — vi foreslår retter som matcher.',
    '/images/onboarding/step-3.svg',
    3,
  ),
  step(
    'local-4',
    'Fra idé til middag',
    'Lagre favoritter, lag handleliste og kom i gang når du er klar.',
    '/images/onboarding/step-4.svg',
    4,
  ),
]

export function normalizeOnboardingStep(
  raw: Partial<OnboardingStep> & {
    title?: string
    body?: string
    title_no?: string
    title_en?: string
    title_en_auto?: string
    title_en_override?: boolean
    body_no?: string
    body_en?: string
    body_en_auto?: string
    body_en_override?: boolean
  },
): OnboardingStep {
  const id = String(raw.id ?? '')
  const titleNo = String(
    raw.titleNo ?? raw.title_no ?? raw.title ?? '',
  ).trim()
  const titleEn = String(raw.titleEn ?? raw.title_en ?? '').trim()
  const titleEnAuto = String(
    raw.titleEnAuto ??
      raw.title_en_auto ??
      suggestOnboardingTitleEn(id, titleNo) ??
      '',
  ).trim()
  const titleEnOverride =
    raw.titleEnOverride == null && raw.title_en_override == null
      ? Boolean(titleEn)
      : Boolean(raw.titleEnOverride ?? raw.title_en_override) &&
        Boolean(titleEn)

  const bodyNo = String(raw.bodyNo ?? raw.body_no ?? raw.body ?? '').trim()
  const bodyEn = String(raw.bodyEn ?? raw.body_en ?? '').trim()
  const bodyEnAuto = String(
    raw.bodyEnAuto ??
      raw.body_en_auto ??
      suggestOnboardingBodyEn(id, titleNo) ??
      '',
  ).trim()
  const bodyEnOverride =
    raw.bodyEnOverride == null && raw.body_en_override == null
      ? Boolean(bodyEn)
      : Boolean(raw.bodyEnOverride ?? raw.body_en_override) && Boolean(bodyEn)

  return {
    id,
    title: titleNo,
    titleNo,
    titleEn,
    titleEnAuto,
    titleEnOverride,
    body: bodyNo,
    bodyNo,
    bodyEn,
    bodyEnAuto,
    bodyEnOverride,
    image_url: raw.image_url ?? null,
    sort_order: Number(raw.sort_order) || 0,
    is_active: raw.is_active ?? true,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}
