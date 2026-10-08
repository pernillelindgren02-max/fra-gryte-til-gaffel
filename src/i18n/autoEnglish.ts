/**
 * Offline curated English defaults — no live/paid translation API.
 * Used as automatic/default EN when Admin has not set a manual override.
 */

function slugifyLocal(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'ingredient'
}

/** Seed / known recipe titles keyed by recipe id. */
export const RECIPE_TITLE_EN_BY_ID: Record<string, string> = {
  'pokebowl-laks': 'Salmon poke bowl',
  lasagnegryte: 'One-pot lasagna',
  'kremet-pasta-chorizo': 'Creamy one-pot chorizo pasta',
  'gnocchi-kylling-sopp': 'Gnocchi with chicken and mushrooms',
  'nudler-peanottsaus': 'Noodles with peanut sauce',
  'linsegryte-sotpotet-feta': 'Creamy lentil pot with sweet potato and feta',
  'enkel-gyros': 'Easy gyros',
  'pannekaker-blabaer': 'Pancakes with warm blueberry jam',
  'tyrkiske-egg-light': 'Turkish eggs light',
  'halloumi-honey-toast': 'Halloumi & honey toast',
  'crispy-rice-bowl': 'Crispy rice bowl with egg',
  'apple-pie-oats': 'Apple pie oats',
  'carrot-cake-oats': 'Carrot cake oats',
  shakshuka: 'Shakshuka',
  'eplecrumble-grot': 'Apple crumble porridge',
}

/** Seed short descriptions keyed by recipe id. */
export const RECIPE_DESC_EN_BY_ID: Record<string, string> = {
  'pokebowl-laks':
    'Fresh salmon, rice and toppings with chili mayo. 2 servings.',
  lasagnegryte: 'All the flavour of lasagna in one pot — no oven. 2 servings.',
  'kremet-pasta-chorizo':
    'Quick pasta dinner with spicy chorizo and crème fraîche. 2 servings.',
  'gnocchi-kylling-sopp':
    'Gnocchi pan-fried with chicken, mushrooms and cream. 2 servings.',
  'nudler-peanottsaus':
    'Creamy peanut noodles with chili and lime — ready in 15 minutes. 2 servings.',
  'linsegryte-sotpotet-feta':
    'Warming pot with chicken, red lentils and sweet potato. 2 servings.',
  'enkel-gyros':
    'Seared meat in pita with yoghurt, feta and fresh vegetables. 2 servings.',
  'pannekaker-blabaer':
    'Thin pancakes served with homemade blueberry jam. 2 servings.',
  'tyrkiske-egg-light':
    'Soft-boiled eggs on yoghurt with chili butter and bread. 2 servings.',
  'halloumi-honey-toast':
    'Fried halloumi on toast with yoghurt, honey and chili. 2 servings.',
  'crispy-rice-bowl':
    'Crispy fried rice with egg, avocado and chili mayo. 2 servings.',
  'apple-pie-oats':
    'Oat porridge topped with caramelised apples and yoghurt. 2 servings.',
  'carrot-cake-oats':
    'Carrot porridge with cinnamon and yoghurt — like carrot cake for breakfast. 2 servings.',
  shakshuka: 'Eggs poached in spiced tomato sauce with pepper and feta. 2 servings.',
  'eplecrumble-grot':
    'Oat porridge with fried apples and a crunchy crumble topping. 2 servings.',
}

/** Canonical ingredient id → English display name. */
export const INGREDIENT_EN_BY_ID: Record<string, string> = {
  agurk: 'cucumber',
  avokado: 'avocado',
  blabaer: 'blueberries',
  'brunt-sukker': 'brown sugar',
  brodskiver: 'bread slices',
  buljongterning: 'stock cube',
  'chili-crisp': 'chili crisp',
  chiliflak: 'chili flakes',
  chilimajones: 'chili mayo',
  chorizo: 'chorizo',
  'creme-fraiche': 'crème fraîche',
  egg: 'egg',
  eple: 'apple',
  feta: 'feta',
  gnocchi: 'gnocchi',
  'gresk-yoghurt': 'Greek yoghurt',
  'gul-lok': 'yellow onion',
  gulrot: 'carrot',
  'hakkede-tomater': 'chopped tomatoes',
  halloumi: 'halloumi',
  havregryn: 'rolled oats',
  'havregryn-til-topping': 'oats for topping',
  honning: 'honey',
  hvetemel: 'wheat flour',
  hvitlok: 'garlic',
  jasminris: 'jasmine rice',
  kanel: 'cinnamon',
  kjottdeig: 'minced meat',
  'kokt-kald-ris': 'cooked cold rice',
  kyllingfilet: 'chicken fillet',
  laksefilet: 'salmon fillet',
  'lammestrimler-eller-kylling': 'lamb strips or chicken',
  lasagneplater: 'lasagna sheets',
  lime: 'lime',
  majones: 'mayonnaise',
  mango: 'mango',
  matflote: 'cooking cream',
  melk: 'milk',
  nudelvann: 'noodle water',
  nudler: 'noodles',
  olje: 'oil',
  oregano: 'oregano',
  paprikapulver: 'paprika powder',
  parmesan: 'parmesan',
  pasta: 'pasta',
  pastavann: 'pasta water',
  peanottsmor: 'peanut butter',
  pitabrod: 'pita bread',
  'revet-ost': 'grated cheese',
  rosiner: 'raisins',
  'rod-paprika': 'red bell pepper',
  'rode-linser': 'red lentils',
  rodlok: 'red onion',
  salt: 'salt',
  'salt-og-pepper': 'salt and pepper',
  sitron: 'lemon',
  sitronsaft: 'lemon juice',
  sjalottlok: 'shallot',
  smor: 'butter',
  'smor-til-steking': 'butter for frying',
  sopp: 'mushrooms',
  'sort-pepper': 'black pepper',
  soyasaus: 'soy sauce',
  spinat: 'spinach',
  sriracha: 'sriracha',
  sukker: 'sugar',
  sotpotet: 'sweet potato',
  tomatpure: 'tomato paste',
  vann: 'water',
}

