import { describe, expect, it } from 'vitest'
import { OSSINGTON, VENUES } from '../data/ossington'
import { allOf, rankVenues } from './deals'
import { favouriteLines, startingSoon } from './favourites'
import { freshness } from './freshness'
import { isOpenLate, openLabel, openState, weekHours } from './hours'
import { cheapestDeal, singlePrice } from './price'
import { reminderIcs, reminderPlan } from './reminders'
import { meetOptions, parseLink, previewText, shareMessage, venueLink } from './share'
import type { Clock } from './time'
import type { Venue } from './types'
import { hasVibe, venueVibes } from './vibes'

// The v2 features: opening hours, vibes, prices, freshness, reminders, sharing
// and favourites. The same answers are in ../shared/fixtures for the iOS port.

const venue = (id: string) => VENUES.find((v) => v.id === id)!
const items = (clock: Clock) => allOf(rankVenues(VENUES, clock, OSSINGTON.origin))

const bar: Venue = {
  id: 'test-bar',
  name: 'Test Bar',
  category: 'Bar',
  vibe: 'bar',
  address: '1 Ossington Ave',
  lat: 43.6487,
  lng: -79.4196,
  tags: [],
  deals: 'venue',
  happyHours: [{ days: [1, 2, 3, 4, 5], start: 16 * 60, end: 18 * 60, specials: [{ kind: 'drink', item: 'pints', price: 6 }] }],
  // Tue–Sat 4 PM–2 AM, Sun noon–11 PM.
  hours: [
    ...([2, 3, 4, 5, 6] as const).map((day) => ({ day, open: 16 * 60, close: 26 * 60 })),
    { day: 0, open: 12 * 60, close: 23 * 60 },
  ],
  checked: '2026-10-26',
}

describe('opening hours', () => {
  it('is open, and says until when', () => {
    const s = openState(bar, { day: 2, minutes: 20 * 60 })
    expect(s).toEqual({ kind: 'open', closesAt: 26 * 60, closesIn: 6 * 60 })
    expect(openLabel(s, 2)).toBe('Open · till 2 AM')
  })

  it('stays open past midnight on the night before', () => {
    expect(openLabel(openState(bar, { day: 3, minutes: 90 }), 3)).toBe('Closes soon · 2 AM')
  })

  it('names the day when it opens on another day', () => {
    // Monday is closed; it opens Tuesday at 4.
    expect(openLabel(openState(bar, { day: 1, minutes: 12 * 60 }), 1)).toBe('Closed · opens Tue 4 PM')
    expect(openLabel(openState(bar, { day: 2, minutes: 10 * 60 }), 2)).toBe('Closed · opens 4 PM')
  })

  it('says nothing when the hours are unknown', () => {
    expect(openLabel(openState({ ...bar, hours: undefined }, { day: 2, minutes: 0 }), 2)).toBe('')
  })

  it('lists the week from today', () => {
    const week = weekHours(bar, 1)
    expect(week[0]).toEqual({ day: 1, text: 'Closed' })
    expect(week[1]).toEqual({ day: 2, text: '4 PM–2 AM' })
    expect(isOpenLate(bar)).toBe(true)
  })

  it('has hours for nearly every listed venue', () => {
    expect(VENUES.filter((v) => v.hours?.length).length).toBeGreaterThan(75)
  })
})

describe('vibes', () => {
  it('works out open now and open late from the hours', () => {
    expect(hasVibe(bar, 'open-now', { day: 2, minutes: 20 * 60 })).toBe(true)
    expect(hasVibe(bar, 'open-now', { day: 1, minutes: 20 * 60 })).toBe(false)
    expect(hasVibe(bar, 'open-late', { day: 1, minutes: 0 })).toBe(true)
  })

  it('shows amenities from the data, not "open now"', () => {
    const vibes = venueVibes(venue('roxton-public-house'), { day: 2, minutes: 20 * 60 }).map((v) => v.id)
    expect(vibes).toContain('sports')
    expect(vibes).not.toContain('open-now')
  })
})

describe('prices', () => {
  it('compares single items at one price', () => {
    expect(singlePrice({ kind: 'drink', item: 'pints', price: 6 })).toBe(6)
    expect(singlePrice({ kind: 'drink', item: 'pints' })).toBeUndefined()
    expect(singlePrice({ kind: 'drink', item: 'Budweiser pitchers', price: 20 })).toBeUndefined()
    expect(singlePrice({ kind: 'drink', item: 'wine bottles', price: 30 })).toBeUndefined()
    expect(singlePrice({ kind: 'food', item: 'half-price wings', price: 8 })).toBeUndefined()
  })

  it('finds a spot’s cheapest matching special, and when it’s on', () => {
    const clock: Clock = { day: 2, minutes: 17 * 60 }
    const deals = items(clock).flatMap((rv) => cheapestDeal(rv, (s) => /pint|beer|lager/i.test(s.item), clock) ?? [])
    expect(deals.length).toBeGreaterThan(3)
    expect(deals.every((d) => d.when.length > 0)).toBe(true)
    expect(deals.some((d) => d.on && d.when.startsWith('On'))).toBe(true)
  })
})

describe('freshness', () => {
  const now = Date.parse('2026-10-27T20:00:00Z')

  it('shows when we checked', () => {
    expect(freshness(bar, undefined, now)).toEqual({ label: 'Checked Oct 26', confirmed: false, stale: false })
  })

  it('leads with a recent confirmation', () => {
    const tally = { yes: 3, no: 0, lastYes: '2026-10-26T22:00:00Z', lastNo: null }
    expect(freshness(bar, tally, now)?.label).toBe('✓ Confirmed by 3 people yesterday')
  })

  it('flags old checks and old listings', () => {
    expect(freshness(bar, undefined, now + 200 * 86_400_000)?.stale).toBe(true)
    const reported: Venue = { ...bar, deals: 'reported', sources: [{ label: 'Blog', url: 'https://example.com', date: '2024-05' }] }
    expect(freshness(reported, undefined, now)?.stale).toBe(true)
  })

  it('says nothing for sample deals or no deals', () => {
    expect(freshness({ ...bar, deals: 'sample' }, undefined, now)).toBeUndefined()
    expect(freshness({ ...bar, happyHours: [] }, undefined, now)).toBeUndefined()
  })
})

