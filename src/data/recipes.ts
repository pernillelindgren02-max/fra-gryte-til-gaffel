export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type PreparationLevel = 'noCutting' | 'someCutting' | 'morePrep'
export type StorageNeed = 'noCooling' | 'fewHoursOk' | 'needsCooling'
export type PriceLevel = 'cheap' | 'medium' | 'luxury'
export type DishwashingLevel = 'almostNothing' | 'little' | 'extra'
export type CampingStoveSuitability = 'perfect' | 'adaptable' | 'indoorBest'
export type WaterNeed = 'almostNone' | 'some' | 'lots'

export type TimeRange = 'upTo20' | '21to30' | '31to40' | '41to60'
export type IngredientCountRange = '1to4' | '5to6' | '7to8' | 'moreThan8'

/** Units used for shopping-list combining. null = qualitative / no amount. */
export type IngredientUnit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'dl'
  | 'l'
  | 'stk'
  | 'ss'
  | 'ts'
  | null

export interface Ingredient {
  name: string
  quantity: number | null
  unit: IngredientUnit
}

export interface Recipe {
  id: string
  name: string
  shortDescription: string
  /** Public path under /images/recipes/ — swap the file to change the picture. */
  image: string
  timeMinutes: number
  /** Number of portions the ingredient amounts are written for. */
  servings: number
  mealType: MealType
  preparationLevel: PreparationLevel
  storageNeed: StorageNeed
  priceLevel: PriceLevel
  dishwashingLevel: DishwashingLevel
  campingStoveSuitability: CampingStoveSuitability
  waterNeed: WaterNeed
  ingredients: Ingredient[]
  steps: string[]
  practicalTags: string[]
}

export interface FilterState {
  timeRanges: TimeRange[]
  preparationLevels: PreparationLevel[]
  ingredientCountRanges: IngredientCountRange[]
  storageNeeds: StorageNeed[]
  mealTypes: MealType[]
  priceLevels: PriceLevel[]
  dishwashingLevels: DishwashingLevel[]
  campingStoveSuitabilities: CampingStoveSuitability[]
  waterNeeds: WaterNeed[]
}

export const emptyFilters: FilterState = {
  timeRanges: [],
  preparationLevels: [],
  ingredientCountRanges: [],
  storageNeeds: [],
  mealTypes: [],
  priceLevels: [],
  dishwashingLevels: [],
  campingStoveSuitabilities: [],
  waterNeeds: [],
}

function ing(
  name: string,
  quantity: number | null = null,
  unit: IngredientUnit = null,
): Ingredient {
  return { name, quantity, unit }
}

/**
 * Local seed / offline fallback (15). Live published recipes come from Supabase
 * via RecipesProvider. Admin edits in /admin — do not rely on editing this file.
 */
