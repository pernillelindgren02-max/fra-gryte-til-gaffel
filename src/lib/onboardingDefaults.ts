export type OnboardingStep = {
  id: string
  title: string
  body: string
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

/** Local fallback when Supabase is empty / offline — same copy as SQL seed. */
export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'local-1',
    title: 'Fra gryte til gaffel',
    body: 'Enkle oppskrifter for begrenset kjøkken — én kokeplate, mindre mas.',
    image_url: '/images/onboarding/step-1.svg',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'local-2',
    title: 'Mindre styr',
    body: 'Filtrer på tid, utstyr og humør. Finn noe godt uten å overtenke.',
    image_url: '/images/onboarding/step-2.svg',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'local-3',
    title: 'Bruk det du har',
    body: 'Skriv inn det du har hjemme — vi foreslår retter som matcher.',
    image_url: '/images/onboarding/step-3.svg',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'local-4',
    title: 'Fra idé til middag',
    body: 'Lagre favoritter, lag handleliste og kom i gang når du er klar.',
    image_url: '/images/onboarding/step-4.svg',
    sort_order: 4,
    is_active: true,
  },
]
