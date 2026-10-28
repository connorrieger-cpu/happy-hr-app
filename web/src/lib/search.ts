import { dailyLabel, dailyOn, dailyRunning, dailyToday } from './daily'
import { formatSpecial, hasDeals, hasHappyHour, type RankedVenue } from './deals'
import { DRINK_TYPES, drinkInfo, drinkTypesOf, servesDrink, type DrinkType } from './drinks'
import { allSpecials, FOOD_TYPES, foodInfo, servesFood, specialIsFood } from './food'
import { mightBeOpen } from './hours'
import { cheapestDeal, type PriceDeal } from './price'
import { DAY_SHORT, type Clock } from './time'
import type { FoodType, Special, Venue } from './types'
import { hasVibe, VIBES, vibeInfo, type VibeFilter } from './vibes'

// Search: what someone types, plus what they picked from the browse tiles (drinks, food,
// places) and when (on now, happy hours, daily specials). Typing is forgiving: accents,
// apostrophes and case don't matter ("anejo" finds Añejo), a word can be half typed
// ("marg") or have a typo ("tequilla"), and words for kinds of things work like the tiles
// ("beer", "music", "patio"). No React here.

export type When = 'any' | 'now' | 'happy' | 'daily'

export const WHENS: { id: When; label: string }[] = [
  { id: 'any', label: 'All' },
  { id: 'now', label: 'On now' },
  { id: 'happy', label: 'Happy hours' },
  { id: 'daily', label: 'Daily specials' },
]

export type SearchSort = 'nearest' | 'cheapest'

export interface SearchQuery {
  text: string
  when: When
  /** Any of these (beer or wine). */
  drinks: DrinkType[]
  /** Any of these (pizza or tacos). */
  food: FoodType[]
  /** All of these (a patio and sports on TV). */
  places: VibeFilter[]
  sort: SearchSort
}

export const EMPTY_QUERY: SearchQuery = { text: '', when: 'any', drinks: [], food: [], places: [], sort: 'nearest' }

/** Something picked from the browse tiles, shown as a token in the search bar. */
export type SearchToken = { group: 'drink'; id: DrinkType } | { group: 'food'; id: FoodType } | { group: 'place'; id: VibeFilter }

export const tokensOf = (q: SearchQuery): SearchToken[] => [
  ...q.drinks.map((id) => ({ group: 'drink' as const, id })),
  ...q.food.map((id) => ({ group: 'food' as const, id })),
  ...q.places.map((id) => ({ group: 'place' as const, id })),
]

export function tokenInfo(token: SearchToken): { label: string; emoji: string } {
  if (token.group === 'drink') return drinkInfo(token.id)
  if (token.group === 'food') return foodInfo(token.id)
  return vibeInfo(token.id)
}

/** The query with the token added, or taken away if it's already there. */
export function toggleToken(q: SearchQuery, token: SearchToken): SearchQuery {
  const flip = <T,>(list: T[], id: T) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  if (token.group === 'drink') return { ...q, drinks: flip(q.drinks, token.id) }
  if (token.group === 'food') return { ...q, food: flip(q.food, token.id) }
  return { ...q, places: flip(q.places, token.id) }
}

export const isEmptyQuery = (q: SearchQuery) => !q.text.trim() && q.when === 'any' && tokensOf(q).length === 0

/** Is there a drink or food to compare prices for, picked or typed ("beer")? Only then does "Cheapest first" mean anything. */
export const canSortByPrice = (q: SearchQuery) =>
  q.drinks.length > 0 || q.food.length > 0 || searchWords(q.text).filter(narrows).some((t) => conceptsFor(t).some((c) => c.group !== 'place'))

export interface SearchResult {
  rv: RankedVenue
  /** Why it matched or what's worth knowing, e.g. "$12 Cheeseburger · Tue". */
  note?: string
  /** On now: a live happy hour or a daily special running today. */
  on: boolean
  /** With "Cheapest first": the cheapest special matching the drinks or food asked for. */
  deal?: PriceDeal
}

// ---------- Words ----------

