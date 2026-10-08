import type { AppLocale } from './types'

/** Flat UI catalog — scalable keys, no scattered conditionals. */
export type MessageKey =
  | 'nav.explore'
  | 'nav.home'
  | 'nav.shopping'
  | 'nav.favorites'
  | 'nav.tips'
  | 'nav.account'
  | 'nav.backToApp'
  | 'explore.tagline'
  | 'explore.searchPlaceholder'
  | 'explore.filters'
  | 'explore.clearFilters'
  | 'explore.results'
  | 'explore.recipeCount'
  | 'explore.empty'
  | 'explore.showAll'
  | 'explore.categories'
  | 'recipe.back'
  | 'recipe.portions'
  | 'recipe.ingredients'
  | 'recipe.steps'
  | 'recipe.addShopping'
  | 'recipe.inShopping'
  | 'recipe.save'
  | 'recipe.saved'
  | 'recipe.min'
  | 'recipe.servings'
  | 'pantry.title'
  | 'pantry.lead'
  | 'pantry.placeholder'
  | 'pantry.add'
  | 'pantry.matches'
  | 'pantry.empty'
  | 'pantry.already'
  | 'pantry.have'
  | 'pantry.missing'
  | 'pantry.openRecipe'
  | 'pantry.matchAll'
  | 'pantry.matchFew'
  | 'pantry.matchSome'
  | 'shopping.title'
  | 'shopping.empty'
  | 'shopping.clear'
  | 'shopping.from'
  | 'favorites.title'
  | 'favorites.empty'
  | 'favorites.folders'
  | 'favorites.loginHint'
  | 'tips.eyebrow'
  | 'tips.title'
  | 'tips.lead'
  | 'tips.empty'
  | 'tips.read'
  | 'tips.more'
  | 'auth.title'
  | 'auth.login'
  | 'auth.signup'
  | 'auth.email'
  | 'auth.password'
  | 'auth.submitLogin'
  | 'auth.submitSignup'
  | 'auth.busy'
  | 'auth.logout'
  | 'auth.loggedInAs'
  | 'auth.language'
  | 'auth.languageHint'
  | 'auth.feedback'
  | 'auth.howItWorks'
  | 'auth.notifyRecipes'
  | 'auth.notifyHint'
  | 'auth.backExplore'
  | 'auth.myFavorites'
  | 'auth.supabaseMissing'
  | 'lang.norsk'
  | 'lang.english'
  | 'lang.chooseTitle'
  | 'lang.chooseLead'
  | 'lang.continue'
  | 'onboarding.next'
  | 'onboarding.skip'
  | 'onboarding.start'
  | 'onboarding.prev'
  | 'onboarding.replayHint'
  | 'onboarding.previewHint'
  | 'common.retry'
  | 'common.loading'
  | 'common.save'
  | 'common.cancel'
  | 'common.close'
  | 'common.open'
  | 'filter.time'
  | 'filter.prep'
  | 'filter.ingredients'
  | 'filter.storage'
  | 'filter.meal'
  | 'filter.price'
  | 'filter.dishes'
  | 'filter.stove'
  | 'filter.water'
  | 'filter.apply'
  | 'filter.reset'
  | 'time.upTo20'
  | 'time.21to30'
  | 'time.31to40'
  | 'time.41to60'
  | 'prep.noCutting'
  | 'prep.someCutting'
  | 'prep.morePrep'
  | 'ingCount.1to4'
  | 'ingCount.5to6'
  | 'ingCount.7to8'
  | 'ingCount.moreThan8'
  | 'storage.noCooling'
  | 'storage.fewHoursOk'
  | 'storage.needsCooling'
  | 'meal.breakfast'
  | 'meal.lunch'
  | 'meal.dinner'
  | 'price.cheap'
  | 'price.medium'
  | 'price.luxury'
  | 'dishes.almostNothing'
  | 'dishes.little'
  | 'dishes.extra'
  | 'stove.perfect'
  | 'stove.adaptable'
  | 'stove.indoorBest'
  | 'water.almostNone'
  | 'water.some'
  | 'water.lots'
  | 'cat.primus'
  | 'cat.few-ingredients'
  | 'cat.quick'
  | 'cat.dinner'
  | 'cat.breakfast'
  | 'cat.lunch'
  | 'cat.dessert'
  | 'spotify.open'
  | 'spotify.mood'
  | 'note.title'
  | 'note.save'
  | 'note.placeholder'
  | 'feedback.title'
  | 'feedback.lead'
  | 'feedback.type'
  | 'feedback.message'
  | 'feedback.send'
  | 'feedback.sent'
  | 'empty.shopping'
  | 'empty.favorites'
  | 'empty.pantry'
  | 'unit.g'
  | 'unit.kg'
  | 'unit.ml'
  | 'unit.dl'
  | 'unit.l'
  | 'unit.stk'
  | 'unit.ss'
  | 'unit.ts'
  | 'share.menu'
  | 'share.link'
  | 'share.pdf'
  | 'share.makingPdf'
  | 'share.downloadPdf'
  | 'share.print'
  | 'share.pdfFailed'
  | 'share.linkCopied'
  | 'share.retry'

