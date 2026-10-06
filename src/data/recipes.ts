export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type PreparationLevel = 'noCutting' | 'someCutting' | 'morePrep'
export type StorageNeed = 'noCooling' | 'fewHoursOk' | 'needsCooling'
export type PriceLevel = 'cheap' | 'medium' | 'luxury'
export type DishwashingLevel = 'almostNothing' | 'little' | 'extra'
export type CampingStoveSuitability = 'perfect' | 'adaptable' | 'indoorBest'
export type WaterNeed = 'almostNone' | 'some' | 'lots'

export type TimeRange = 'upTo20' | '21to30' | '31to40' | '41to60'
export type IngredientCountRange = '1to4' | '5to6' | '7to8' | 'moreThan8'

export interface Recipe {
  id: string
  name: string
  shortDescription: string
  timeMinutes: number
  mealType: MealType
  preparationLevel: PreparationLevel
  storageNeed: StorageNeed
  priceLevel: PriceLevel
  dishwashingLevel: DishwashingLevel
  campingStoveSuitability: CampingStoveSuitability
  waterNeed: WaterNeed
  ingredients: string[]
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

/**
 * Real recipe library (15). Edit this file by hand to add or change recipes.
 * Filter fields that were not stated in the source are inferred — see
 * internal notes in the project store if you need the rationale.
 */
export const recipes: Recipe[] = [
  {
    id: 'pokebowl-laks',
    name: 'Pokébowl med laks',
    shortDescription:
      'Fersk laks, ris og friske toppinger med chilimajones. 2 porsjoner.',
    timeMinutes: 25,
    mealType: 'dinner',
    preparationLevel: 'morePrep',
    storageNeed: 'needsCooling',
    priceLevel: 'luxury',
    dishwashingLevel: 'extra',
    campingStoveSuitability: 'indoorBest',
    waterNeed: 'lots',
    ingredients: [
      '250 g laksefilet',
      '150 g jasminris',
      '1/2 agurk',
      '1 avokado',
      '1/2 mango',
      '1 gulrot',
      '2 ss soyasaus',
      '2 ss majones',
      '1 ts sriracha',
      '1/2 lime',
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
    timeMinutes: 30,
    mealType: 'dinner',
    preparationLevel: 'morePrep',
    storageNeed: 'needsCooling',
    priceLevel: 'medium',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'some',
    ingredients: [
      '250 g kjøttdeig',
      '1/2 gul løk',
      '1 gulrot',
      '1 ss tomatpuré',
      '400 g hakkede tomater',
      '5 lasagneplater',
      '2 dl vann',
      '2 ss crème fraîche',
      '75 g revet ost',
      'Salt og pepper',
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
    timeMinutes: 20,
    mealType: 'dinner',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'medium',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'lots',
    ingredients: [
      '180 g pasta',
      '120 g chorizo',
      '1 sjalottløk',
      '1,5 ss tomatpuré',
      '1,5 dl crème fraîche',
      '30 g parmesan',
      '1 dl pastavann',
      'Sort pepper',
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
    timeMinutes: 20,
    mealType: 'dinner',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'medium',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'almostNone',
    ingredients: [
      '300 g gnocchi',
      '250 g kyllingfilet',
      '150 g sopp',
      '1/2 gul løk',
      '1,5 dl matfløte',
      '30 g parmesan',
      '1 ss smør eller olje',
      'Salt og pepper',
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
    timeMinutes: 15,
    mealType: 'dinner',
    preparationLevel: 'noCutting',
    storageNeed: 'fewHoursOk',
    priceLevel: 'cheap',
    dishwashingLevel: 'almostNothing',
    campingStoveSuitability: 'perfect',
    waterNeed: 'some',
    ingredients: [
      '180 g nudler',
      '3 ss peanøttsmør',
      '2 ss soyasaus',
      '1 ss chili crisp',
      '1 ts honning',
      'Saften av 1/2 lime',
      '3–4 ss nudelvann',
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
    timeMinutes: 30,
    mealType: 'dinner',
    preparationLevel: 'morePrep',
    storageNeed: 'needsCooling',
    priceLevel: 'medium',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'lots',
    ingredients: [
      '1 liten søtpotet',
      '1 gulrot',
      '1 dl røde linser',
      '200 g kyllingfilet',
      '5 dl vann',
      '1 buljongterning',
      '2 store never spinat',
      '2 ss crème fraîche',
      '50 g feta',
      '1 ts paprikapulver',
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
    timeMinutes: 20,
    mealType: 'dinner',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'medium',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'almostNone',
    ingredients: [
      '250 g lammestrimler eller kylling',
      '2 store pitabrød',
      '1/2 agurk',
      '1/2 rødløk',
      '60 g feta',
      '1 dl gresk yoghurt',
      '1/2 sitron',
      '1 ts oregano',
      '1 ts paprikapulver',
      'Salt og pepper',
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
    timeMinutes: 30,
    mealType: 'breakfast',
    preparationLevel: 'noCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'cheap',
    dishwashingLevel: 'extra',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'almostNone',
    ingredients: [
      '2 egg',
      '3 dl melk',
      '1,5 dl hvetemel',
      '1/4 ts salt',
      'Smør til steking',
      '200 g blåbær',
      '2 ss sukker',
      '1 ts sitronsaft',
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
    timeMinutes: 15,
    mealType: 'breakfast',
    preparationLevel: 'noCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'cheap',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'some',
    ingredients: [
      '4 egg',
      '2 dl gresk yoghurt',
      '1 liten hvitløksfedd, valgfritt',
      '1 ss smør',
      '1/2 ts chiliflak',
      '1/2 ts paprikapulver',
      'Salt',
      '2 skiver godt brød',
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
    timeMinutes: 10,
    mealType: 'breakfast',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'medium',
    dishwashingLevel: 'almostNothing',
    campingStoveSuitability: 'perfect',
    waterNeed: 'almostNone',
    ingredients: [
      '4 skiver brød',
      '200 g halloumi',
      '4 ss gresk yoghurt',
      '2 ts honning',
      '1/2 ts chiliflak',
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
    timeMinutes: 15,
    mealType: 'lunch',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'medium',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'almostNone',
    ingredients: [
      '300 g kokt, kald ris',
      '2 egg',
      '1/2 agurk',
      '1 avokado',
      '2 ss soyasaus',
      '2 ss chilimajones',
      '1 ss olje',
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
    timeMinutes: 15,
    mealType: 'breakfast',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'cheap',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'perfect',
    waterNeed: 'almostNone',
    ingredients: [
      '2 dl havregryn',
      '4 dl melk',
      '1 stort eple',
      '1 ss smør',
      '1 ts kanel',
      '1 ss honning eller brunt sukker',
      '4 ss gresk yoghurt',
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
    timeMinutes: 15,
    mealType: 'breakfast',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'cheap',
    dishwashingLevel: 'almostNothing',
    campingStoveSuitability: 'perfect',
    waterNeed: 'almostNone',
    ingredients: [
      '2 dl havregryn',
      '4 dl melk',
      '1 stor gulrot',
      '1 ts kanel',
      '1 ss honning',
      '2 ss rosiner, valgfritt',
      '4 ss gresk yoghurt',
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
    timeMinutes: 25,
    mealType: 'breakfast',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'cheap',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'adaptable',
    waterNeed: 'almostNone',
    ingredients: [
      '4 egg',
      '400 g hakkede tomater',
      '1/2 gul løk',
      '1/2 rød paprika',
      '1 ss tomatpuré',
      '1 ts paprikapulver',
      '1/2 ts chiliflak',
      '50 g feta',
      '1 ss olje',
      'Salt og pepper',
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
    timeMinutes: 15,
    mealType: 'breakfast',
    preparationLevel: 'someCutting',
    storageNeed: 'needsCooling',
    priceLevel: 'cheap',
    dishwashingLevel: 'little',
    campingStoveSuitability: 'perfect',
    waterNeed: 'almostNone',
    ingredients: [
      '2 dl havregryn',
      '4 dl melk',
      '1 stort eple',
      '1 ss smør',
      '1 ss brunt sukker eller honning',
      '1 ts kanel',
      '2 ss ekstra havregryn',
      '4 ss gresk yoghurt',
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

export function getRecipeById(id: string): Recipe | undefined {
  return recipes.find((recipe) => recipe.id === id)
}