/** Lowercase words without accents or punctuation: "Añejo’s Café & Bar" → anejos, cafe, and, bar. */
export function searchWords(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/ß/g, 'ss')
    .replace(/[’'`]/g, '')
    .replace(/&/g, ' and ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/** Words that don't narrow anything down ("cheap beer near me" is about beer). */
const FILLER = new Set(
  'a an and or the of at in on to for with near me my some any best good great cheap cheapest deal deals special specials happy hour hours spot spots place places bar bars food drink drinks tonight today now'.split(
    ' ',
  ),
)

/** Edits (add, drop or change a letter, or swap two side by side) to turn one word into another. */
export function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

/** Typos forgiven in words nobody spells that way: none up to three letters, one from 4, two from 8. */
const typosAllowed = (length: number) => (length >= 8 ? 2 : length >= 4 ? 1 : 0)

/**
 * Does a typed word match this word? The start of it ("marg"), or (with `typos`) the word
 * with a typo or two.
 */
export function wordMatches(term: string, word: string, typos = true): boolean {
  if (word.startsWith(term)) return true
  const k = typos ? typosAllowed(term.length) : 0
  if (k === 0) return false
  if (Math.abs(word.length - term.length) <= k && editDistance(term, word) <= k) return true
  // A typo in a word still being typed: "margr" → "margaritas".
  return word.length > term.length && editDistance(term, word.slice(0, term.length)) <= k
}

// ---------- Kinds of things ----------

/** Words that mean a drink, food or kind of place, so typing them works like tapping the tile. */
const CONCEPTS: { token: SearchToken; words: string[] }[] = [
  { token: { group: 'drink', id: 'beer' }, words: ['beer', 'beers', 'pint', 'pints', 'lager', 'ipa', 'ale', 'draft', 'draught', 'pilsner', 'stout', 'cider', 'brewery', 'brewpub', 'taproom'] },
  { token: { group: 'drink', id: 'wine' }, words: ['wine', 'wines', 'vino', 'rose', 'sangria'] },
  { token: { group: 'drink', id: 'cocktail' }, words: ['cocktail', 'cocktails', 'martini', 'martinis', 'negroni', 'mojito', 'caesar', 'caesars', 'highball', 'mule', 'mixed'] },
  { token: { group: 'drink', id: 'tequila' }, words: ['tequila', 'mezcal', 'margarita', 'margaritas', 'marg', 'margs', 'paloma'] },
  { token: { group: 'drink', id: 'shot' }, words: ['shot', 'shots', 'shooter', 'shooters'] },
  { token: { group: 'drink', id: 'bubbly' }, words: ['bubbly', 'bubbles', 'prosecco', 'cava', 'champagne', 'sparkling', 'spritz', 'mimosa', 'mimosas', 'bellini', 'aperol'] },
  ...FOOD_TYPES.map((f) => ({
    token: { group: 'food' as const, id: f.id },
    words: [...new Set([...searchWords(f.label), ...f.words.flatMap(searchWords), ...searchWords(f.id)])].filter((w) => !FILLER.has(w)),
  })),
  { token: { group: 'place', id: 'patio' }, words: ['patio', 'patios', 'outdoor', 'outdoors', 'outside', 'terrace', 'courtyard'] },
  { token: { group: 'place', id: 'live-music' }, words: ['music', 'live', 'band', 'bands', 'concert', 'gig', 'gigs', 'jazz', 'dj', 'djs'] },
  { token: { group: 'place', id: 'sports' }, words: ['sports', 'sport', 'game', 'games', 'tv', 'hockey', 'basketball', 'football', 'soccer', 'baseball', 'leafs', 'raptors', 'jays', 'ufc'] },
  { token: { group: 'place', id: 'trivia' }, words: ['trivia', 'quiz'] },
  { token: { group: 'place', id: 'open-late' }, words: ['late', 'latenight', 'midnight'] },
  { token: { group: 'place', id: 'groups' }, words: ['group', 'groups', 'party', 'parties', 'birthday'] },
  { token: { group: 'place', id: 'dogs' }, words: ['dog', 'dogs', 'pup', 'puppy', 'pet'] },
  { token: { group: 'place', id: 'open-now' }, words: ['open'] },
]

const CONCEPT_WORDS = CONCEPTS.flatMap((c) => c.words)

/**
 * The kinds of things a typed word means: the word, a start of three letters or more, or
 * (with `typos`) the word with typos.
 */
export function conceptsFor(term: string, typos = true): SearchToken[] {
  const k = typos ? typosAllowed(term.length) : 0
  return CONCEPTS.filter(({ words }) => words.some((w) => w === term || (term.length >= 3 && w.startsWith(term)) || (k > 0 && editDistance(term, w) <= k))).map(
    (c) => c.token,
  )
}

const fits = (venue: Venue, token: SearchToken, clock: Clock): boolean =>
  token.group === 'drink' ? servesDrink(venue, token.id) : token.group === 'food' ? servesFood(venue, token.id) : hasVibe(venue, token.id, clock)

/** Does the special count as that drink or food (places have no specials)? */
const specialFits = (special: Special, token: SearchToken): boolean => {
  if (token.group === 'drink') return drinkTypesOf(special).includes(token.id)
  if (token.group === 'food') return specialIsFood(special, token.id)
  return false
}

// ---------- Matching ----------

const venueWords = new WeakMap<Venue, { all: string[]; name: string[] }>()

/** The venue's searchable words: name, kind of place, street, tags, food, specials. */
function wordsOf(venue: Venue): { all: string[]; name: string[] } {
  let words = venueWords.get(venue)
  if (!words) {
    const food = (venue.food ?? []).flatMap((f) => [foodInfo(f).label, ...foodInfo(f).words])
    const daily = (venue.dailySpecials ?? []).map((d) => d.title ?? '')
    const names = [venue.name, ...(venue.aka ?? [])].join(' ')
    const text = [names, venue.category, venue.address, ...venue.tags, ...food, ...daily, ...allSpecials(venue).map((s) => s.item)].join(' ')
    words = { all: [...new Set(searchWords(text))], name: searchWords(names) }
    venueWords.set(venue, words)
  }
  return words
}

/** "$12 Cheeseburger · Tue": the special with the day it runs on, for daily specials. */
function describe(venue: Venue, special: Special): string {
  const daily = (venue.dailySpecials ?? []).find((d) => d.specials.includes(special))
  const when = daily && daily.days.length < 7 ? ` · ${daily.days.map((d) => DAY_SHORT[d]).join(', ')}` : ''
  return formatSpecial(special) + when
}

/** A live happy hour, or a daily special running today at a spot that might be open. */
function isOn(rv: RankedVenue, clock: Clock): boolean {
  return rv.status.kind === 'live' || (dailyOn(rv.venue, clock.day).some((d) => dailyRunning(d, clock.minutes)) && mightBeOpen(rv.venue, clock))
}

function matchesWhen(rv: RankedVenue, when: When, clock: Clock): boolean {
  switch (when) {
    case 'any':
      return true
    case 'now':
      return isOn(rv, clock)
    case 'happy':
      return hasHappyHour(rv.venue)
    case 'daily':
      return (rv.venue.dailySpecials?.length ?? 0) > 0
  }
}

/** A word that narrows the search: not filler, not a lone letter or number (numbers only help names). */
const narrows = (term: string) => !FILLER.has(term) && !/^\d+$/.test(term) && term.length > 1

export function searchVenues(items: RankedVenue[], query: SearchQuery, clock: Clock): SearchResult[] {
  const typed = searchWords(query.text)
  const terms = typed.filter(narrows)
  // A word spelled like one the area or the app knows ("wings") is never a typo of another ("wines").
  const vocabulary = [...new Set([...CONCEPT_WORDS, ...items.flatMap((rv) => wordsOf(rv.venue).all)])]
  const typos = terms.map((t) => !vocabulary.some((w) => w.startsWith(t)))
  const termConcepts = terms.map((t, i) => conceptsFor(t, typos[i]))
  // Names also match on numbers ("400 Brant").
  const nameWords = typed.filter((t) => t.length > 1 && !FILLER.has(t))
  const nameTypos = nameWords.map((t) => !vocabulary.some((w) => w.startsWith(t)))
  const picked: SearchToken[] = [...query.drinks.map((id) => ({ group: 'drink' as const, id })), ...query.food.map((id) => ({ group: 'food' as const, id }))]
  // Specials worth naming (and pricing): ones for the drinks or food picked or typed.
  const dealTokens = [...picked, ...termConcepts.flat().filter((t) => t.group !== 'place')]
  const dealFits = (s: Special) => dealTokens.some((t) => specialFits(s, t))

  const results: (SearchResult & { tier: number })[] = []
  for (const rv of items) {
    const { venue } = rv
    if (!matchesWhen(rv, query.when, clock)) continue
    if (query.drinks.length && !query.drinks.some((d) => servesDrink(venue, d))) continue
    if (query.food.length && !query.food.some((f) => servesFood(venue, f))) continue
    if (!query.places.every((p) => hasVibe(venue, p, clock))) continue

    const words = wordsOf(venue)
    // Every typed word has to match: a word at the spot, or a kind of thing the spot is.
    const textHits = terms.map((t, i) => words.all.some((w) => wordMatches(t, w, typos[i])))
    if (!terms.every((_, i) => textHits[i] || termConcepts[i].some((c) => fits(venue, c, clock)))) continue

    const nameMatch = nameWords.length > 0 && nameWords.every((t, i) => words.name.some((w) => wordMatches(t, w, nameTypos[i])))

    // Say why it matched: a special mentioning the words typed ("oysters"), else one for the drink or food asked for.
    const specials = allSpecials(venue)
    const literal = terms.length > 0 ? specials.find((s) => terms.some((t, i) => searchWords(s.item).some((w) => wordMatches(t, w, typos[i])))) : undefined
    const matched = literal ?? (dealTokens.length > 0 ? specials.find(dealFits) : undefined)
    const today = dailyToday(venue, clock)
    const firstDaily = venue.dailySpecials?.[0]
    let note: string | undefined
    if (matched) note = describe(venue, matched)
    else if (today && (query.when === 'daily' || !hasHappyHour(venue))) note = `Today: ${dailyLabel(today)}`
    else if (query.when === 'daily' && firstDaily) note = `${dailyLabel(firstDaily)} · ${firstDaily.days.map((d) => DAY_SHORT[d]).join(', ')}`

    const on = isOn(rv, clock)
    const deal = query.sort === 'cheapest' && dealTokens.length > 0 ? cheapestDeal(rv, dealFits, clock) : undefined
    // Names first; then deals that say what was typed; then deals for what was asked; then on now, any deal, the rest.
    const tier =
      (nameMatch ? 0 : 1000) + (terms.length > 0 && !literal ? 100 : 0) + (dealTokens.length > 0 && !specials.some(dealFits) ? 10 : 0) + (on ? 0 : hasDeals(venue) ? 1 : 2)
    results.push({ rv, note, on, ...(deal && { deal }), tier })
  }

  const nearest = (a: (typeof results)[number], b: (typeof results)[number]) => a.tier - b.tier || a.rv.distanceM - b.rv.distanceM
  const cheapest = (a: (typeof results)[number], b: (typeof results)[number]) =>
    a.deal && b.deal ? a.deal.price - b.deal.price || Number(b.deal.on) - Number(a.deal.on) || a.rv.distanceM - b.rv.distanceM : a.deal ? -1 : b.deal ? 1 : nearest(a, b)
  return results.sort(query.sort === 'cheapest' ? cheapest : nearest).map(({ tier: _tier, ...r }) => r)
}

// ---------- Browsing ----------

export interface BrowseOption {
  token: SearchToken
  label: string
  emoji: string
  /** How many spots in the area it finds. */
  count: number
}

/**
 * The browse tiles for these spots: drinks and places in their usual order, food with the
 * most common first. Anything nothing here matches is left out, so each area only offers
 * what it has.
 */
export function browseOptions(items: RankedVenue[], clock: Clock): { drinks: BrowseOption[]; food: BrowseOption[]; places: BrowseOption[] } {
  const venues = items.map((rv) => rv.venue)
  const option = (token: SearchToken): BrowseOption => ({ token, ...tokenInfo(token), count: venues.filter((v) => fits(v, token, clock)).length })
  const some = (o: BrowseOption) => o.count > 0
  return {
    drinks: DRINK_TYPES.map((d) => option({ group: 'drink', id: d.id })).filter(some),
    food: FOOD_TYPES.map((f) => option({ group: 'food', id: f.id }))
      .filter(some)
      .sort((a, b) => b.count - a.count),
    places: VIBES.map((v) => option({ group: 'place', id: v.id })).filter(some),
  }
}