type Catalog = Record<MessageKey, string>

const no: Catalog = {
  'nav.explore': 'Utforsk',
  'nav.home': 'Hjemme',
  'nav.shopping': 'Handleliste',
  'nav.favorites': 'Favoritter',
  'nav.tips': 'Tips',
  'nav.account': 'Konto',
  'nav.backToApp': 'Tilbake til appen',
  'explore.tagline': 'En gryte unna noe godt',
  'explore.searchPlaceholder': 'Søk etter oppskrift eller ingrediens',
  'explore.filters': 'Filtre',
  'explore.clearFilters': 'Nullstill',
  'explore.results': 'Resultater',
  'explore.recipeCount': '{count} oppskrift|{count} oppskrifter',
  'explore.empty':
    'Ingen oppskrifter matcher akkurat nå. Prøv andre ord, eller fjern noen filtre.',
  'explore.showAll': 'Vis alle',
  'explore.categories': 'Kategorier',
  'recipe.back': 'Tilbake',
  'recipe.portions': 'Porsjoner',
  'recipe.ingredients': 'Ingredienser',
  'recipe.steps': 'Fremgangsmåte',
  'recipe.addShopping': 'Legg i handleliste',
  'recipe.inShopping': 'I handlelisten',
  'recipe.save': 'Lagre',
  'recipe.saved': 'Lagret',
  'recipe.min': 'min',
  'recipe.servings': 'porsjon|porsjoner',
  'pantry.title': 'Hva har du hjemme?',
  'pantry.lead': 'Legg til det du har — vi foreslår retter som matcher.',
  'pantry.placeholder': 'F.eks. egg, pasta, gulrot',
  'pantry.add': 'Legg til',
  'pantry.matches': 'Forslag',
  'pantry.empty': 'Legg til noen varer for å se treff.',
  'pantry.already': 'Allerede i listen.',
  'pantry.have': 'Du har',
  'pantry.missing': 'Mangler',
  'pantry.openRecipe': 'Åpne oppskrift',
  'pantry.matchAll': 'Du har alt du trenger',
  'pantry.matchFew': 'Du mangler bare {count} ingrediens|{count} ingredienser',
  'pantry.matchSome': 'Du har {have} av {total} ingredienser',
  'shopping.title': 'Handleliste',
  'shopping.empty': 'Handlelisten er tom. Legg til fra en oppskrift.',
  'shopping.clear': 'Tøm listen',
  'shopping.from': 'Fra',
  'favorites.title': 'Favoritter',
  'favorites.empty': 'Ingen lagrede oppskrifter ennå.',
  'favorites.folders': 'Mapper',
  'favorites.loginHint': 'Logg inn for å lagre favoritter og mapper.',
  'tips.eyebrow': 'Feltguide',
  'tips.title': 'Tips og triks',
  'tips.lead':
    'Korte, praktiske artikler for lite kjøkken, primus og tur — skrevet for å brukes, ikke skumles.',
  'tips.empty': 'Ingen tips publisert ennå',
  'tips.read': 'Les artikkelen',
  'tips.more': 'Flere tips',
  'auth.title': 'Konto',
  'auth.login': 'Logg inn',
  'auth.signup': 'Registrer',
  'auth.email': 'E-post',
  'auth.password': 'Passord',
  'auth.submitLogin': 'Logg inn',
  'auth.submitSignup': 'Opprett konto',
  'auth.busy': 'Vent litt…',
  'auth.logout': 'Logg ut',
  'auth.loggedInAs': 'Innlogget som',
  'auth.language': 'Språk / Language',
  'auth.languageHint': 'Velger språk for menyer, knapper og innhold.',
  'auth.feedback': 'Gi tilbakemelding',
  'auth.howItWorks': 'Slik fungerer appen',
  'auth.notifyRecipes': 'Varsler om nye oppskrifter',
  'auth.notifyHint':
    'Når dette er på, kan du få beskjed om nye oppskrifter senere (push).',
  'auth.backExplore': '← Tilbake til utforsk',
  'auth.myFavorites': 'Mine favoritter og mapper',
  'auth.supabaseMissing':
    'Supabase er ikke satt opp ennå. Lim inn nøkler i .env.local og start Vite på nytt.',
  'lang.norsk': 'Norsk',
  'lang.english': 'English',
  'lang.chooseTitle': 'Velg språk',
  'lang.chooseLead': 'Choose language / Velg språk',
  'lang.continue': 'Fortsett',
  'onboarding.next': 'Neste',
  'onboarding.skip': 'Hopp over',
  'onboarding.start': 'Kom i gang',
  'onboarding.prev': 'Tilbake',
  'onboarding.replayHint': 'Slik fungerer appen',
  'onboarding.previewHint':
    'Forhåndsvisning — endrer ikke din «første gang»-status',
  'common.retry': 'Prøv igjen',
  'common.loading': 'Laster…',
  'common.save': 'Lagre',
  'common.cancel': 'Avbryt',
  'common.close': 'Lukk',
  'common.open': 'Åpne',
  'filter.time': 'Tid',
  'filter.prep': 'Forberedelse',
  'filter.ingredients': 'Antall ingredienser',
  'filter.storage': 'Oppbevaring',
  'filter.meal': 'Måltid',
  'filter.price': 'Pris',
  'filter.dishes': 'Oppvask',
  'filter.stove': 'Primus',
  'filter.water': 'Vann',
  'filter.apply': 'Bruk filtre',
  'filter.reset': 'Nullstill filtre',
  'time.upTo20': '20 min eller mindre',
  'time.21to30': '21–30',
  'time.31to40': '31–40',
  'time.41to60': '41–60',
  'prep.noCutting': 'Ingen kutting',
  'prep.someCutting': 'Litt kutting',
  'prep.morePrep': 'Mer forberedelser',
  'ingCount.1to4': '1–4',
  'ingCount.5to6': '5–6',
  'ingCount.7to8': '7–8',
  'ingCount.moreThan8': 'Mer enn 8',
  'storage.noCooling': 'Ingen kjøling nødvendig',
  'storage.fewHoursOk': 'Tåler noen timer uten kjøling',
  'storage.needsCooling': 'Krever kjøling',
  'meal.breakfast': 'Frokost',
  'meal.lunch': 'Lunsj',
  'meal.dinner': 'Middag',
  'price.cheap': 'Billig',
  'price.medium': 'Middels',
  'price.luxury': 'Luksus',
  'dishes.almostNothing': 'Nesten ingenting',
  'dishes.little': 'Lite',
  'dishes.extra': 'Litt ekstra',
  'stove.perfect': 'Perfekt på primus',
  'stove.adaptable': 'Kan tilpasses primus',
  'stove.indoorBest': 'Best inne, men fungerer på primus',
  'water.almostNone': 'Nesten ikke vann',
  'water.some': 'Litt vann',
  'water.lots': 'Krever mye vann',
  'cat.primus': 'Perfekt til primus',
  'cat.few-ingredients': 'Få ingredienser',
  'cat.quick': 'Dårlig tid?',
  'cat.dinner': 'Middag',
  'cat.breakfast': 'Frokost',
  'cat.lunch': 'Lunsj',
  'cat.dessert': 'Dessert',
  'spotify.open': 'Åpne i Spotify',
  'spotify.mood': 'Sett stemningen',
  'note.title': 'Kommentar',
  'note.save': 'Lagre kommentar',
  'note.placeholder': 'Private notater til deg selv…',
  'feedback.title': 'Gi tilbakemelding',
  'feedback.lead':
    'Fortell hva som funker eller mangler. Dette er ikke private oppskriftsnotater — teksten kan leses i Admin for å forbedre produktet.',
  'feedback.type': 'Type',
  'feedback.message': 'Melding',
  'feedback.send': 'Send',
  'feedback.sent': 'Sendt. Takk!',
  'empty.shopping': 'Handlelisten er tom',
  'empty.favorites': 'Ingen favoritter ennå',
  'empty.pantry': 'Ingen varer hjemme ennå',
  'unit.g': 'g',
  'unit.kg': 'kg',
  'unit.ml': 'ml',
  'unit.dl': 'dl',
  'unit.l': 'l',
  'unit.stk': 'stk',
  'unit.ss': 'ss',
  'unit.ts': 'ts',
  'share.menu': 'Del oppskrift',
  'share.link': 'Del lenke',
  'share.pdf': 'Del som PDF',
  'share.makingPdf': 'Lager PDF…',
  'share.downloadPdf': 'Last ned PDF',
  'share.print': 'Skriv ut',
  'share.pdfFailed': 'Kunne ikke lage PDF akkurat nå. Prøv igjen.',
  'share.linkCopied': 'Lenke kopiert',
  'share.retry': 'Prøv igjen',
}

