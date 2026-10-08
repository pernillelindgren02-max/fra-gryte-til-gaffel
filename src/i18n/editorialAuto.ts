/**
 * Offline curated English defaults for Explore / Onboarding / Tips / Notifications.
 * No live paid translation API.
 */

import type { TipBlockPayload } from '../lib/tipsTypes'

/** Explore category chip / category-view titles by id. */
export const EXPLORE_CATEGORY_EN: Record<string, string> = {
  primus: 'Perfect for camping stove',
  'few-ingredients': 'Few ingredients',
  quick: 'Short on time?',
  dinner: 'Dinner',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dessert: 'Dessert',
}

/** Explore feed section titles by id. */
export const EXPLORE_SECTION_EN: Record<string, string> = {
  'quick-easy': 'Quick and easy',
  primus: 'Perfect on camping stove',
  breakfast: 'Breakfast',
  dinner: 'Dinner',
}

export function suggestExploreCategoryEn(id: string, titleNo: string): string {
  return EXPLORE_CATEGORY_EN[id] || titleNo.trim() || ''
}

export function suggestExploreSectionEn(id: string, titleNo: string): string {
  return EXPLORE_SECTION_EN[id] || titleNo.trim() || ''
}

export function suggestExploreBlurbEn(_blurbNo: string): string {
  // Editorial blurb is freeform — no auto unless Admin/curated later.
  return ''
}

/** Onboarding step autos keyed by stable local/SQL id prefix or title slug. */
export const ONBOARDING_EN_BY_KEY: Record<
  string,
  { title: string; body: string }
> = {
  'local-1': {
    title: 'One Pot Wonder',
    body: 'Simple recipes for a limited kitchen — one burner, less fuss.',
  },
  'local-2': {
    title: 'Less hassle',
    body: 'Filter by time, gear and mood. Find something good without overthinking.',
  },
  'local-3': {
    title: 'Use what you have',
    body: 'Enter what’s in your kitchen — we suggest matching dishes.',
  },
  'local-4': {
    title: 'From idea to dinner',
    body: 'Save favourites, build a shopping list and start when you’re ready.',
  },
  // Common Norwegian seed titles → EN (when id is a UUID from SQL seed)
  'fra-gryte-til-gaffel': {
    title: 'One Pot Wonder',
    body: 'Simple recipes for a limited kitchen — one burner, less fuss.',
  },
  'mindre-styr': {
    title: 'Less hassle',
    body: 'Filter by time, gear and mood. Find something good without overthinking.',
  },
  'bruk-det-du-har': {
    title: 'Use what you have',
    body: 'Enter what’s in your kitchen — we suggest matching dishes.',
  },
  'fra-ide-til-middag': {
    title: 'From idea to dinner',
    body: 'Save favourites, build a shopping list and start when you’re ready.',
  },
}

function slugKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function suggestOnboardingTitleEn(id: string, titleNo: string): string {
  const byId = ONBOARDING_EN_BY_KEY[id]
  if (byId) return byId.title
  const byTitle = ONBOARDING_EN_BY_KEY[slugKey(titleNo)]
  if (byTitle) return byTitle.title
  return ''
}

export function suggestOnboardingBodyEn(id: string, titleNo: string): string {
  const byId = ONBOARDING_EN_BY_KEY[id]
  if (byId) return byId.body
  const byTitle = ONBOARDING_EN_BY_KEY[slugKey(titleNo)]
  if (byTitle) return byTitle.body
  return ''
}

/** Tip category names by slug (canonical + legacy aliases). */
export const TIP_CATEGORY_EN: Record<string, string> = {
  student_kitchen: 'Student kitchen',
  camping: 'Camping / outdoors',
  few_ingredients: 'Few ingredients',
  less_dishes: 'Less washing-up',
  camping_stove: 'Camping stove',
  gear: 'Gear',
  technique: 'Technique',
  cheap_food: 'Budget food',
  small_kitchen: 'Small kitchens',
  keeps_well: 'Food that keeps',
  leftovers: 'Leftovers',
  // Legacy aliases
  primus: 'Camping stove',
  'lite-kjokken': 'Small kitchens',
  utstyr: 'Gear',
  teknikk: 'Technique',
  'lite-oppvask': 'Less washing-up',
  tur: 'Camping / outdoors',
  studentkjokken: 'Student kitchen',
}

export function suggestTipCategoryEn(slug: string, nameNo: string): string {
  return TIP_CATEGORY_EN[slug] || nameNo.trim() || ''
}

/** Tip article title/excerpt autos by slug. */
export const TIP_ARTICLE_EN: Record<
  string,
  { title: string; excerpt: string }
> = {
  'primus-for-nybegynnere': {
    title: 'Camping stove for beginners',
    excerpt: 'A calm start: lighting, cooking and extinguishing without stress.',
  },
  'mindre-oppvask-paa-tur': {
    title: 'Less washing-up on the trail',
    excerpt: 'One pot, smarter order — and an almost dry dishcloth.',
  },
  'studentkjokkenets-overlevelse': {
    title: 'Student kitchen survival guide',
    excerpt:
      'When the kitchen is tiny and time is short — how to still cook real food.',
  },
}

