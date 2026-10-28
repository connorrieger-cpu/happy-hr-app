import { allSpecials } from './food'
import type { Special, Venue } from './types'

// Drink types for search: Beer, Wine, Cocktails, Tequila & mezcal, Shots, Bubbly & spritz.
// A special can be more than one ("margaritas" are cocktails and tequila; "tequila shots"
// are shots and tequila). A venue serves a type when one of its drink specials is that
// type, or when it's that kind of place (a brewery pours beer, a wine bar wine).

export type DrinkType = 'beer' | 'wine' | 'cocktail' | 'tequila' | 'shot' | 'bubbly'

export interface DrinkTypeInfo {
  id: DrinkType
  label: string
  emoji: string
}

export const DRINK_TYPES: DrinkTypeInfo[] = [
  { id: 'beer', label: 'Beer', emoji: '🍺' },
  { id: 'wine', label: 'Wine', emoji: '🍷' },
  { id: 'cocktail', label: 'Cocktails', emoji: '🍸' },
  { id: 'tequila', label: 'Tequila & mezcal', emoji: '🌵' },
  { id: 'shot', label: 'Shots', emoji: '🥃' },
  { id: 'bubbly', label: 'Bubbly & spritz', emoji: '🥂' },
]

const BY_ID = new Map(DRINK_TYPES.map((d) => [d.id, d]))
export const drinkInfo = (id: DrinkType) => BY_ID.get(id)!

/** The wording that makes a special each type, on accent-free lowercase text. */
const WORDS: Record<DrinkType, RegExp> = {
  beer: /\b(beers?|pints?|lagers?|ipas?|ales?|drafts?|draughts?|cans?|tall ?cans?|tallboys?|pilsners?|stouts?|ciders?|pitchers?|buckets?|schooners?|sleeman|budweiser|bud light|coors|canadian|corona|modelo|stella|heineken|peroni|guinness|sapporo|asahi|kronenbourg|michelob|moosehead|pbr|beau s|burdock|creemore|wellington)\b/,
  wine: /\b(wines?|vino|rose|vqa|sangria|pinot|merlot|cabernet|chardonnay|sauvignon|riesling|malbec|sommelier)\b/,
  cocktail: /\b(cocktails?|martinis?|negronis?|old fashioneds?|mojitos?|caesars?|highballs?|mules?|margaritas?|margs?|palomas?|sangria|spritz(es)?|mimosas?|bellinis?|daiquiris?|sours?|mixed drinks?|rail drinks?|bar rail|aperitivo)\b/,
  tequila: /\b(tequilas?|mezcals?|margaritas?|margs?|palomas?|mezcalitas?|patron|don julio|casamigos|el jimador|hornitos|jose cuervo)\b/,
  shot: /\b(shots?|shooters?|jager|jagerbombs?)\b/,
  bubbly: /\b(bubbly|bubbles|prosecco|cava|champagne|sparkling|spritz(es)?|mimosas?|bellinis?|aperol|hugo)\b/,
}

/** What kind of place pours what, from the venue's vibe and category. */
const PLACE: Partial<Record<DrinkType, RegExp>> = {
  beer: /\b(brew\w*|beer|taproom|tap room|pub|tavern|alehouse|gastropub|beer hall|beer garden)\b/,
  wine: /\b(wine|enoteca|vino)\b/,
  cocktail: /\b(cocktails?|lounge|speakeasy|mixology)\b/,
  tequila: /\b(tequila|mezcal|cantina)\b/,
}

/** Lowercase, accents and curly apostrophes gone, so "rosé" and "rose" read the same. */
const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')

/** Every drink type a special is, in list order (none for food). */
export function drinkTypesOf(special: Special): DrinkType[] {
  if (special.kind !== 'drink') return []
  const item = plain(special.item)
  return DRINK_TYPES.filter((d) => WORDS[d.id].test(item)).map((d) => d.id)
}

/** The first drink special of this type, if any. */
export function drinkSpecial(venue: Venue, type: DrinkType): Special | undefined {
  return allSpecials(venue).find((s) => drinkTypesOf(s).includes(type))
}

export function servesDrink(venue: Venue, type: DrinkType): boolean {
  if (drinkSpecial(venue, type)) return true
  if (type === 'beer' && venue.vibe === 'brewery') return true
  if (type === 'wine' && venue.vibe === 'wine') return true
  if (type === 'cocktail' && venue.vibe === 'cocktails') return true
  const place = PLACE[type]
  return place ? place.test(plain(venue.category)) : false
}
