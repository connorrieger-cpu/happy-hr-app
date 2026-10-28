import { describe, expect, it } from 'vitest'
import { OSSINGTON, VENUES } from '../data/ossington'
import { SAMPLE_VENUES } from '../data/ossington.sample'
import { allOf, dealsOf, formatItem, formatSpecial, hasDeals, hasHappyHour, pinLabel, rankVenues } from './deals'
import type { Clock } from './time'

const fridayAfterWork: Clock = { day: 5, minutes: 17 * 60 + 30 }
const mondayAfternoon: Clock = { day: 1, minutes: 16 * 60 + 30 }
const ids = (rvs: { venue: { id: string } }[]) => rvs.map((rv) => rv.venue.id)

describe('rankVenues', () => {
  const now = rankVenues(VENUES, fridayAfterWork, OSSINGTON.origin)

  it('puts every venue with a happy hour in exactly one bucket', () => {
    expect(dealsOf(now).length).toBe(VENUES.filter(hasHappyHour).length)
    expect(allOf(now).length).toBe(VENUES.length)
  })

  it('sorts live happy hours nearest first', () => {
    const distances = now.live.map((rv) => rv.distanceM)
    expect(distances).toEqual([...distances].sort((a, b) => a - b))
  })

  it('sorts upcoming venues by start time', () => {
    const starts = now.later.map((rv) => ('startsIn' in rv.status ? rv.status.startsIn : 0))
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
  })

  it('filters to late-night spots', () => {
    const late = ids(allOf(rankVenues(VENUES, fridayAfterWork, OSSINGTON.origin, 'late')))
    expect(late).toContain('bar-libretto')
    expect(late).toContain('rhapsody')
    expect(late).toContain('central')
    expect(late).not.toContain('manita')
  })

  it('lists venues with no known happy hour separately, nearest first', () => {
    const quiet = { ...VENUES[0], id: 'no-hh', happyHours: [], deals: 'none' as const }
    const ranked = rankVenues([...VENUES, quiet], fridayAfterWork, OSSINGTON.origin)
    expect(ids(ranked.unlisted)).toContain('no-hh')
    expect(ids(dealsOf(ranked))).not.toContain('no-hh')
    const distances = ranked.unlisted.map((rv) => rv.distanceM)
    expect(distances).toEqual([...distances].sort((a, b) => a - b))
  })

  it('hides venues with no happy hour once a happy-hour filter is on', () => {
    for (const filter of ['drinks', 'food', 'ending', 'late'] as const) {
      expect(rankVenues(VENUES, fridayAfterWork, OSSINGTON.origin, filter).unlisted).toEqual([])
    }
  })

  it('keeps daily specials out of the happy-hour countdowns', () => {
    // Roxton has only daily specials; Tuesday at 6 PM its burger deal is on, but it has no timer.
    const tuesday6pm = rankVenues(VENUES, { day: 2, minutes: 18 * 60 }, OSSINGTON.origin)
    expect(ids(dealsOf(tuesday6pm))).not.toContain('roxton-public-house')
    expect(ids(tuesday6pm.unlisted)).toContain('roxton-public-house')
  })

  it('filters to spots with daily specials', () => {
    const daily = allOf(rankVenues(VENUES, fridayAfterWork, OSSINGTON.origin, 'daily'))
    expect(daily.length).toBeGreaterThan(5)
    expect(daily.every((rv) => (rv.venue.dailySpecials?.length ?? 0) > 0)).toBe(true)
  })
})

describe('real Ossington data', () => {
  it('matches the research acceptance check for a Monday at 4:30 PM', () => {
    const live = ids(rankVenues(VENUES, mondayAfternoon, OSSINGTON.origin).live)
    expect(live).toEqual(expect.arrayContaining(['azhar', 'central', 'manita']))
    // Bar Libretto is closed on Mondays.
    expect(live).not.toContain('bar-libretto')
  })

  it("finds Rhapsody's last-hour happy hour at 1:15 AM after a Friday night", () => {
    const saturday115am = rankVenues(VENUES, { day: 6, minutes: 75 }, OSSINGTON.origin)
    expect(ids(saturday115am.live)).toContain('rhapsody')
  })

  it('has no sample deals, and every venue with a deal cites a source', () => {
    for (const v of VENUES) {
      expect(v.deals).not.toBe('sample')
      if (hasDeals(v)) expect(v.sources?.length).toBeGreaterThan(0)
      else expect(v.deals).toBe('none')
    }
  })

  it('lists every restaurant and bar once, inside the area', () => {
    const { south, west, north, east } = OSSINGTON.bounds
    for (const v of VENUES) {
      expect(v.lat).toBeGreaterThan(south)
      expect(v.lat).toBeLessThan(north)
      expect(v.lng).toBeGreaterThan(west)
      expect(v.lng).toBeLessThan(east)
    }
    const places = VENUES.map((v) => v.googleMapsUrl).filter(Boolean)
    expect(new Set(places).size).toBe(places.length)
    expect(VENUES.length).toBeGreaterThan(75)
  })
})

describe('demo data', () => {
  it('is busy on a Friday at 5:30', () => {
    expect(rankVenues(SAMPLE_VENUES, fridayAfterWork, OSSINGTON.origin).live.length).toBeGreaterThan(8)
  })

  it('is all marked as sample', () => {
    expect(SAMPLE_VENUES.every((v) => v.deals === 'sample')).toBe(true)
  })
})

describe('labels', () => {
  it('formats specials and pin labels', () => {
    expect(formatSpecial({ kind: 'food', item: 'oysters', price: 2.5 })).toBe('$2.50 Oysters')
    expect(formatSpecial({ kind: 'food', item: 'Half-price meze' })).toBe('Half-Price Meze')
    expect(pinLabel({ days: [], start: 0, end: 1, specials: [{ kind: 'drink', item: 'pints', price: 6 }] })).toBe('$6 Pints')
  })

  it('writes deals as names', () => {
    expect(formatItem('house beer')).toBe('House Beer')
    expect(formatItem('shot of the day')).toBe('Shot of the Day')
    expect(formatItem('all-you-can-eat tacos (1 hour)')).toBe('All-You-Can-Eat Tacos (1 hour)')
    expect(formatItem('5 oz Terre dei Penati bianco or rosso')).toBe('5 oz Terre dei Penati Bianco or Rosso')
    expect(formatItem('OG Shaft on Draft')).toBe('OG Shaft on Draft')
    expect(formatItem('Burdock Ducks IPA')).toBe('Burdock Ducks IPA')
    expect(formatItem('$1/oz wine on tap')).toBe('$1/oz Wine on Tap')
    expect(formatItem('super-loaded nachos & a margarita')).toBe('Super-Loaded Nachos & a Margarita')
    expect(formatItem('martinis (classic, Vesper, espresso…)')).toBe('Martinis (classic, Vesper, espresso…)')
  })
})

describe('data', () => {
  it.each([
    ['real', VENUES],
    ['demo', SAMPLE_VENUES],
  ])('%s set has unique ids and sane windows', (_, venues) => {
    expect(new Set(venues.map((v) => v.id)).size).toBe(venues.length)
    for (const v of venues) {
      for (const w of v.happyHours) {
        expect(w.end).toBeGreaterThan(w.start)
        expect(w.specials.length).toBeGreaterThan(0)
      }
      for (const d of v.dailySpecials ?? []) {
        expect(d.days.length).toBeGreaterThan(0)
        expect(d.specials.length).toBeGreaterThan(0)
        expect(d.start == null).toBe(d.end == null)
        if (d.start != null) expect(d.end).toBeGreaterThan(d.start)
      }
    }
  })
})
