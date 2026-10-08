/**
 * Canonical tip topic definitions — stable slugs used as filter IDs.
 * Display names come from tip_categories (NO) + i18n EN override/auto.
 */
export type TipTopicSeed = {
  /** Local fallback id when Supabase is offline. */
  id: string
  slug: string
  nameNo: string
  nameEn: string
  sort_order: number
  /** Legacy slugs that map to this topic (migration / alias). */
  aliases?: string[]
}

export const TIP_TOPIC_SEEDS: TipTopicSeed[] = [
  {
    id: 'cat-student-kitchen',
    slug: 'student_kitchen',
    nameNo: 'Studentkjøkken',
    nameEn: 'Student kitchen',
    sort_order: 1,
    aliases: ['studentkjokken'],
  },
  {
    id: 'cat-camping',
    slug: 'camping',
    nameNo: 'På tur',
    nameEn: 'Camping / outdoors',
    sort_order: 2,
    aliases: ['tur'],
  },
  {
    id: 'cat-few-ingredients',
    slug: 'few_ingredients',
    nameNo: 'Få ingredienser',
    nameEn: 'Few ingredients',
    sort_order: 3,
  },
  {
    id: 'cat-less-dishes',
    slug: 'less_dishes',
    nameNo: 'Lite oppvask',
    nameEn: 'Less washing-up',
    sort_order: 4,
    aliases: ['lite-oppvask'],
  },
  {
    id: 'cat-camping-stove',
    slug: 'camping_stove',
    nameNo: 'Primus',
    nameEn: 'Camping stove',
    sort_order: 5,
    aliases: ['primus'],
  },
  {
    id: 'cat-gear',
    slug: 'gear',
    nameNo: 'Utstyr',
    nameEn: 'Gear',
    sort_order: 6,
    aliases: ['utstyr'],
  },
  {
    id: 'cat-technique',
    slug: 'technique',
    nameNo: 'Teknikk',
    nameEn: 'Technique',
    sort_order: 7,
    aliases: ['teknikk'],
  },
  {
    id: 'cat-cheap-food',
    slug: 'cheap_food',
    nameNo: 'Billig mat',
    nameEn: 'Budget food',
    sort_order: 8,
  },
  {
    id: 'cat-small-kitchen',
    slug: 'small_kitchen',
    nameNo: 'Små kjøkken',
    nameEn: 'Small kitchens',
    sort_order: 9,
    aliases: ['lite-kjokken'],
  },
  {
    id: 'cat-keeps-well',
    slug: 'keeps_well',
    nameNo: 'Mat som holder seg',
    nameEn: 'Food that keeps',
    sort_order: 10,
  },
  {
    id: 'cat-leftovers',
    slug: 'leftovers',
    nameNo: 'Restemat',
    nameEn: 'Leftovers',
    sort_order: 11,
  },
]

/** Resolve any historical slug to the canonical topic slug. */
export function canonicalTipTopicSlug(slug: string): string {
  const key = slug.trim()
  if (!key) return key
  const direct = TIP_TOPIC_SEEDS.find((t) => t.slug === key)
  if (direct) return direct.slug
  const viaAlias = TIP_TOPIC_SEEDS.find((t) => t.aliases?.includes(key))
  return viaAlias?.slug ?? key
}