/**
 * Lightweight offline word map for unknown titles (NO → EN tokens).
 * Not a general translator — best-effort for common recipe phrasing.
 */
const TITLE_WORD_EN: Record<string, string> = {
  med: 'with',
  og: 'and',
  i: 'in',
  uten: 'without',
  kremet: 'creamy',
  pasta: 'pasta',
  gryte: 'pot',
  lasagnegryte: 'one-pot lasagna',
  linsegryte: 'lentil pot',
  nudler: 'noodles',
  peanottsaus: 'peanut sauce',
  peanøttsaus: 'peanut sauce',
  kylling: 'chicken',
  sopp: 'mushrooms',
  laks: 'salmon',
  egg: 'egg',
  eggs: 'eggs',
  pannekaker: 'pancakes',
  varmt: 'warm',
  blåbærsyltetøy: 'blueberry jam',
  blabaersyltetoy: 'blueberry jam',
  søtpotet: 'sweet potato',
  sotpotet: 'sweet potato',
  feta: 'feta',
  enkel: 'easy',
  tyrkiske: 'turkish',
  eplecrumble: 'apple crumble',
  grøt: 'porridge',
  grot: 'porridge',
  havregrøt: 'oat porridge',
  gulrotgrøt: 'carrot porridge',
  ovn: 'oven',
  porsjoner: 'servings',
  chorizo: 'chorizo',
  gnocchi: 'gnocchi',
  shakshuka: 'shakshuka',
  pokébowl: 'poke bowl',
  pokebowl: 'poke bowl',
  toast: 'toast',
  halloumi: 'halloumi',
  honey: 'honey',
  crispy: 'crispy',
  rice: 'rice',
  bowl: 'bowl',
  apple: 'apple',
  pie: 'pie',
  oats: 'oats',
  carrot: 'carrot',
  cake: 'cake',
  light: 'light',
  gyros: 'gyros',
}

function titleCase(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Suggest automatic English title from curated id map, else offline word map. */
export function suggestEnglishTitle(recipeId: string, nameNo: string): string {
  const byId = RECIPE_TITLE_EN_BY_ID[recipeId.trim()]
  if (byId) return byId

  const raw = nameNo.trim()
  if (!raw) return ''

  // Already mostly English (common Latin recipe names) — keep as-is
  if (/^[A-Za-z0-9 &'\-–—,./]+$/.test(raw) && !/[æøåÆØÅ]/.test(raw)) {
    const lower = raw.toLowerCase()
    if (
      !/\b(med|og|gryte|grøt|grot|kremet|nudler|pannekaker)\b/.test(lower)
    ) {
      return raw
    }
  }

  const tokens = raw
    .replace(/[–—]/g, '-')
    .split(/(\s+|&|\/)/)
    .filter(Boolean)

  const mapped = tokens
    .map((token) => {
      if (/^\s+$/.test(token) || token === '&' || token === '/') return token
      const key = token
        .toLowerCase()
        .replace(/æ/g, 'ae')
        .replace(/ø/g, 'o')
        .replace(/å/g, 'a')
      return TITLE_WORD_EN[token.toLowerCase()] ?? TITLE_WORD_EN[key] ?? token
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()

  return titleCase(mapped)
}

/** Suggest automatic English short description. */
export function suggestEnglishDescription(
  recipeId: string,
  shortDescriptionNo: string,
): string {
  const byId = RECIPE_DESC_EN_BY_ID[recipeId.trim()]
  if (byId) return byId
  // No general machine translation — leave empty so resolver falls back to NO
  void shortDescriptionNo
  return ''
}

/** Suggest automatic English ingredient name from canonical id / NO name. */
export function suggestEnglishIngredient(
  ingredientId: string,
  nameNo: string,
): string {
  const id = (ingredientId || slugifyLocal(nameNo)).trim()
  if (INGREDIENT_EN_BY_ID[id]) return INGREDIENT_EN_BY_ID[id]
  const fromName = slugifyLocal(nameNo)
  if (INGREDIENT_EN_BY_ID[fromName]) return INGREDIENT_EN_BY_ID[fromName]
  return ''
}

/**
 * Effective English string for display:
 * manual override → automatic/default → Norwegian → ''.
 * Never returns undefined/null.
 */
export function resolveEnglishText(options: {
  no: string | null | undefined
  manualEn: string | null | undefined
  autoEn: string | null | undefined
  isOverride: boolean
}): string {
  const no = typeof options.no === 'string' ? options.no.trim() : ''
  const manual =
    typeof options.manualEn === 'string' ? options.manualEn.trim() : ''
  const auto = typeof options.autoEn === 'string' ? options.autoEn.trim() : ''
  if (options.isOverride && manual) return manual
  if (auto) return auto
  // Legacy stored EN without override flag still counts as usable EN
  if (manual) return manual
  return no
}
