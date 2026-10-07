/** Visual Explore category chips — ids match explore_settings.categories. */

export type ExploreCategoryId =
  | 'primus'
  | 'few-ingredients'
  | 'quick'
  | 'dinner'
  | 'breakfast'
  | 'lunch'
  | 'dessert'

export type ExploreCategoryDef = {
  id: ExploreCategoryId
  label: string
  image: string
  /** Short accessible description of the illustration */
  imageAlt: string
}

export const EXPLORE_CATEGORIES: ExploreCategoryDef[] = [
  {
    id: 'primus',
    label: 'Perfekt til primus',
    image: '/images/categories/primus.svg',
    imageAlt: 'Campingprimus',
  },
  {
    id: 'few-ingredients',
    label: 'Få ingredienser',
    image: '/images/categories/few-ingredients.svg',
    imageAlt: 'Brokkoli',
  },
  {
    id: 'quick',
    label: 'Dårlig tid?',
    image: '/images/categories/quick.svg',
    imageAlt: 'Klokke',
  },
  {
    id: 'dinner',
    label: 'Middag',
    image: '/images/categories/dinner.svg',
    imageAlt: 'Middags tallerken',
  },
  {
    id: 'breakfast',
    label: 'Frokost',
    image: '/images/categories/breakfast.svg',
    imageAlt: 'Frokostskål',
  },
  {
    id: 'lunch',
    label: 'Lunsj',
    image: '/images/categories/lunch.svg',
    imageAlt: 'Sandwich',
  },
  {
    id: 'dessert',
    label: 'Dessert',
    image: '/images/categories/dessert.svg',
    imageAlt: 'Kanelbolle',
  },
]

export function getCategoryDef(
  id: string,
): ExploreCategoryDef | undefined {
  return EXPLORE_CATEGORIES.find((c) => c.id === id)
}
