import { TIP_TOPIC_SEEDS } from './tipTopics'
import type {
  TipArticle,
  TipArticleListItem,
  TipCategory,
} from './tipsTypes'
import { hydrateTipArticle, normalizeTipCategory } from './tipsNormalize'

export const DEFAULT_TIP_CATEGORIES: TipCategory[] = TIP_TOPIC_SEEDS.map(
  (seed) =>
    normalizeTipCategory({
      id: seed.id,
      slug: seed.slug,
      name: seed.nameNo,
      nameNo: seed.nameNo,
      nameEn: seed.nameEn,
      nameEnAuto: seed.nameEn,
      nameEnOverride: true,
      sort_order: seed.sort_order,
      isActive: true,
    }),
)

function cat(slug: string) {
  return DEFAULT_TIP_CATEGORIES.find((c) => c.slug === slug) ?? null
}

function withTopics(
  category: TipCategory | null,
  extraSlugs: string[] = [],
): { category_id: string | null; category: TipCategory | null; topicIds: string[]; topics: TipCategory[] } {
  const topics = [
    ...(category ? [category] : []),
    ...extraSlugs
      .map((s) => cat(s))
      .filter((c): c is TipCategory => Boolean(c)),
  ].filter(
    (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i,
  )
  return {
    category_id: topics[0]?.id ?? null,
    category: topics[0] ?? null,
    topicIds: topics.map((c) => c.id),
    topics,
  }
}

/** Local seed articles when Supabase is empty / offline — mirrors SQL seed. */
const RAW_TIP_ARTICLES = [
  {
    id: 'local-tip-1',
    slug: 'primus-for-nybegynnere',
    title: 'Primus for nybegynnere',
    excerpt: 'Trygg start: tenning, koking og slukking uten stress.',
    ...withTopics(cat('camping_stove'), ['camping', 'gear']),
    status: 'published' as const,
    is_featured: true,
    sort_order: 1,
    hero_image_url: '/images/tips/primus-hero.svg',
    published_at: '2026-01-01T00:00:00.000Z',
    blocks: [
      {
        id: 'b1-1',
        article_id: 'local-tip-1',
        block_type: 'intro',
        sort_order: 1,
        payload: {
          text: 'Du trenger ikke være friluftsekspert for å mestre primusen. Her er det som faktisk betyr noe første gangene.',
        },
      },
      {
        id: 'b1-2',
        article_id: 'local-tip-1',
        block_type: 'tip',
        sort_order: 2,
        payload: {
          title: 'Tips',
          text: 'Sett primusen i le for vinden før du tenner. Det sparer både gass og nerver.',
        },
      },
      {
        id: 'b1-3',
        article_id: 'local-tip-1',
        block_type: 'steps',
        sort_order: 3,
        payload: {
          title: 'Slik gjør du',
          items: [
            'Sjekk at ventilen er lukket før du kobler gass.',
            'Åpne forsiktig, tenn, juster flammen til jevn blå.',
            'Kok med lokk — det går raskere og bruker mindre gass.',
            'Slukk: skru av gassen først, la brenneren kjøle seg.',
          ],
        },
      },
      {
        id: 'b1-4',
        article_id: 'local-tip-1',
        block_type: 'warning',
        sort_order: 4,
        payload: {
          title: 'Unngå',
          text: 'Ikke fyll eller bytt gasspatron inne i telt. Gjør det ute, med god avstand til flammer.',
        },
      },
      {
        id: 'b1-5',
        article_id: 'local-tip-1',
        block_type: 'equipment',
        sort_order: 5,
        payload: {
          title: 'Utstyr',
          items: [
            'Primus / gassbrenner',
            'Gasspatron',
            'Gryte med lokk',
            'Lighter eller fyrstikker',
          ],
        },
      },
      {
        id: 'b1-6',
        article_id: 'local-tip-1',
        block_type: 'not_needed',
        sort_order: 6,
        payload: {
          title: 'Dette trenger du egentlig ikke',
          items: [
            'Ekstra «tur-spesial»-kokekarsett',
            'Tre ulike gryter',
            'Vindskjerm i overpriset aluminium — en steinmur funker ofte',
          ],
        },
      },
      {
        id: 'b1-7',
        article_id: 'local-tip-1',
        block_type: 'pro_tips',
        sort_order: 7,
        payload: {
          title: 'Pro-tips',
          items: [
            'Varm vann til te mens du spiser — da er oppvaskvannet klart etterpå.',
            'Merk gassnivået etter tur, så du ikke starter neste tur tom.',
          ],
        },
      },
      {
        id: 'b1-8',
        article_id: 'local-tip-1',
        block_type: 'image',
        sort_order: 8,
        payload: {
          url: '/images/tips/primus-detail.svg',
          caption: 'Jevn blå flamme — tegn på at du er i mål.',
        },
      },
    ],
    images: [
      {
        id: 'img1-1',
        article_id: 'local-tip-1',
        url: '/images/tips/primus-detail.svg',
        caption: 'Jevn blå flamme',
        sort_order: 1,
      },
    ],
    related_recipe_ids: [],
    related_article_ids: ['local-tip-2'],
  },
  {
    id: 'local-tip-2',
    slug: 'mindre-oppvask-paa-tur',
    title: 'Mindre oppvask på tur',
    excerpt:
      'Én gryte, smartere rekkefølge — og nesten tørr oppvaskklut.',
    ...withTopics(cat('less_dishes'), ['camping']),
    status: 'published' as const,
    is_featured: false,
    sort_order: 2,
    hero_image_url: '/images/tips/oppvask-hero.svg',
    published_at: '2026-01-02T00:00:00.000Z',
    blocks: [
      {
        id: 'b2-1',
        article_id: 'local-tip-2',
        block_type: 'intro',
        sort_order: 1,
        payload: {
          text: 'Oppvask er det som stjeler mest stemning på tur. Planlegg rekkefølgen — og la gryta jobbe for deg.',
        },
      },
      {
        id: 'b2-2',
        article_id: 'local-tip-2',
        block_type: 'checklist',
        sort_order: 2,
        payload: {
          title: 'Før du starter',
          items: [
            'Kok det feteste først (mindre liming på slutten)',
            'Ha en bolle til skylling klar',
            'Bruk så lite såpe som mulig',
          ],
        },
      },
      {
        id: 'b2-3',
        article_id: 'local-tip-2',
        block_type: 'tip',
        sort_order: 3,
        payload: {
          title: 'Tips',
          text: 'Tørk gryta med brødskorpe eller papir før vask — da er det nesten rent allerede.',
        },
      },
      {
        id: 'b2-4',
        article_id: 'local-tip-2',
        block_type: 'quote',
        sort_order: 4,
        payload: {
          text: 'Den beste oppvasken er den du aldri trengte.',
          cite: 'Feltregel',
        },
      },
      {
        id: 'b2-5',
        article_id: 'local-tip-2',
        block_type: 'warning',
        sort_order: 5,
        payload: {
          title: 'Unngå',
          text: 'Ikke hell fettsky rett i bekken. Samle det og ta det med, eller la det stivne og pakk det.',
        },
      },
    ],
    images: [],
    related_recipe_ids: [],
    related_article_ids: ['local-tip-1'],
  },
  {
    id: 'local-tip-3',
    slug: 'studentkjokkenets-overlevelse',
    title: 'Studentkjøkkenets overlevelsesguide',
    excerpt:
      'Når kjøkkenet er lite og tid er knapp — slik lager du likevel skikkelig mat.',
    ...withTopics(cat('student_kitchen'), ['small_kitchen', 'cheap_food']),
    status: 'published' as const,
    is_featured: false,
    sort_order: 3,
    hero_image_url: '/images/tips/student-hero.svg',
    published_at: '2026-01-03T00:00:00.000Z',
    blocks: [
      {
        id: 'b3-1',
        article_id: 'local-tip-3',
        block_type: 'intro',
        sort_order: 1,
        payload: {
          text: 'Én kokeplate, lite benkeplate, mange romkamerater. Her er grepet som faktisk fungerer.',
        },
      },
      {
        id: 'b3-2',
        article_id: 'local-tip-3',
        block_type: 'text',
        sort_order: 2,
        payload: {
          text: 'Tenk i «én-panne-retter» og lag litt ekstra til lunch dagen etter. Det sparer både tid og oppvask.',
        },
      },
      {
        id: 'b3-3',
        article_id: 'local-tip-3',
        block_type: 'equipment',
        sort_order: 3,
        payload: {
          title: 'Minimums-kit',
          items: [
            'God stekepanne',
            'Én kasserolle',
            'Skarp kniv',
            'Skjærebrett som får plass i vasken',
          ],
        },
      },
      {
        id: 'b3-4',
        article_id: 'local-tip-3',
        block_type: 'not_needed',
        sort_order: 4,
        payload: {
          title: 'Dette trenger du egentlig ikke',
          items: [
            'Airfryer (enda)',
            'Seks ulike krydderkverner',
            'Marmelade-sett i tre etasjer',
          ],
        },
      },
      {
        id: 'b3-5',
        article_id: 'local-tip-3',
        block_type: 'pro_tips',
        sort_order: 5,
        payload: {
          title: 'Pro-tips',
          items: [
            'Stek løk og hvitløk først — resten smaker ferdig.',
            'Bruk ovnen når du kan: den gir deg hendene fri.',
          ],
        },
      },
    ],
    images: [],
    related_recipe_ids: [],
    related_article_ids: ['local-tip-2'],
  },
] as unknown as TipArticle[]

export const DEFAULT_TIP_ARTICLES: TipArticle[] =
  RAW_TIP_ARTICLES.map(hydrateTipArticle)

export function toListItem(article: TipArticle): TipArticleListItem {
  const {
    blocks: _b,
    images: _i,
    related_recipe_ids: _r,
    related_article_ids: _ra,
    related_articles: _rel,
    ...rest
  } = article
  return rest
}

export function listDefaultPublished(): TipArticleListItem[] {
  return DEFAULT_TIP_ARTICLES.filter((a) => a.status === 'published')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(toListItem)
}

export function getDefaultArticleBySlug(slug: string): TipArticle | null {
  const article = DEFAULT_TIP_ARTICLES.find((a) => a.slug === slug) ?? null
  if (!article) return null
  return {
    ...article,
    related_articles: article.related_article_ids
      .map((id) => DEFAULT_TIP_ARTICLES.find((a) => a.id === id))
      .filter(Boolean)
      .map((a) => toListItem(a!)),
  }
}