export const localRecipes: Recipe[] = [
  {
    id: 'pokebowl-laks',
    name: 'Pokébowl med laks',
    shortDescription:
      'Fersk laks, ris og friske toppinger med chilimajones. 2 porsjoner.',
    image: '/images/recipes/pokebowl-med-laks.jpg',
    timeMinutes: 25,
    servings: 2,
    mealType: 'dinner',
    preparationLevel: 'morePrep',
    storageNeed: 'needsCooling',
    priceLevel: 'luxury',
    dishwashingLevel: 'extra',
    campingStoveSuitability: 'indoorBest',
    waterNeed: 'lots',
    ingredients: [
      ing('laksefilet', 250, 'g'),
      ing('jasminris', 150, 'g'),
      ing('agurk', 0.5, 'stk'),
      ing('avokado', 1, 'stk'),
      ing('mango', 0.5, 'stk'),
      ing('gulrot', 1, 'stk'),
      ing('soyasaus', 2, 'ss'),
      ing('majones', 2, 'ss'),
      ing('sriracha', 1, 'ts'),
      ing('lime', 0.5, 'stk'),
    ],
    steps: [
      'Kok risen etter anvisningen på pakken.',
      'Skjær laksen i terninger og stek den i panne i 4–5 minutter. Ha over 1 ss soyasaus mot slutten.',
      'Skjær agurk, avokado og mango i biter, og gulroten i tynne strimler.',
      'Bland majones, sriracha og litt lime.',
      'Fordel ris, laks og grønnsaker i skåler og topp med chilimajones og resten av soyasausen.',
    ],
    practicalTags: ['2 porsjoner', 'Fersk fisk', 'Mye kutting'],
  },
  {
    id: 'lasagnegryte',
    name: 'Lasagnegryte',
    shortDescription:
      'All smaken av lasagne i én gryte — uten ovn. 2 porsjoner.',
    image: '/images/recipes/lasagnegryte.jpg',
    timeMinutes: 30,
    servings: 2,
    mealType: 'dinner',
    preparationLevel: 'morePrep',
    storageNeed: 'needsCooling',
    priceLevel: 'medium',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'some',
    ingredients: [
      ing('kjøttdeig', 250, 'g'),
      ing('gul løk', 0.5, 'stk'),
      ing('gulrot', 1, 'stk'),
      ing('tomatpuré', 1, 'ss'),
      ing('hakkede tomater', 400, 'g'),
      ing('lasagneplater', 5, 'stk'),
      ing('vann', 2, 'dl'),
      ing('crème fraîche', 2, 'ss'),
      ing('revet ost', 75, 'g'),
      ing('salt og pepper'),
    ],
    steps: [
      'Finhakk løken og riv eller kutt gulroten smått.',
      'Stek kjøttdeig, løk og gulrot i en gryte.',
      'Rør inn tomatpuré og hakkede tomater.',
      'Knekk lasagneplatene i mindre biter og legg dem i gryten sammen med vannet.',
      'La småkoke under lokk i 12–15 minutter, til pastaen er myk.',
      'Rør inn crème fraîche og topp med ost. Sett på lokket et par minutter så osten smelter.',
    ],
    practicalTags: ['Én gryte', '2 porsjoner', 'Uten ovn'],
  },
  {
    id: 'kremet-pasta-chorizo',
    name: 'Kremet pasta med chorizo',
    shortDescription:
      'Rask pastamiddag med krydret chorizo og crème fraîche. 2 porsjoner.',
    image: '/images/recipes/kremet-pasta-med-chorizo.jpg',
    timeMinutes: 20,
    servings: 2,
    mealType: 'dinner',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'medium',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'lots',
    ingredients: [
      ing('pasta', 180, 'g'),
      ing('chorizo', 120, 'g'),
      ing('sjalottløk', 1, 'stk'),
      ing('tomatpuré', 1.5, 'ss'),
      ing('crème fraîche', 1.5, 'dl'),
      ing('parmesan', 30, 'g'),
      ing('pastavann', 1, 'dl'),
      ing('sort pepper'),
    ],
    steps: [
      'Kok pastaen og spar omtrent 1 dl av pastavannet.',
      'Skjær chorizo i biter og finhakk løken.',
      'Stek chorizo og løk i gryten til chorizoen slipper litt fett.',
      'Tilsett tomatpuré og stek i ett minutt.',
      'Rør inn crème fraîche og litt pastavann.',
      'Vend inn pastaen og topp med parmesan og sort pepper.',
    ],
    practicalTags: ['2 porsjoner', 'Rask middag', 'Kremet'],
  },
  {
    id: 'gnocchi-kylling-sopp',
    name: 'Gnocchi med kylling og sopp',
    shortDescription:
      'Gnocchi stekes rett i pannen med kylling, sopp og fløte. 2 porsjoner.',
    image: '/images/recipes/gnocchi-kylling-sopp.jpg',
    timeMinutes: 20,
    servings: 2,
    mealType: 'dinner',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'medium',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'almostNone',
    ingredients: [
      ing('gnocchi', 300, 'g'),
      ing('kyllingfilet', 250, 'g'),
      ing('sopp', 150, 'g'),
      ing('gul løk', 0.5, 'stk'),
      ing('matfløte', 1.5, 'dl'),
      ing('parmesan', 30, 'g'),
      ing('smør', 1, 'ss'),
      ing('salt og pepper'),
    ],
    steps: [
      'Skjær kylling, sopp og løk i biter.',
      'Stek kyllingen i smør eller olje til den nesten er gjennomstekt.',
      'Tilsett løk og sopp og stek videre i noen minutter.',
      'Ha gnocchien rett i pannen og stek i 2–3 minutter.',
      'Hell over fløten og la alt småkoke i 4–5 minutter.',
      'Rør inn parmesan og smak til med salt og pepper.',
    ],
    practicalTags: ['Én panne', '2 porsjoner', 'Lite vann'],
  },
  {
    id: 'nudler-peanottsaus',
    name: 'Nudler med peanøttsaus',
    shortDescription:
      'Kremede peanøttnudler med chili og lime — klar på et kvarter. 2 porsjoner.',
    image: '/images/recipes/nudler-peanottsaus.jpg',
    timeMinutes: 15,
    servings: 2,
    mealType: 'dinner',
    preparationLevel: 'noCutting',
    storageNeed: 'fewHoursOk',
    priceLevel: 'cheap',
    dishwashingLevel: 'almostNothing',
    campingStoveSuitability: 'perfect',
    waterNeed: 'some',
    ingredients: [
      ing('nudler', 180, 'g'),
      ing('peanøttsmør', 3, 'ss'),
      ing('soyasaus', 2, 'ss'),
      ing('chili crisp', 1, 'ss'),
      ing('honning', 1, 'ts'),
      ing('lime', 0.5, 'stk'),
      ing('nudelvann', 3.5, 'ss'),
    ],
    steps: [
      'Kok nudlene og spar litt av kokevannet.',
      'Bland peanøttsmør, soyasaus, chili crisp, honning og lime i en bolle eller rett i gryten.',
      'Spe med litt nudelvann til sausen blir kremet.',
      'Vend inn nudlene og server.',
    ],
    practicalTags: ['Ingen kutting', 'Primusvennlig', '2 porsjoner'],
  },
  {
    id: 'linsegryte-sotpotet-feta',
    name: 'Kremet linsegryte med søtpotet og feta',
    shortDescription:
      'Varmende gryte med kylling, røde linser og søtpotet. 2 porsjoner.',
    image: '/images/recipes/linsegryte-sotpotet-feta.jpg',
    timeMinutes: 30,
    servings: 2,
    mealType: 'dinner',
    preparationLevel: 'morePrep',
    storageNeed: 'needsCooling',
    priceLevel: 'medium',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'lots',
    ingredients: [
      ing('søtpotet', 1, 'stk'),
      ing('gulrot', 1, 'stk'),
      ing('røde linser', 1, 'dl'),
      ing('kyllingfilet', 200, 'g'),
      ing('vann', 5, 'dl'),
      ing('buljongterning', 1, 'stk'),
      ing('spinat', 2, 'stk'),
      ing('crème fraîche', 2, 'ss'),
      ing('feta', 50, 'g'),
      ing('paprikapulver', 1, 'ts'),
    ],
    steps: [
      'Skjær kylling, søtpotet og gulrot i små biter.',
      'Stek kyllingen lett i gryten.',
      'Tilsett søtpotet, gulrot, linser, paprikapulver, vann og buljong.',
      'La småkoke i 15–20 minutter til grønnsakene og linsene er myke.',
      'Rør inn spinat og crème fraîche.',
      'Smuldre feta over ved servering.',
    ],
    practicalTags: ['Én gryte', '2 porsjoner', 'Mettende'],
  },
  {
    id: 'enkel-gyros',
    name: 'Enkel gyros',
    shortDescription:
      'Stekt kjøtt i pitabrød med yoghurt, feta og friske grønnsaker. 2 porsjoner.',
    image: '/images/recipes/enkel-gyros.jpg',
    timeMinutes: 20,
    servings: 2,
    mealType: 'dinner',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'medium',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'almostNone',
    ingredients: [
      ing('lammestrimler eller kylling', 250, 'g'),
      ing('pitabrød', 2, 'stk'),
      ing('agurk', 0.5, 'stk'),
      ing('rødløk', 0.5, 'stk'),
      ing('feta', 60, 'g'),
      ing('gresk yoghurt', 1, 'dl'),
      ing('sitron', 0.5, 'stk'),
      ing('oregano', 1, 'ts'),
      ing('paprikapulver', 1, 'ts'),
      ing('salt og pepper'),
    ],
    steps: [
      'Krydre kjøttet med oregano, paprikapulver, salt og pepper.',
      'Stek kjøttet i panne til det er gjennomstekt.',
      'Bland yoghurt med litt sitronsaft og salt.',
      'Skjær agurk og rødløk.',
      'Varm pitabrødene raskt i pannen.',
      'Fyll med kjøtt, grønnsaker, feta og yoghurtsaus.',
    ],
    practicalTags: ['2 porsjoner', 'Lite vann', 'Streetfood'],
  },
  {
    id: 'pannekaker-blabaer',
    name: 'Pannekaker med varmt blåbærsyltetøy',
    shortDescription:
      'Tynne pannekaker servert med hjemmelaget blåbærsyltetøy. 2 porsjoner.',
    image: '/images/recipes/pannekaker-blabaer.jpg',
    timeMinutes: 30,
    servings: 2,
    mealType: 'breakfast',
    preparationLevel: 'noCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'cheap',
    dishwashingLevel: 'extra',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'almostNone',
    ingredients: [
      ing('egg', 2, 'stk'),
      ing('melk', 3, 'dl'),
      ing('hvetemel', 1.5, 'dl'),
      ing('salt', 0.25, 'ts'),
      ing('smør til steking'),
      ing('blåbær', 200, 'g'),
      ing('sukker', 2, 'ss'),
      ing('sitronsaft', 1, 'ts'),
    ],
    steps: [
      'Visp sammen egg og melk, og visp inn mel og salt.',
      'La røren stå i 10 minutter hvis du har tid.',
      'Kok blåbær, sukker og sitron i en liten gryte i 5–7 minutter.',
      'Sett syltetøyet til side.',
      'Stek tynne pannekaker i litt smør og server med det varme blåbærsyltetøyet.',
    ],
    practicalTags: ['Frokost', '2 porsjoner', 'Søtt'],
  },
  {
    id: 'tyrkiske-egg-light',
    name: 'Tyrkiske egg light',
    shortDescription:
      'Bløtkokte egg på yoghurt med chilismør og brød. 2 porsjoner.',
    image: '/images/recipes/tyrkiske-egg-light.jpg',
    timeMinutes: 15,
    servings: 2,
    mealType: 'breakfast',
    preparationLevel: 'noCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'cheap',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'some',
    ingredients: [
      ing('egg', 4, 'stk'),
      ing('gresk yoghurt', 2, 'dl'),
      ing('hvitløk', 1, 'stk'),
      ing('smør', 1, 'ss'),
      ing('chiliflak', 0.5, 'ts'),
      ing('paprikapulver', 0.5, 'ts'),
      ing('salt'),
      ing('brødskiver', 2, 'stk'),
    ],
    steps: [
      'Kok eggene i 6–7 minutter for bløt plomme.',
      'Bland yoghurt med litt salt og eventuelt finrevet hvitløk.',
      'Smelt smøret i en liten panne og rør inn chili og paprikapulver.',
      'Fordel yoghurten på tallerkener, legg eggene over og topp med chilismøret.',
      'Server med brød.',
    ],
    practicalTags: ['Frokost', '2 porsjoner', 'Rask'],
  },
  {
    id: 'halloumi-honey-toast',
    name: 'Halloumi & honey toast',
    shortDescription:
      'Stekt halloumi på toast med yoghurt, honning og chili. 2 porsjoner.',
    image: '/images/recipes/halloumi-honey-toast.jpg',
    timeMinutes: 10,
    servings: 2,
    mealType: 'breakfast',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'medium',
    dishwashingLevel: 'almostNothing',
    campingStoveSuitability: 'perfect',
    waterNeed: 'almostNone',
    ingredients: [
      ing('brødskiver', 4, 'stk'),
      ing('halloumi', 200, 'g'),
      ing('gresk yoghurt', 4, 'ss'),
      ing('honning', 2, 'ts'),
      ing('chiliflak', 0.5, 'ts'),
    ],
    steps: [
      'Skjær halloumien i skiver og stek den gyllen på begge sider.',
      'Rist brødet i samme panne.',
      'Smør yoghurt på brødet.',
      'Legg på halloumi og topp med honning og chiliflak.',
    ],
    practicalTags: ['10 min', 'Én panne', 'Primusvennlig'],
  },
  {
    id: 'crispy-rice-bowl',
    name: 'Crispy rice bowl med egg',
    shortDescription:
      'Sprø stekt ris med egg, avokado og chilimajones. 2 porsjoner.',
    image: '/images/recipes/crispy-rice-bowl.jpg',
    timeMinutes: 15,
    servings: 2,
    mealType: 'lunch',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'medium',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'almostNone',
    ingredients: [
      ing('kokt kald ris', 300, 'g'),
      ing('egg', 2, 'stk'),
      ing('agurk', 0.5, 'stk'),
      ing('avokado', 1, 'stk'),
      ing('soyasaus', 2, 'ss'),
      ing('chilimajones', 2, 'ss'),
      ing('olje', 1, 'ss'),
    ],
    steps: [
      'Varm olje i en panne og fordel risen utover.',
      'La risen ligge i ro noen minutter før du vender den, slik at den blir sprø.',
      'Stek eggene i samme panne.',
      'Skjær agurk og avokado.',
      'Fordel risen i skåler og topp med egg, grønnsaker, soyasaus og chilimajones.',
    ],
    practicalTags: ['Restemat', '2 porsjoner', 'Lite vann'],
  },
  {
    id: 'apple-pie-oats',
    name: 'Apple pie oats',
    shortDescription:
      'Havregrøt toppet med karamelliserte epler og yoghurt. 2 porsjoner.',
    image: '/images/recipes/apple-pie-oats.jpg',
    timeMinutes: 15,
    servings: 2,
    mealType: 'breakfast',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'cheap',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'perfect',
    waterNeed: 'almostNone',
    ingredients: [
      ing('havregryn', 2, 'dl'),
      ing('melk', 4, 'dl'),
      ing('eple', 1, 'stk'),
      ing('smør', 1, 'ss'),
      ing('kanel', 1, 'ts'),
      ing('honning', 1, 'ss'),
      ing('gresk yoghurt', 4, 'ss'),
    ],
    steps: [
      'Kok havregryn og melk til grøt.',
      'Skjær eplet i små biter.',
      'Stek eplet i smør, kanel og honning til det blir mykt og lett karamellisert.',
      'Fordel grøten i skåler og topp med epler og yoghurt.',
    ],
    practicalTags: ['Frokost', '2 porsjoner', 'Primusvennlig'],
  },
  {
    id: 'carrot-cake-oats',
    name: 'Carrot cake oats',
    shortDescription:
      'Gulrotgrøt med kanel og yoghurt — som gulrotkake til frokost. 2 porsjoner.',
    image: '/images/recipes/carrot-cake-oats.jpg',
    timeMinutes: 15,
    servings: 2,
    mealType: 'breakfast',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'cheap',
    dishwashingLevel: 'almostNothing',
    campingStoveSuitability: 'perfect',
    waterNeed: 'almostNone',
    ingredients: [
      ing('havregryn', 2, 'dl'),
      ing('melk', 4, 'dl'),
      ing('gulrot', 1, 'stk'),
      ing('kanel', 1, 'ts'),
      ing('honning', 1, 'ss'),
      ing('rosiner', 2, 'ss'),
      ing('gresk yoghurt', 4, 'ss'),
    ],
    steps: [
      'Riv gulroten fint.',
      'Kok havregryn, melk, gulrot, kanel og eventuelt rosiner i 5–7 minutter.',
      'Rør inn honning.',
      'Server med gresk yoghurt på toppen.',
    ],
    practicalTags: ['Én gryte', 'Frokost', 'Primusvennlig'],
  },
  {
    id: 'shakshuka',
    name: 'Shakshuka',
    shortDescription:
      'Egg som trekkes i krydret tomatsaus med paprika og feta. 2 porsjoner.',
    image: '/images/recipes/shakshuka.jpg',
    timeMinutes: 25,
    servings: 2,
    mealType: 'breakfast',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'cheap',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'almostNone',
    ingredients: [
      ing('egg', 4, 'stk'),
      ing('hakkede tomater', 400, 'g'),
      ing('gul løk', 0.5, 'stk'),
      ing('rød paprika', 0.5, 'stk'),
      ing('tomatpuré', 1, 'ss'),
      ing('paprikapulver', 1, 'ts'),
      ing('chiliflak', 0.5, 'ts'),
      ing('feta', 50, 'g'),
      ing('olje', 1, 'ss'),
      ing('salt og pepper'),
    ],
    steps: [
      'Finhakk løk og paprika.',
      'Stek dem i olje til de blir myke.',
      'Tilsett tomatpuré, hakkede tomater og krydder.',
      'La sausen småkoke i 8–10 minutter.',
      'Lag fire små groper og knekk eggene oppi.',
      'Sett på lokk og la eggene trekke i 5–7 minutter.',
      'Topp med feta.',
    ],
    practicalTags: ['Én panne', '2 porsjoner', 'Brunch'],
  },
  {
    id: 'eplecrumble-grot',
    name: 'Eplecrumble-grøt',
    shortDescription:
      'Havregrøt med stekte epler og sprø crumble-topping. 2 porsjoner.',
    image: '/images/recipes/eplecrumble-grot.jpg',
    timeMinutes: 15,
    servings: 2,
    mealType: 'breakfast',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'cheap',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'perfect',
    waterNeed: 'almostNone',
    ingredients: [
      ing('havregryn', 2, 'dl'),
      ing('melk', 4, 'dl'),
      ing('eple', 1, 'stk'),
      ing('smør', 1, 'ss'),
      ing('brunt sukker', 1, 'ss'),
      ing('kanel', 1, 'ts'),
      ing('havregryn til topping', 2, 'ss'),
      ing('gresk yoghurt', 4, 'ss'),
    ],
    steps: [
      'Kok 2 dl havregryn og melk til grøt.',
      'Skjær eplet i små terninger.',
      'Stek eplet i smør, sukker og kanel til det er mykt.',
      'Tilsett de ekstra havregrynene i pannen og stek dem raskt sammen med eplet til de blir litt sprø.',
      'Topp grøten med epleblandingen og yoghurt.',
    ],
    practicalTags: ['Frokost', '2 porsjoner', 'Primusvennlig'],
  },
]

