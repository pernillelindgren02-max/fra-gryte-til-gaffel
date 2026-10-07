export type TipStatus = 'draft' | 'published'

export type TipBlockType =
  | 'intro'
  | 'text'
  | 'image'
  | 'tip'
  | 'warning'
  | 'pro_tips'
  | 'steps'
  | 'checklist'
  | 'equipment'
  | 'not_needed'
  | 'quote'

export type TipBlockPayload = {
  text?: string
  title?: string
  cite?: string
  url?: string
  caption?: string
  items?: string[]
}

export type TipBlock = {
  id: string
  article_id: string
  block_type: TipBlockType
  sort_order: number
  payload: TipBlockPayload
}

export type TipImage = {
  id: string
  article_id: string
  url: string
  caption: string
  sort_order: number
}

export type TipCategory = {
  id: string
  slug: string
  name: string
  sort_order: number
}

export type TipArticleListItem = {
  id: string
  slug: string
  title: string
  excerpt: string
  category_id: string | null
  category?: TipCategory | null
  status: TipStatus
  is_featured: boolean
  sort_order: number
  hero_image_url: string | null
  published_at?: string | null
  updated_at?: string
}

export type TipArticle = TipArticleListItem & {
  blocks: TipBlock[]
  images: TipImage[]
  related_recipe_ids: string[]
  related_article_ids: string[]
  related_articles?: TipArticleListItem[]
}

export const TIP_BLOCK_LABELS: Record<TipBlockType, string> = {
  intro: 'Intro',
  text: 'Tekst',
  image: 'Bilde + bildetekst',
  tip: 'Tips',
  warning: 'Advarsel / Unngå',
  pro_tips: 'Pro-tips',
  steps: 'Steg',
  checklist: 'Sjekkliste',
  equipment: 'Utstyr',
  not_needed: 'Dette trenger du egentlig ikke',
  quote: 'Sitat / callout',
}

export const TIP_BLOCK_TYPES = Object.keys(TIP_BLOCK_LABELS) as TipBlockType[]
