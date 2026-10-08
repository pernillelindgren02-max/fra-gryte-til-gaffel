import type { AppLocale } from './types'

/** Flat UI catalog — scalable keys, no scattered conditionals. */
export type MessageKey =
  | 'nav.explore'
  | 'nav.home'
  | 'nav.fridge'
  | 'nav.shopping'
  | 'nav.favorites'
  | 'nav.tips'
  | 'nav.account'
  | 'nav.backToApp'
  | 'nav.backToExplore'
  | 'explore.tagline'
  | 'explore.searchPlaceholder'
  | 'explore.filters'
  | 'explore.clearFilters'
  | 'explore.clearAll'
  | 'explore.filterRecipes'
  | 'explore.closeFilters'
  | 'explore.showResults'
  | 'explore.results'
  | 'explore.recipeCount'
  | 'explore.empty'
  | 'explore.showAll'
  | 'explore.categories'
  | 'explore.fridgeFilter'
  | 'explore.fridgeFilterOn'
  | 'explore.fridgeFilterEmpty'
  | 'explore.fridgeExclude'
  | 'explore.chooseFromFridge'
  | 'explore.ingredientFilterLead'
  | 'explore.selectedIngredients'
  | 'recipe.back'
  | 'recipe.portions'
  | 'recipe.ingredients'
  | 'recipe.steps'
  | 'recipe.addShopping'
  | 'recipe.addMissing'
  | 'recipe.inShopping'
  | 'recipe.inShoppingPortions'
  | 'recipe.save'
  | 'recipe.saved'
  | 'recipe.min'
  | 'recipe.servings'
  | 'recipe.fridgeMatch'
  | 'recipe.owned'
  | 'recipe.notOwned'
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
  | 'fridge.title'
  | 'fridge.lead'
  | 'fridge.ingredient'
  | 'fridge.yourItems'
  | 'fridge.clearAll'
  | 'fridge.remove'
  | 'fridge.empty'
  | 'fridge.noSuggest'
  | 'fridge.selected'
  | 'fridge.openAria'
  | 'fridge.quantity'
  | 'fridge.unit'
  | 'fridge.quantityOptional'
  | 'fridge.editAmount'
  | 'fridge.clearAmount'
  | 'fridge.unit.stk'
  | 'fridge.unit.g'
  | 'fridge.unit.kg'
  | 'fridge.unit.ml'
  | 'fridge.unit.dl'
  | 'fridge.unit.l'
  | 'shopping.title'
  | 'shopping.empty'
  | 'shopping.clear'
  | 'shopping.from'
  | 'shopping.addedToast'
  | 'shopping.bagAdd'
  | 'shopping.bagOpenExisting'
  | 'shopping.fewerPortions'
  | 'shopping.morePortions'
  | 'shopping.helperUnknown'
  | 'shopping.helperPartial'
  | 'shopping.helperPartialPlural'
  | 'shopping.helperEnough'
  | 'recipe.coverageUnknown'
  | 'recipe.coveragePartial'
  | 'recipe.coverageEnough'
  | 'recipe.coverageAbsent'
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
  | 'tips.searchLabel'
  | 'tips.searchPlaceholder'
  | 'tips.topics'
  | 'tips.applyTopics'
  | 'tips.closeTopics'
  | 'tips.clearFilters'
  | 'tips.removeTopic'
  | 'tips.noMatch'
  | 'tips.results'
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
  | 'auth.sectionLanguage'
  | 'auth.sectionYourApp'
  | 'auth.sectionNotifications'
  | 'auth.sectionAdmin'
  | 'auth.backToAdmin'
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
  'nav.home': 'Kjøleskap',
  'nav.fridge': 'Kjøleskap',
  'nav.shopping': 'Handleliste',
  'nav.favorites': 'Favoritter',
  'nav.tips': 'Tips',
  'nav.account': 'Konto',
  'nav.backToApp': 'Tilbake til appen',
  'nav.backToExplore': 'Tilbake til Utforsk',
  'explore.tagline': 'En gryte unna noe godt',
  'explore.searchPlaceholder': 'Søk etter oppskrift eller ingrediens',
  'explore.filters': 'Filtre',
  'explore.clearFilters': 'Nullstill',
  'explore.clearAll': 'Fjern alle',
  'explore.filterRecipes': 'Filtrer oppskrifter',
  'explore.closeFilters': 'Lukk filtre',
  'explore.showResults': 'Vis resultater',
  'explore.results': 'Resultater',
  'explore.recipeCount': '{count} oppskrift|{count} oppskrifter',
  'explore.empty':
    'Ingen oppskrifter matcher akkurat nå. Prøv andre ord, eller fjern noen filtre.',
  'explore.showAll': 'Vis alle',
  'explore.categories': 'Kategorier',
  'explore.fridgeFilter': 'Hva har du hjemme?',
  'explore.fridgeFilterOn': 'Kjøleskap på',
  'explore.fridgeFilterEmpty':
    'Kjøleskapet er tomt. Legg inn varer under Kjøleskap, eller skru av filteret.',
  'explore.fridgeExclude': 'Ikke bruk',
  'explore.chooseFromFridge': 'Velg fra Kjøleskap',
  'explore.ingredientFilterLead':
    'Velg ingredienser for dette søket — midlertidig, endrer ikke Kjøleskapet.',
  'explore.selectedIngredients': 'Valgte ingredienser',
  'recipe.back': 'Tilbake',
  'recipe.portions': 'Porsjoner',
  'recipe.ingredients': 'Ingredienser',
  'recipe.steps': 'Fremgangsmåte',
  'recipe.addShopping': 'Legg i handleliste',
  'recipe.addMissing': 'Legg manglende i handleliste',
  'recipe.inShopping': 'I handlelisten',
  'recipe.inShoppingPortions':
    'I handlelisten · {count} porsjon|I handlelisten · {count} porsjoner',
  'recipe.save': 'Lagre',
  'recipe.saved': 'Lagret',
  'recipe.min': 'min',
  'recipe.servings': 'porsjon|porsjoner',
  'recipe.fridgeMatch': 'Du har {have} av {total}',
  'recipe.owned': 'Har',
  'recipe.notOwned': 'Mangler',
  'pantry.title': 'Kjøleskap',
  'pantry.lead': 'Legg inn det du har — brukes i Utforsk og på oppskrifter.',
  'pantry.placeholder': 'F.eks. egg, pasta, gulrot',
  'pantry.add': 'Legg til',
  'pantry.matches': 'Forslag',
  'pantry.empty': 'Ingen ingredienser ennå.',
  'pantry.already': 'Allerede i listen.',
  'pantry.have': 'Du har',
  'pantry.missing': 'Mangler',
  'pantry.openRecipe': 'Åpne oppskrift',
  'pantry.matchAll': 'Du har alt du trenger',
  'pantry.matchFew': 'Du mangler bare {count} ingrediens|{count} ingredienser',
  'pantry.matchSome': 'Du har {have} av {total} ingredienser',
  'fridge.title': 'Kjøleskap',
  'fridge.lead': 'Legg inn det du har hjemme. Listen brukes i Utforsk og på oppskrifter.',
  'fridge.ingredient': 'Ingrediens',
  'fridge.yourItems': 'Dine ingredienser',
  'fridge.clearAll': 'Tøm alt',
  'fridge.remove': 'Fjern',
  'fridge.empty':
    'Ingen ingredienser ennå. Skriv inn noe du har — for eksempel egg eller gulrot — og trykk Legg til.',
  'fridge.noSuggest': 'Ingen ingredienser funnet',
  'fridge.selected': 'Valgt',
  'fridge.openAria': 'Åpne kjøleskap',
  'fridge.quantity': 'Mengde',
  'fridge.unit': 'Enhet',
  'fridge.quantityOptional': 'Mengde (valgfritt)',
  'fridge.editAmount': 'Endre mengde',
  'fridge.clearAmount': 'Fjern mengde',
  'fridge.unit.stk': 'stk',
  'fridge.unit.g': 'g',
  'fridge.unit.kg': 'kg',
  'fridge.unit.ml': 'ml',
  'fridge.unit.dl': 'dl',
  'fridge.unit.l': 'l',
  'shopping.title': 'Handleliste',
  'shopping.empty': 'Handlelisten er tom. Legg til fra en oppskrift.',
  'shopping.clear': 'Tøm listen',
  'shopping.from': 'Fra',
  'shopping.addedToast': 'Lagt til i handlelisten',
  'shopping.bagAdd': 'Legg i handleliste',
  'shopping.bagOpenExisting': 'Åpne i handlelisten',
  'shopping.fewerPortions': 'Færre porsjoner',
  'shopping.morePortions': 'Flere porsjoner',
  'shopping.helperUnknown': 'Har du nok hjemme?',
  'shopping.helperPartial':
    'Du har {have} · oppskriften krever {need}',
  'shopping.helperPartialPlural':
    'Du har {have} · oppskriftene krever {need}',
  'shopping.helperEnough': 'Du har nok hjemme',
  'recipe.coverageUnknown': 'Har du nok hjemme?',
  'recipe.coveragePartial': 'Du har {have} · oppskriften krever {need}',
  'recipe.coverageEnough': 'Du har nok hjemme',
  'recipe.coverageAbsent': 'Mangler',
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
  'tips.searchLabel': 'Søk',
  'tips.searchPlaceholder': 'Søk i tips og triks',
  'tips.topics': 'Emner',
  'tips.applyTopics': 'Vis tips',
  'tips.closeTopics': 'Lukk emner',
  'tips.clearFilters': 'Fjern alle',
  'tips.removeTopic': 'Fjern',
  'tips.noMatch': 'Ingen tips passer søket ditt.',
  'tips.results': 'Resultater',
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
  'auth.sectionLanguage': 'Språk',
  'auth.sectionYourApp': 'Din app',
  'auth.sectionNotifications': 'Varsler',
  'auth.sectionAdmin': 'Administrasjon',
  'auth.backToAdmin': 'Tilbake til admin',
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
  'nav.home': 'Fridge',
  'nav.fridge': 'Fridge',
  'nav.shopping': 'Shopping list',
  'nav.favorites': 'Favorites',
  'nav.tips': 'Tips',
  'nav.account': 'Account',
  'nav.backToApp': 'Back to app',
  'nav.backToExplore': 'Back to Explore',
  'explore.tagline': 'One pot away from something good',
  'explore.searchPlaceholder': 'Search recipes or ingredients',
  'explore.filters': 'Filters',
  'explore.clearFilters': 'Clear',
  'explore.clearAll': 'Clear all',
  'explore.filterRecipes': 'Filter recipes',
  'explore.closeFilters': 'Close filters',
  'explore.showResults': 'Show results',
  'explore.results': 'Results',
  'explore.recipeCount': '{count} recipe|{count} recipes',
  'explore.empty':
    'No recipes match right now. Try other words, or clear some filters.',
  'explore.showAll': 'Show all',
  'explore.categories': 'Categories',
  'explore.fridgeFilter': 'What do you have at home?',
  'explore.fridgeFilterOn': 'Fridge on',
  'explore.fridgeFilterEmpty':
    'Your fridge is empty. Add items under Fridge, or turn the filter off.',
  'explore.fridgeExclude': 'Skip',
  'explore.chooseFromFridge': 'Choose from Fridge',
  'explore.ingredientFilterLead':
    'Pick ingredients for this search — temporary, does not change your Fridge.',
  'explore.selectedIngredients': 'Selected ingredients',
  'recipe.back': 'Back',
  'recipe.portions': 'Servings',
  'recipe.ingredients': 'Ingredients',
  'recipe.steps': 'Steps',
  'recipe.addShopping': 'Add to shopping list',
  'recipe.addMissing': 'Add missing to shopping list',
  'recipe.inShopping': 'On shopping list',
  'recipe.inShoppingPortions':
    'On shopping list · {count} serving|On shopping list · {count} servings',
  'recipe.save': 'Save',
  'recipe.saved': 'Saved',
  'recipe.min': 'min',
  'recipe.servings': 'serving|servings',
  'recipe.fridgeMatch': 'You have {have} of {total}',
  'recipe.owned': 'Have',
  'recipe.notOwned': 'Need',
  'pantry.title': 'Fridge',
  'pantry.lead': 'Add what you have — used in Explore and on recipes.',
  'pantry.placeholder': 'E.g. eggs, pasta, carrot',
  'pantry.add': 'Add',
  'pantry.matches': 'Suggestions',
  'pantry.empty': 'No ingredients yet.',
  'pantry.already': 'Already on the list.',
  'pantry.have': 'You have',
  'pantry.missing': 'Missing',
  'pantry.openRecipe': 'Open recipe',
  'pantry.matchAll': 'You have everything you need',
  'pantry.matchFew': 'You’re only missing {count} ingredient|{count} ingredients',
  'pantry.matchSome': 'You have {have} of {total} ingredients',
  'fridge.title': 'Fridge',
  'fridge.lead':
    'Add what you have at home. This list is used in Explore and on recipes.',
  'fridge.ingredient': 'Ingredient',
  'fridge.yourItems': 'Your ingredients',
  'fridge.clearAll': 'Clear all',
  'fridge.remove': 'Remove',
  'fridge.empty':
    'No ingredients yet. Type something you have — e.g. eggs or carrot — and tap Add.',
  'fridge.noSuggest': 'No ingredients found',
  'fridge.selected': 'Selected',
  'fridge.openAria': 'Open fridge',
  'fridge.quantity': 'Quantity',
  'fridge.unit': 'Unit',
  'fridge.quantityOptional': 'Quantity (optional)',
  'fridge.editAmount': 'Edit amount',
  'fridge.clearAmount': 'Clear amount',
  'fridge.unit.stk': 'pcs',
  'fridge.unit.g': 'g',
  'fridge.unit.kg': 'kg',
  'fridge.unit.ml': 'ml',
  'fridge.unit.dl': 'dl',
  'fridge.unit.l': 'l',
  'shopping.title': 'Shopping list',
  'shopping.empty': 'Your list is empty. Add from a recipe.',
  'shopping.clear': 'Clear list',
  'shopping.from': 'From',
  'shopping.addedToast': 'Added to shopping list',
  'shopping.bagAdd': 'Add to shopping list',
  'shopping.bagOpenExisting': 'Open on shopping list',
  'shopping.fewerPortions': 'Fewer servings',
  'shopping.morePortions': 'More servings',
  'shopping.helperUnknown': 'Do you have enough at home?',
  'shopping.helperPartial':
    'You have {have} · the recipe needs {need}',
  'shopping.helperPartialPlural':
    'You have {have} · the recipes need {need}',
  'shopping.helperEnough': 'You have enough at home',
  'recipe.coverageUnknown': 'Do you have enough at home?',
  'recipe.coveragePartial': 'You have {have} · the recipe needs {need}',
  'recipe.coverageEnough': 'You have enough at home',
  'recipe.coverageAbsent': 'Missing',
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
  'tips.searchLabel': 'Search',
  'tips.searchPlaceholder': 'Search tips & tricks',
  'tips.topics': 'Topics',
  'tips.applyTopics': 'Show tips',
  'tips.closeTopics': 'Close topics',
  'tips.clearFilters': 'Clear all',
  'tips.removeTopic': 'Remove',
  'tips.noMatch': 'No tips match your search.',
  'tips.results': 'Results',
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
  'auth.sectionLanguage': 'Language',
  'auth.sectionYourApp': 'Your app',
  'auth.sectionNotifications': 'Notifications',
  'auth.sectionAdmin': 'Administration',
  'auth.backToAdmin': 'Back to admin',
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