export function suggestTipTitleEn(slug: string, titleNo: string): string {
  return TIP_ARTICLE_EN[slug]?.title || titleNo.trim() || ''
}

export function suggestTipExcerptEn(slug: string, _excerptNo: string): string {
  return TIP_ARTICLE_EN[slug]?.excerpt || ''
}

/** Curated EN payloads for seed tip blocks: slug → sort_order → payload. */
export const TIP_BLOCK_EN: Record<
  string,
  Record<number, TipBlockPayload>
> = {
  'primus-for-nybegynnere': {
    1: {
      text: 'You don’t need to be an outdoors expert to master a camping stove. Here’s what actually matters the first few times.',
    },
    2: {
      title: 'Tip',
      text: 'Shelter the stove from wind before you light it. It saves gas and nerves.',
    },
    3: {
      title: 'How to',
      items: [
        'Check the valve is closed before connecting the canister.',
        'Open gently, light, adjust to an even blue flame.',
        'Cook with a lid — faster and uses less gas.',
        'Extinguish: turn off the gas first, let the burner cool.',
      ],
    },
    4: {
      title: 'Avoid',
      text: 'Don’t refill or swap canisters inside a tent. Do it outside, well away from flames.',
    },
    5: {
      title: 'Gear',
      items: [
        'Camping stove / gas burner',
        'Gas canister',
        'Pot with lid',
        'Lighter or matches',
      ],
    },
    6: {
      title: 'You don’t really need',
      items: [
        'Extra “trail special” cookware sets',
        'Three different pots',
        'An overpriced aluminium wind shield — a stone wall often works',
      ],
    },
    7: {
      title: 'Pro tips',
      items: [
        'Heat water for tea while you eat — then dishwater is ready afterwards.',
        'Note the gas level after a trip so you don’t start the next one empty.',
      ],
    },
    8: {
      caption: 'Even blue flame — a sign you’re good.',
    },
  },
  'mindre-oppvask-paa-tur': {
    1: {
      text: 'Washing-up steals the most joy outdoors. Plan the order — and let the pot work for you.',
    },
    2: {
      title: 'Before you start',
      items: [
        'Cook the fattiest dish first (less stuck-on mess at the end)',
        'Have a rinse bowl ready',
        'Use as little soap as possible',
      ],
    },
    3: {
      title: 'Tip',
      text: 'Wipe the pot with a bread crust or paper before washing — it’s almost clean already.',
    },
    4: {
      text: 'The best washing-up is the one you never needed.',
      cite: 'Field rule',
    },
    5: {
      title: 'Avoid',
      text: 'Don’t pour greasy water into the stream. Collect it and pack it out, or let it set and bag it.',
    },
  },
  'studentkjokkenets-overlevelse': {
    1: {
      text: 'One burner, little counter space, many flatmates. Here’s what actually works.',
    },
    2: {
      text: 'Think in one-pan meals and make a little extra for lunch tomorrow. It saves time and washing-up.',
    },
    3: {
      title: 'Minimum kit',
      items: [
        'A good frying pan',
        'One saucepan',
        'A sharp knife',
        'A cutting board that fits in the sink',
      ],
    },
    4: {
      title: 'You don’t really need',
      items: [
        'An air fryer (yet)',
        'Six different spice grinders',
        'A three-tier jam set',
      ],
    },
    5: {
      title: 'Pro tips',
      items: [
        'Fry onion and garlic first — everything else tastes finished.',
        'Use the oven when you can: it frees your hands.',
      ],
    },
  },
}

export function suggestTipBlockPayloadEn(
  articleSlug: string,
  sortOrder: number,
): TipBlockPayload | null {
  return TIP_BLOCK_EN[articleSlug]?.[sortOrder] ?? null
}

export function suggestTipCaptionEn(
  articleSlug: string,
  sortOrder: number,
  _captionNo: string,
): string {
  const payload = TIP_BLOCK_EN[articleSlug]?.[sortOrder]
  return payload?.caption?.trim() || ''
}

/** Notification templates from recipe display names. */
export function suggestNotificationTitleEn(recipeNameEn: string): string {
  const name = recipeNameEn.trim()
  return name ? `New recipe: ${name}` : 'New recipe'
}

export function suggestNotificationBodyEn(
  recipeNameEn: string,
  shortDescriptionEn: string,
): string {
  const desc = shortDescriptionEn.trim()
  if (desc) return desc
  const name = recipeNameEn.trim()
  return name ? `${name} is ready in Explore.` : 'A new recipe is ready in Explore.'
}

export function suggestNotificationTitleNo(recipeNameNo: string): string {
  const name = recipeNameNo.trim()
  return name ? `Ny oppskrift: ${name}` : 'Ny oppskrift'
}

export function suggestNotificationBodyNo(
  recipeNameNo: string,
  shortDescriptionNo: string,
): string {
  const desc = shortDescriptionNo.trim()
  if (desc) return desc
  const name = recipeNameNo.trim()
  return name ? `${name} er klar i Utforsk.` : 'En ny oppskrift er klar i Utforsk.'
}
