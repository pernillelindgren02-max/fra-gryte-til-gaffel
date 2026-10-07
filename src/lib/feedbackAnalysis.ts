/**
 * Rule/keyword sentiment v1 — no third-party AI.
 * Architecture for optional AI later: Admin opts in → server function with
 * explicit consent → never silent egress of feedback text.
 */

export type FeedbackSentiment = 'positive' | 'neutral' | 'negative' | 'mixed'
export type FeedbackCategory = 'general' | 'bug' | 'idea' | 'recipe' | 'other'

const POSITIVE = [
  'bra',
  'flink',
  'elsker',
  'fantastisk',
  'nydelig',
  'supert',
  'super',
  'takkk',
  'takk',
  'liker',
  'fin',
  'fint',
  'god',
  'godt',
  'nyttig',
  'hjelper',
  'perfekt',
  'glad',
  'awesome',
  'love',
  'great',
]

const NEGATIVE = [
  'bug',
  'feil',
  'kræsj',
  'crash',
  'tregt',
  'treg',
  'ødelagt',
  'fungerer ikke',
  'virker ikke',
  'irritert',
  'irriterende',
  'dårlig',
  'hate',
  'hater',
  'problemer',
  'problem',
  'mangler',
  'savner',
  'forvirrende',
  'vanskelig',
  'broken',
  'slow',
]

const TAG_RULES: { tag: string; needles: string[] }[] = [
  { tag: 'søk', needles: ['søk', 'search', 'finn'] },
  { tag: 'hjemme', needles: ['hjemme', 'pantry', 'skap', 'ingrediens'] },
  { tag: 'handleliste', needles: ['handleliste', 'handle', 'shopping'] },
  { tag: 'favoritter', needles: ['favoritt', 'mapper', 'mappe'] },
  { tag: 'oppskrift', needles: ['oppskrift', 'recipe', 'middag'] },
  { tag: 'tips', needles: ['tips', 'triks'] },
  { tag: 'onboarding', needles: ['onboarding', 'intro', 'veiledning'] },
  { tag: 'mobil', needles: ['mobil', 'telefon', 'iphone', 'android'] },
  { tag: 'ytelse', needles: ['tregt', 'treg', 'langsom', 'slow', 'lag'] },
  { tag: 'design', needles: ['design', 'farge', 'layout', 'ui'] },
]

export function analyzeFeedbackText(body: string): {
  sentiment: FeedbackSentiment
  tags: string[]
} {
  const text = body.toLowerCase()
  let pos = 0
  let neg = 0
  for (const w of POSITIVE) {
    if (text.includes(w)) pos += 1
  }
  for (const w of NEGATIVE) {
    if (text.includes(w)) neg += 1
  }
  let sentiment: FeedbackSentiment = 'neutral'
  if (pos > 0 && neg > 0) sentiment = 'mixed'
  else if (pos > neg) sentiment = 'positive'
  else if (neg > pos) sentiment = 'negative'

  const tags: string[] = []
  for (const rule of TAG_RULES) {
    if (rule.needles.some((n) => text.includes(n))) tags.push(rule.tag)
  }
  return { sentiment, tags: [...new Set(tags)].slice(0, 8) }
}

/**
 * Optional AI path (NOT enabled):
 * 1. Admin toggles “AI-analyse” in Innsikt (off by default)
 * 2. Explicit confirm: “Send N tilbakemeldinger til [provider]”
 * 3. Edge function with server-side key; never client-side secret
 * 4. Store model tags separately from rule tags; show provenance
 * Until approved: only analyzeFeedbackText above runs.
 */
export const FEEDBACK_AI_ARCHITECTURE_NOTE =
  'v1 uses local keyword rules only. Third-party AI requires explicit Admin opt-in and is not wired.'