describe('reminders', () => {
  const ics = (v: Venue) => reminderIcs(reminderPlan(v, v.happyHours[0], 'happy-hour'), v, { now: new Date('2026-10-27T20:00:00Z'), url: 'https://x', uid: 'u' })

  it('repeats weekly with an alert 15 minutes before', () => {
    const text = ics(bar)
    // Tuesday Oct 27 is a happy-hour day: the series starts today.
    expect(text).toContain('DTSTART;TZID=America/Toronto:20261027T160000')
    expect(text).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR')
    expect(text).toContain('TRIGGER:-PT15M')
    expect(text).toContain('\r\n')
  })

  it('moves a happy hour that starts after midnight to the next day', () => {
    const late: Venue = { ...bar, happyHours: [{ days: [4], start: 25 * 60, end: 26 * 60, specials: [] }] }
    const text = ics(late)
    // Thursday night's 1 AM happy hour is early Friday.
    expect(text).toContain('DTSTART;TZID=America/Toronto:20261030T010000')
    expect(text).toContain('BYDAY=FR')
  })
})

describe('sharing', () => {
  it('reads shared links, ignoring anything malformed', () => {
    expect(parseLink('?v=manita&meet=1050')).toEqual({ venueId: 'manita', meet: 1050, venueKey: undefined })
    expect(parseLink('?v=<script>&meet=5000')).toEqual({ venueId: undefined, meet: undefined, venueKey: undefined })
  })

  it('makes clean links', () => {
    expect(venueLink('https://happy-hr-beta.pages.dev/?owner#top', 'manita', 1050)).toBe('https://happy-hr-beta.pages.dev/?v=manita&meet=1050')
  })

  it('writes the message and the meeting times', () => {
    const clock: Clock = { day: 2, minutes: 15 * 60 + 40 }
    const rv = items(clock).find((r) => r.venue.id === 'test-bar') ?? rankVenues([bar], clock, OSSINGTON.origin).soon[0]
    expect(shareMessage(rv, clock, 17 * 60 + 30)).toBe('Meet at Test Bar at 5:30 PM? $6 Pints, 4–6 PM today.')
    // 4:00 is next (15 minutes' notice), and the happy hour's start is included.
    expect(meetOptions(rv, clock)).toEqual([16 * 60, 16 * 60 + 30, 17 * 60, 17 * 60 + 30])
  })

  it('summarizes a venue for link previews', () => {
    expect(previewText(bar)).toBe('Happy hour Mon–Fri 4–6 PM: $6 Pints. 1 Ossington Ave.')
  })
})

describe('favourites', () => {
  it("says what's on at each, live ones first", () => {
    const clock: Clock = { day: 2, minutes: 18 * 60 }
    const lines = favouriteLines(items(clock), ['manita', 'sweaty-bettys', 'roxton-public-house'], clock)
    expect(lines[0]).toMatchObject({ tone: 'live', label: 'On · till 7 PM' })
    expect(lines.find((l) => l.rv.venue.id === 'roxton-public-house')?.label).toBe('$12 Cheeseburger today')
  })

  it('gives a heads-up only within 15 minutes of the start', () => {
    const at = (minutes: number) => startingSoon(rankVenues([bar], { day: 2, minutes }, OSSINGTON.origin).soon, ['test-bar'])
    expect(at(15 * 60 + 50)).toHaveLength(1)
    expect(at(15 * 60 + 30)).toHaveLength(0)
  })
})

describe('meeting times', () => {
  it('starts from opening time when the venue is closed, and skips closed hours', () => {
    // 2:30 AM Tuesday: closed until 4 PM.
    const clock: Clock = { day: 2, minutes: 150 }
    const rv = rankVenues([bar], clock, OSSINGTON.origin).later[0]
    expect(meetOptions(rv, clock)).toEqual([16 * 60, 16 * 60 + 30, 17 * 60, 17 * 60 + 30])
  })

  it('offers nothing past closing on a closed day', () => {
    // Monday: closed all day, so no times (the happy hour still runs on paper).
    const clock: Clock = { day: 1, minutes: 12 * 60 }
    const rv = rankVenues([bar], clock, OSSINGTON.origin).later[0]
    expect(meetOptions(rv, clock)).toEqual([16 * 60])
  })
})

describe('24-hour places', () => {
  const diner: Venue = { ...bar, hours: ([0, 1, 2, 3, 4, 5, 6] as const).map((day) => ({ day, open: 0, close: 24 * 60 })) }

  it('says open 24 hours, not "till 12 AM"', () => {
    expect(openLabel(openState(diner, { day: 2, minutes: 150 }), 2)).toBe('Open 24 hours')
    expect(isOpenLate(diner)).toBe(true)
  })

  it('carries a late night into an early-morning opening', () => {
    // Fri 6 PM to midnight, then Sat from midnight to 3 AM.
    const late: Venue = { ...bar, hours: [{ day: 5, open: 18 * 60, close: 24 * 60 }, { day: 6, open: 0, close: 3 * 60 }] }
    expect(openLabel(openState(late, { day: 5, minutes: 23 * 60 }), 5)).toBe('Open · till 3 AM')
  })
})