export function getIngredientCount(recipe: Recipe): number {
  return recipe.ingredients.length
}

export function formatIngredient(ingredient: Ingredient): string {
  if (ingredient.quantity == null || ingredient.unit == null) {
    if (ingredient.quantity != null && ingredient.unit === null) {
      return `${formatQuantityDisplay(ingredient.quantity)} ${ingredient.name}`
    }
    return ingredient.name
  }
  return `${formatQuantityDisplay(ingredient.quantity)} ${ingredient.unit} ${ingredient.name}`
}

export function formatQuantityDisplay(value: number): string {
  const rounded = Math.round(value * 1000) / 1000
  const whole = Math.floor(rounded + 1e-9)
  const frac = Math.round((rounded - whole) * 1000) / 1000
  const fracLabel =
    frac === 0
      ? ''
      : frac === 0.25
        ? '1/4'
        : frac === 0.5
          ? '1/2'
          : frac === 0.75
            ? '3/4'
            : String(frac).replace('.', ',')
  if (!fracLabel) return String(whole)
  if (whole === 0) return fracLabel
  return `${whole} ${fracLabel}`
}

export function getTimeRange(minutes: number): TimeRange | null {
  if (minutes <= 20) return 'upTo20'
  if (minutes <= 30) return '21to30'
  if (minutes <= 40) return '31to40'
  if (minutes <= 60) return '41to60'
  return null
}

export function getIngredientCountRange(count: number): IngredientCountRange {
  if (count <= 4) return '1to4'
  if (count <= 6) return '5to6'
  if (count <= 8) return '7to8'
  return 'moreThan8'
}

/** @deprecated Prefer useRecipes().getById — local fallback only. */
export const recipes = localRecipes

export function getRecipeById(
  id: string,
  list: Recipe[] = localRecipes,
): Recipe | undefined {
  return list.find((recipe) => recipe.id === id)
}

export function recipeImageUrl(
  imagePath: string | null | undefined,
  supabaseUrl?: string,
): string {
  if (!imagePath) return '/images/recipes/placeholder-dish.jpg'
  if (imagePath.startsWith('http') || imagePath.startsWith('/')) return imagePath
  const base = (supabaseUrl ?? '').replace(/\/$/, '')
  if (!base) return `/images/recipes/${imagePath}`
  return `${base}/storage/v1/object/public/recipe-images/${imagePath}`
}
