import { describe, expect, it } from 'vitest'
import { OSSINGTON, VENUES } from '../data/ossington'
import { allOf, rankVenues } from './deals'
import { drinkTypesOf, servesDrink } from './drinks'
import { foodTypesIn, servesFood } from './food'
import { browseOptions, conceptsFor, EMPTY_QUERY, searchVenues, searchWords, toggleToken, wordMatches, type SearchQuery } from './search'
import type { Clock } from './time'

const tuesday6pm: Clock = { day: 2, minutes: 18 * 60 }
const items = allOf(rankVenues(VENUES, tuesday6pm, OSSINGTON.origin))
const q = (patch: Partial<SearchQuery>): SearchQuery => ({ ...EMPTY_QUERY, ...patch })
const ids = (query: SearchQuery) => searchVenues(items, query, tuesday6pm).map((r) => r.rv.venue.id)
const venue = (id: string) => VENUES.find((v) => v.id === id)!

describe('search words', () => {
  it('ignores accents, apostrophes, case and punctuation', () => {
    expect(searchWords('Côte de Bœuf')).toEqual(['cote', 'de', 'boeuf'])
    expect(searchWords('Sneaky Dee’s')).toEqual(['sneaky', 'dees'])
    expect(searchWords('Phở Hưng & Bar')).toEqual(['pho', 'hung', 'and', 'bar'])
    expect(searchWords('NAZARÉ')).toEqual(['nazare'])
  })

  it('matches the start of a word, or a word with a typo', () => {
    expect(wordMatches('marg', 'margaritas')).toBe(true)
    expect(wordMatches('tequilla', 'tequila')).toBe(true)
    expect(wordMatches('margr', 'margaritas')).toBe(true)
    expect(wordMatches('ossignton', 'ossington')).toBe(true)
    expect(wordMatches('bar', 'beer')).toBe(false)
    // Off when the word is spelled right (search turns it off for words it knows).
    expect(wordMatches('wine', 'wings', false)).toBe(false)
    expect(wordMatches('wngs', 'wings')).toBe(true)
  })

  it('knows words for kinds of things', () => {
    expect(conceptsFor('beer')).toContainEqual({ group: 'drink', id: 'beer' })
    expect(conceptsFor('pints')).toContainEqual({ group: 'drink', id: 'beer' })
    expect(conceptsFor('music')).toContainEqual({ group: 'place', id: 'live-music' })
    expect(conceptsFor('musik')).toContainEqual({ group: 'place', id: 'live-music' })
    expect(conceptsFor('tv')).toContainEqual({ group: 'place', id: 'sports' })
    expect(conceptsFor('margaritas')).toContainEqual({ group: 'drink', id: 'tequila' })
    expect(conceptsFor('pizza')).toContainEqual({ group: 'food', id: 'pizza' })
  })
})

describe('drink types', () => {
  it('sorts specials into drink types, some into two', () => {
    expect(drinkTypesOf({ kind: 'drink', item: 'margaritas' })).toEqual(['cocktail', 'tequila'])
    expect(drinkTypesOf({ kind: 'drink', item: 'tequila shots' })).toEqual(['tequila', 'shot'])
    expect(drinkTypesOf({ kind: 'drink', item: 'Rosé' })).toEqual(['wine'])
    expect(drinkTypesOf({ kind: 'drink', item: 'Aperol spritz' })).toEqual(['cocktail', 'bubbly'])
    expect(drinkTypesOf({ kind: 'drink', item: 'Red Stripe, Dragon Stout or Heineken' })).toEqual(['beer'])
    expect(drinkTypesOf({ kind: 'food', item: 'beer-battered fish' })).toEqual([])
  })

  it('counts the kind of place too', () => {
    const brewery = VENUES.find((v) => v.vibe === 'brewery')
    if (brewery) expect(servesDrink(brewery, 'beer')).toBe(true)
  })
})