const en: Catalog = {
  'nav.explore': 'Explore',
  'nav.home': 'At home',
  'nav.shopping': 'Shopping list',
  'nav.favorites': 'Favorites',
  'nav.tips': 'Tips',
  'nav.account': 'Account',
  'nav.backToApp': 'Back to app',
  'explore.tagline': 'One pot away from something good',
  'explore.searchPlaceholder': 'Search recipes or ingredients',
  'explore.filters': 'Filters',
  'explore.clearFilters': 'Clear',
  'explore.results': 'Results',
  'explore.recipeCount': '{count} recipe|{count} recipes',
  'explore.empty':
    'No recipes match right now. Try other words, or clear some filters.',
  'explore.showAll': 'Show all',
  'explore.categories': 'Categories',
  'recipe.back': 'Back',
  'recipe.portions': 'Servings',
  'recipe.ingredients': 'Ingredients',
  'recipe.steps': 'Steps',
  'recipe.addShopping': 'Add to shopping list',
  'recipe.inShopping': 'On shopping list',
  'recipe.save': 'Save',
  'recipe.saved': 'Saved',
  'recipe.min': 'min',
  'recipe.servings': 'serving|servings',
  'pantry.title': 'What do you have at home?',
  'pantry.lead': 'Add what you have — we suggest matching dishes.',
  'pantry.placeholder': 'E.g. eggs, pasta, carrot',
  'pantry.add': 'Add',
  'pantry.matches': 'Suggestions',
  'pantry.empty': 'Add a few items to see matches.',
  'pantry.already': 'Already on the list.',
  'pantry.have': 'You have',
  'pantry.missing': 'Missing',
  'pantry.openRecipe': 'Open recipe',
  'pantry.matchAll': 'You have everything you need',
  'pantry.matchFew': 'You’re only missing {count} ingredient|{count} ingredients',
  'pantry.matchSome': 'You have {have} of {total} ingredients',
  'shopping.title': 'Shopping list',
  'shopping.empty': 'Your list is empty. Add from a recipe.',
  'shopping.clear': 'Clear list',
  'shopping.from': 'From',
  'favorites.title': 'Favorites',
  'favorites.empty': 'No saved recipes yet.',
  'favorites.folders': 'Folders',
  'favorites.loginHint': 'Sign in to save favorites and folders.',
  'tips.eyebrow': 'Field guide',
  'tips.title': 'Tips & tricks',
  'tips.lead':
    'Short, practical articles for small kitchens, camping stoves and trips — made to use, not skim.',
  'tips.empty': 'No tips published yet',
  'tips.read': 'Read article',
  'tips.more': 'More tips',
  'auth.title': 'Account',
  'auth.login': 'Log in',
  'auth.signup': 'Sign up',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.submitLogin': 'Log in',
  'auth.submitSignup': 'Create account',
  'auth.busy': 'Please wait…',
  'auth.logout': 'Log out',
  'auth.loggedInAs': 'Signed in as',
  'auth.language': 'Språk / Language',
  'auth.languageHint': 'Chooses language for menus, buttons and content.',
  'auth.feedback': 'Send feedback',
  'auth.howItWorks': 'How the app works',
  'auth.notifyRecipes': 'Notify me about new recipes',
  'auth.notifyHint':
    'When on, you can get notified about new recipes later (push).',
  'auth.backExplore': '← Back to explore',
  'auth.myFavorites': 'My favorites and folders',
  'auth.supabaseMissing':
    'Supabase is not set up yet. Paste keys in .env.local and restart Vite.',
  'lang.norsk': 'Norsk',
  'lang.english': 'English',
  'lang.chooseTitle': 'Choose language',
  'lang.chooseLead': 'Choose language / Velg språk',
  'lang.continue': 'Continue',
  'onboarding.next': 'Next',
  'onboarding.skip': 'Skip',
  'onboarding.start': 'Get started',
  'onboarding.prev': 'Back',
  'onboarding.replayHint': 'How the app works',
  'onboarding.previewHint': 'Preview — does not change your first-time status',
  'common.retry': 'Try again',
  'common.loading': 'Loading…',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.open': 'Open',
  'filter.time': 'Time',
  'filter.prep': 'Prep',
  'filter.ingredients': 'Ingredient count',
  'filter.storage': 'Storage',
  'filter.meal': 'Meal',
  'filter.price': 'Price',
  'filter.dishes': 'Dishes',
  'filter.stove': 'Camping stove',
  'filter.water': 'Water',
  'filter.apply': 'Apply filters',
  'filter.reset': 'Reset filters',
  'time.upTo20': '20 min or less',
  'time.21to30': '21–30',
  'time.31to40': '31–40',
  'time.41to60': '41–60',
  'prep.noCutting': 'No cutting',
  'prep.someCutting': 'Some cutting',
  'prep.morePrep': 'More prep',
  'ingCount.1to4': '1–4',
  'ingCount.5to6': '5–6',
  'ingCount.7to8': '7–8',
  'ingCount.moreThan8': 'More than 8',
  'storage.noCooling': 'No cooling needed',
  'storage.fewHoursOk': 'OK for a few hours without cooling',
  'storage.needsCooling': 'Needs cooling',
  'meal.breakfast': 'Breakfast',
  'meal.lunch': 'Lunch',
  'meal.dinner': 'Dinner',
  'price.cheap': 'Budget',
  'price.medium': 'Medium',
  'price.luxury': 'Luxury',
  'dishes.almostNothing': 'Almost nothing',
  'dishes.little': 'Little',
  'dishes.extra': 'A bit extra',
  'stove.perfect': 'Perfect on a camping stove',
  'stove.adaptable': 'Can adapt for camping stove',
  'stove.indoorBest': 'Best indoors, works on camping stove',
  'water.almostNone': 'Almost no water',
  'water.some': 'Some water',
  'water.lots': 'Needs lots of water',
  'cat.primus': 'Perfect for camping stove',
  'cat.few-ingredients': 'Few ingredients',
  'cat.quick': 'Short on time?',
  'cat.dinner': 'Dinner',
  'cat.breakfast': 'Breakfast',
  'cat.lunch': 'Lunch',
  'cat.dessert': 'Dessert',
  'spotify.open': 'Open in Spotify',
  'spotify.mood': 'Set the mood',
  'note.title': 'Note',
  'note.save': 'Save note',
  'note.placeholder': 'Private notes for yourself…',
  'feedback.title': 'Send feedback',
  'feedback.lead':
    'Tell us what works or is missing. This is not a private recipe note — Admin may read it to improve the product.',
  'feedback.type': 'Type',
  'feedback.message': 'Message',
  'feedback.send': 'Send',
  'feedback.sent': 'Sent. Thanks!',
  'empty.shopping': 'Shopping list is empty',
  'empty.favorites': 'No favorites yet',
  'empty.pantry': 'Nothing at home yet',
  'unit.g': 'g',
  'unit.kg': 'kg',
  'unit.ml': 'ml',
  'unit.dl': 'dl',
  'unit.l': 'l',
  'unit.stk': 'pcs',
  'unit.ss': 'tbsp',
  'unit.ts': 'tsp',
  'share.menu': 'Share recipe',
  'share.link': 'Share link',
  'share.pdf': 'Share as PDF',
  'share.makingPdf': 'Creating PDF…',
  'share.downloadPdf': 'Download PDF',
  'share.print': 'Print',
  'share.pdfFailed': 'Couldn’t create a PDF right now. Try again.',
  'share.linkCopied': 'Link copied',
  'share.retry': 'Try again',
}

const catalogs: Record<AppLocale, Catalog> = { no, en }

export type TranslateVars = Record<string, string | number>

/**
 * Simple plural: "one|other" with {count}.
 */
export function translate(
  locale: AppLocale,
  key: MessageKey,
  vars?: TranslateVars,
): string {
  let text = catalogs[locale][key] ?? catalogs.no[key] ?? key
  if (vars && 'count' in vars && text.includes('|')) {
    const [one, other] = text.split('|')
    text = Number(vars.count) === 1 ? one : (other ?? one)
  } else if (text.includes('|') && vars && 'count' in vars === false) {
    // non-count pipes unused — take first
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v))
    }
  }
  return text
}

export function getCatalog(locale: AppLocale): Catalog {
  return catalogs[locale]
}