describe('search', () => {
  it('lists every spot when nothing is entered', () => {
    expect(ids(q({}))).toHaveLength(VENUES.length)
  })

  it('finds burger deals by the word, and says what the deal is', () => {
    const roxton = searchVenues(items, q({ text: 'burger' }), tuesday6pm).find((r) => r.rv.venue.id === 'roxton-public-house')
    expect(roxton?.note).toBe('$12 Cheeseburger · Tue')
  })

  it('puts a name match first, typos and accents included', () => {
    expect(ids(q({ text: 'union' }))[0]).toBe('union')
    expect(ids(q({ text: 'unoin' }))[0]).toBe('union')
    const first = (text: string) => searchVenues(items, q({ text }), tuesday6pm)[0]?.rv.venue.name.normalize('NFC')
    expect(first('cote de boeuf')).toBe('Côte de Bœuf'.normalize('NFC'))
    expect(first('nazare')).toBe('Nazaré Snack Bar'.normalize('NFC'))
  })

  it('treats "beer" and "music" like the tiles', () => {
    const beer = ids(q({ text: 'beer' }))
    // The same spots as the Beer tile (plus any named for beer), led by ones whose specials say beer.
    expect([...ids(q({ drinks: ['beer'] }))].sort()).toEqual(expect.arrayContaining([...beer].filter((id) => servesDrink(venue(id), 'beer')).sort()))
    expect(ids(q({ drinks: ['beer'] })).every((id) => beer.includes(id))).toBe(true)
    expect(beer.length).toBeGreaterThan(10)
    const music = ids(q({ text: 'music' }))
    expect(music.length).toBeGreaterThan(0)
    expect(music.every((id) => venue(id).amenities?.includes('live-music') || /music/i.test(`${venue(id).category} ${venue(id).tags.join(' ')}`))).toBe(true)
  })

  it('ignores filler words', () => {
    expect(ids(q({ text: 'cheap beer near me' }))).toEqual(ids(q({ text: 'beer' })))
  })

  it('filters by picks: any of the drinks or food, all of the places', () => {
    const pizza = ids(q({ food: ['pizza'] }))
    expect(pizza).toEqual(expect.arrayContaining(['bar-libretto', 'bar-poet', 'gracies-pizza']))
    expect(servesFood(venue('roxton-public-house'), 'burgers')).toBe(true)
    const either = ids(q({ food: ['pizza', 'tacos'] }))
    expect(either.length).toBeGreaterThanOrEqual(pizza.length)
    const both = ids(q({ places: ['patio', 'open-late'] }))
    expect(both.every((id) => ids(q({ places: ['patio'] })).includes(id))).toBe(true)
  })

  it('filters by when', () => {
    const daily = ids(q({ when: 'daily' }))
    expect(daily).toContain('roxton-public-house')
    expect(daily.every((id) => (venue(id).dailySpecials?.length ?? 0) > 0)).toBe(true)
    const now = searchVenues(items, q({ when: 'now' }), tuesday6pm)
    expect(now.every((r) => r.on)).toBe(true)
  })

  it('sorts by the cheapest matching special', () => {
    const results = searchVenues(items, q({ drinks: ['beer'], sort: 'cheapest' }), tuesday6pm)
    const prices = results.flatMap((r) => (r.deal ? [r.deal.price] : []))
    expect(prices.length).toBeGreaterThan(3)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
    // Spots with a price come first.
    const firstWithout = results.findIndex((r) => !r.deal)
    expect(results.slice(firstWithout === -1 ? results.length : firstWithout).every((r) => !r.deal)).toBe(true)
  })

  it('toggles tokens', () => {
    const one = toggleToken(EMPTY_QUERY, { group: 'drink', id: 'beer' })
    expect(one.drinks).toEqual(['beer'])
    expect(toggleToken(one, { group: 'drink', id: 'beer' }).drinks).toEqual([])
  })

  it('only offers tiles that find something', () => {
    const { drinks, food, places } = browseOptions(items, tuesday6pm)
    expect(drinks.map((d) => d.token.id)).toContain('beer')
    expect([...drinks, ...food, ...places].every((o) => o.count > 0)).toBe(true)
    expect(food.map((f) => f.count)).toEqual([...food.map((f) => f.count)].sort((a, b) => b - a))
    expect(foodTypesIn(VENUES).length).toBe(food.length)
  })
})
