// Golden test cases for porting the app's logic (e.g. to Swift for iOS).
// Everything here is computed by the real TypeScript, so another
// implementation passes when it produces the same answers. Written to
// ../shared/fixtures by `npm run shared`; a test fails if the files go stale.
import { AREA_LIST } from '../data/areas'
import { OSSINGTON, VENUES } from '../data/ossington'
import { SAMPLE_VENUES } from '../data/ossington.sample'
import { areaAt, inArea } from '../lib/areas'
import { CHAT_LIMITS, CHAT_RULES, validateChatMessage, validateDisplayName } from '../lib/chat'
import {
  submissionsForArea,
  validateClaim,
  validateSubmission,
  validateVote,
  voteSummary,
  type ClaimInput,
  type CommunitySubmission,
  type SubmissionInput,
  type VoteTally,
} from '../lib/community'
import { dailyBoard, dailyHours, dailyLabel, dailyToday } from '../lib/daily'
import { allOf, formatItem, formatSpecial, pinLabel, rankVenues, type DealFilter, type RankedVenue } from '../lib/deals'
import { favouriteLines, startingSoon } from '../lib/favourites'
import { allSpecials, FOOD_TYPES, servesFood } from '../lib/food'
import { freshness } from '../lib/freshness'
import { distanceMeters, formatDistance, walkMinutes } from '../lib/geo'
import { isOpenLate, openLabel, openState, weekHours, type OpenState } from '../lib/hours'
import { singlePrice } from '../lib/price'
import { DRINK_TYPES, drinkTypesOf, servesDrink } from '../lib/drinks'
import { reminderIcs, reminderPlan } from '../lib/reminders'
import { cellKey, COARSE_CELL, eventLabel, FINE_CELL, parseCell, recentDays, usageCell, validateUsage, type UsageReport } from '../lib/usage'
import { browseOptions, conceptsFor, EMPTY_QUERY, editDistance, searchVenues, searchWords, wordMatches, type SearchQuery } from '../lib/search'
import { dealLine, meetOptions, parseLink, previewText, shareMessage, venueLink } from '../lib/share'
import { formatDays, formatDuration, formatRange, formatTime, torontoClock, venueStatus, type Clock, type VenueStatus } from '../lib/time'
import type { LatLng, Special, Weekday } from '../lib/types'
import { VIBES, venueVibes } from '../lib/vibes'

const round = (n: number, places = 4) => Math.round(n * 10 ** places) / 10 ** places

/** The times every case is checked at: weekdays, weekends, late night, past midnight. */
export const CLOCKS: { label: string; clock: Clock }[] = [
  { label: 'Mon 4:30 PM', clock: { day: 1, minutes: 16 * 60 + 30 } },
  { label: 'Tue 6:00 PM', clock: { day: 2, minutes: 18 * 60 } },
  { label: 'Wed 11:50 PM', clock: { day: 3, minutes: 23 * 60 + 50 } },
  { label: 'Thu 9:00 PM', clock: { day: 4, minutes: 21 * 60 } },
  { label: 'Fri 5:30 PM', clock: { day: 5, minutes: 17 * 60 + 30 } },
  { label: 'Sat 1:15 AM', clock: { day: 6, minutes: 75 } },
  { label: 'Sun 11:00 AM', clock: { day: 0, minutes: 11 * 60 } },
]

const FILTERS: DealFilter[] = ['all', 'drinks', 'food', 'ending', 'late', 'daily']

function statusJson(s: VenueStatus) {
  switch (s.kind) {
    case 'live':
      return { kind: s.kind, minutesLeft: s.minutesLeft, endsAt: s.endsAt, progress: round(s.progress) }
    case 'soon':
    case 'later':
      return { kind: s.kind, startsIn: s.startsIn, startsAt: s.startsAt }
    case 'none':
      return s.next ? { kind: s.kind, next: { day: s.next.day, startsAt: s.next.startsAt } } : { kind: s.kind }
  }
}

const ids = (items: RankedVenue[]) => items.map((rv) => rv.venue.id)

const venue = (id: string) => VENUES.find((v) => v.id === id)!

function openJson(s: OpenState) {
  switch (s.kind) {
    case 'unknown':
      return { kind: s.kind }
    case 'open':
      return { kind: s.kind, closesAt: s.closesAt, closesIn: s.closesIn }
    case 'closed':
      return s.opensAt == null ? { kind: s.kind } : { kind: s.kind, opensAt: s.opensAt, opensDay: s.opensDay, opensIn: s.opensIn }
  }
}

/** The features added for v2 (hours, vibes, prices, freshness, sharing, favourites, reminders). */
function featureFixtures(origin: LatLng) {
  const withHours = VENUES.filter((v) => v.hours?.length)

  const hours = {
    openLate: Object.fromEntries(VENUES.map((v) => [v.id, isOpenLate(v)])),
    week: ['central', 'roxton-public-house', 'golden-turtle', 'clandestina'].map((id) => ({ venue: id, today: 2, rows: weekHours(venue(id), 2) })),
    states: CLOCKS.map(({ label, clock }) => ({
      label,
      clock,
      venues: Object.fromEntries(
        withHours.map((v) => {
          const st = openState(v, clock)
          return [v.id, { ...openJson(st), label: openLabel(st, clock.day) }]
        }),
      ),
    })),
  }

  const vibeClock = CLOCKS[1]
  const vibeItems = allOf(rankVenues(VENUES, vibeClock.clock, origin))
  const vibes = {
    label: vibeClock.label,
    clock: vibeClock.clock,
    ids: VIBES.map((v) => v.id),
    venues: Object.fromEntries(VENUES.map((v) => [v.id, venueVibes(v, vibeClock.clock).map((x) => x.id)])),
    // Search with a vibe filter (search.json has the same search without one).
    search: VIBES.map((v) => {
      const query: SearchQuery = { ...EMPTY_QUERY, places: [v.id] }
      return { query, results: searchVenues(vibeItems, query, vibeClock.clock).map((r) => r.rv.venue.id) }
    }),
  }

  const allSpecials = VENUES.flatMap((v) => [...v.happyHours, ...(v.dailySpecials ?? [])].flatMap((d) => d.specials))
  const unique = [...new Map(allSpecials.map((sp) => [`${sp.kind}|${sp.item}|${sp.price ?? ''}`, sp])).values()]
  const drinks = {
    types: DRINK_TYPES,
    // Every special in the data: its drink types, and its price when it compares (null: not one item at one price).
    classify: unique.map((special) => ({ special, drinks: drinkTypesOf(special), single: singlePrice(special) ?? null })),
    serves: Object.fromEntries(VENUES.map((v) => [v.id, DRINK_TYPES.filter((d) => servesDrink(v, d.id)).map((d) => d.id)])),
  }


  const freshNow = Date.parse('2026-10-27T20:00:00Z')
  const tallies: Record<string, VoteTally> = {
    confirmedByMany: { yes: 4, no: 0, lastYes: '2026-10-25T21:00:00Z', lastNo: null },
    confirmedOnce: { yes: 1, no: 0, lastYes: '2026-10-27T18:00:00Z', lastNo: null },
    oldYes: { yes: 2, no: 1, lastYes: '2026-09-01T21:00:00Z', lastNo: '2026-09-02T21:00:00Z' },
  }
  const sampleIds = ['manita', 'grape-witches', 'sweaty-bettys', 'bar-roma', 'central', 'roxton-public-house']
  const later = (days: number) => freshNow + days * 86_400_000
  const freshnessCases = [
    ...VENUES.filter((v) => v.deals !== 'none').map((v) => ({ name: v.id, venue: v.id, tally: null as VoteTally | null, now: freshNow })),
    ...Object.entries(tallies).map(([name, tally]) => ({ name, venue: 'manita', tally, now: freshNow })),
    { name: '200 days on', venue: 'manita', tally: null, now: later(200) },
  ]
  const fresh = {
    cases: freshnessCases.map((c) => ({
      name: c.name,
      venue: c.venue,
      tally: c.tally,
      now: new Date(c.now).toISOString(),
      result: freshness(venue(c.venue), c.tally ?? undefined, c.now) ?? null,
    })),
  }

  const shareClock = CLOCKS[4]
  const shareItems = allOf(rankVenues(VENUES, shareClock.clock, origin))
  const shareFor = (id: string) => shareItems.find((rv) => rv.venue.id === id)!
  const share = {
    parse: [
      '?v=manita',
      '?v=manita&meet=1050',
      '?v=Bad%20Id&meet=99999',
      '?venuekey=HHV-7K2M-QX9D-4FTW',
      '?meet=-5',
      '',
      '?owner',
      '?a=guelph&v=the-albion',
      '?a=Bad!&v=manita',
    ].map((search) => ({
      search,
      link: parseLink(search),
    })),
    links: [
      { base: 'https://happy-hr-beta.pages.dev/', venueId: 'manita' },
      { base: 'https://happy-hr-beta.pages.dev/?owner#x', venueId: 'grape-witches', meet: 1050 },
      { base: 'https://happy-hr-beta.pages.dev/', venueId: 'manita', meet: 1050, areaId: 'ossington' },
    ].map((c) => ({ ...c, url: venueLink(c.base, c.venueId, c.meet, c.areaId) })),
    label: shareClock.label,
    clock: shareClock.clock,
    venues: sampleIds.map((id) => {
      const rv = shareFor(id)
      return {
        venue: id,
        dealLine: dealLine(rv, shareClock.clock) ?? null,
        message: shareMessage(rv, shareClock.clock),
        meetMessage: shareMessage(rv, shareClock.clock, 18 * 60 + 30),
        meetOptions: meetOptions(rv, shareClock.clock),
        preview: previewText(rv.venue),
      }
    }),
  }

  const favIds = ['grape-witches', 'manita', 'roxton-public-house', 'golden-turtle', 'clandestina', 'sweaty-bettys']
  const favourites = {
    ids: favIds,
    cases: CLOCKS.map(({ label, clock }) => {
      const items = allOf(rankVenues(VENUES, clock, origin))
      return {
        label,
        clock,
        lines: favouriteLines(items, favIds, clock).map((l) => ({ venue: l.rv.venue.id, label: l.label, tone: l.tone })),
        startingSoon: ids(startingSoon(items, favIds)),
      }
    }),
  }

  const remindNow = new Date('2026-10-27T20:00:00Z')
  const reminderCases = [
    { venue: 'manita', kind: 'happy-hour' as const, deal: venue('manita').happyHours[0] },
    { venue: 'roxton-public-house', kind: 'daily' as const, deal: venue('roxton-public-house').dailySpecials![0] },
    ...VENUES.filter((v) => v.happyHours.some((w) => w.end > 1440))
      .slice(0, 1)
      .map((v) => ({ venue: v.id, kind: 'happy-hour' as const, deal: v.happyHours.find((w) => w.end > 1440)! })),
    ...VENUES.filter((v) => v.dailySpecials?.some((d) => d.start == null))
      .slice(0, 1)
      .map((v) => ({ venue: v.id, kind: 'daily' as const, deal: v.dailySpecials!.find((d) => d.start == null)! })),
  ]
  const reminders = {
    now: remindNow.toISOString(),
    cases: reminderCases.map((c) => {
      const plan = reminderPlan(venue(c.venue), c.deal, c.kind)
      return {
        venue: c.venue,
        kind: c.kind,
        deal: c.deal,
        plan,
        ics: reminderIcs(plan, venue(c.venue), { now: remindNow, url: `https://happy-hr-beta.pages.dev/?v=${c.venue}`, uid: `${c.venue}-test` }),
      }
    }),
  }

  return {
    'hours.json': hours,
    'vibes.json': vibes,
    'drinks.json': drinks,
    'freshness.json': fresh,
    'share.json': share,
    'favourites.json': favourites,
    'reminders.json': reminders,
  }
}

export function buildFixtures(): Record<string, unknown> {
  const origin = OSSINGTON.origin

  const status = CLOCKS.map(({ label, clock }) => ({
    label,
    clock,
    statuses: Object.fromEntries(VENUES.filter((v) => v.happyHours.length).map((v) => [v.id, statusJson(venueStatus(v, clock))])),
  }))

  const rank = CLOCKS.flatMap(({ label, clock }) =>
    FILTERS.map((filter) => {
      const r = rankVenues(VENUES, clock, origin, filter)
      return { label, clock, filter, live: ids(r.live), soon: ids(r.soon), later: ids(r.later), rest: ids(r.rest), unlisted: ids(r.unlisted) }
    }),
  )

  const daily = CLOCKS.map(({ label, clock }) => {
    const board = dailyBoard(allOf(rankVenues(VENUES, clock, origin, 'daily')), clock)
    const entry = (e: (typeof board.today)[number]) => ({ venue: e.rv.venue.id, label: dailyLabel(e.special), hours: dailyHours(e.special) })
    return {
      label,
      clock,
      todayLabels: Object.fromEntries(
        VENUES.flatMap((v) => {
          const d = dailyToday(v, clock)
          return d ? [[v.id, dailyLabel(d)]] : []
        }),
      ),
      board: { today: board.today.map(entry), week: board.week.map((d) => ({ day: d.day, label: d.label, entries: d.entries.map(entry) })) },
    }
  })

  const searchClock = CLOCKS[1]
  const searchItems = allOf(rankVenues(VENUES, searchClock.clock, origin))
  const q = (patch: Partial<SearchQuery>): SearchQuery => ({ ...EMPTY_QUERY, ...patch })
  const queries: SearchQuery[] = [
    q({}),
    q({ text: 'burger' }),
    q({ text: 'union' }),
    q({ text: 'unoin' }),
    q({ text: 'cote de boeuf' }),
    q({ text: 'NAZARÉ' }),
    q({ text: 'sweaty betty’s' }),
    q({ text: 'sweaty bettys' }),
    q({ text: 'beer' }),
    q({ text: 'cheap beer near me' }),
    q({ text: 'music' }),
    q({ text: 'live music patio' }),
    q({ text: 'tequilla' }),
    q({ text: 'marg' }),
    q({ text: 'wngs' }),
    q({ text: 'oysters', food: ['oysters'] }),
    q({ text: 'taco tuesday' }),
    q({ text: 'zzz no such place' }),
    q({ when: 'now' }),
    q({ when: 'daily' }),
    q({ when: 'happy', food: ['pizza'] }),
    q({ drinks: ['beer', 'wine'] }),
    q({ food: ['pizza', 'tacos'] }),
    q({ places: ['patio', 'open-late'] }),
    q({ drinks: ['beer'], sort: 'cheapest' }),
    q({ text: 'wine', sort: 'cheapest' }),
    q({ food: ['wings'], when: 'now', sort: 'cheapest' }),
  ]
  const search = {
    label: searchClock.label,
    clock: searchClock.clock,
    // The word rules, case by case.
    words: ['Côte de Bœuf', 'Sneaky Dee’s', 'Phở Hưng & Bar', 'NAZARÉ', 'Añejo’s Café', 'Bar-Raval 2.0'].map((text) => ({ text, words: searchWords(text) })),
    distance: [
      ['tequilla', 'tequila'],
      ['margr', 'marga'],
      ['wnie', 'wine'],
      ['abc', 'abc'],
      ['kitten', 'sitting'],
      ['', 'pub'],
    ].map(([a, b]) => ({ a, b, distance: editDistance(a, b) })),
    matches: [
      ['marg', 'margaritas', true],
      ['tequilla', 'tequila', true],
      ['margr', 'margaritas', true],
      ['wngs', 'wings', true],
      ['wine', 'wings', false],
      ['wine', 'wings', true],
      ['bar', 'beer', true],
      ['ossignton', 'ossington', true],
      ['tv', 'tvs', true],
    ].map(([term, word, typos]) => ({ term, word, typos, matches: wordMatches(term as string, word as string, typos as boolean) })),
    concepts: ['beer', 'pints', 'music', 'musik', 'tv', 'margaritas', 'pizza', 'piz', 'win', 'zzz'].map((term) => ({ term, tokens: conceptsFor(term) })),
    browse: Object.fromEntries(
      Object.entries(browseOptions(searchItems, searchClock.clock)).map(([group, options]) => [group, options.map((o) => ({ token: o.token, count: o.count }))]),
    ),
    cases: queries.map((query) => ({
      query,
      results: searchVenues(searchItems, query, searchClock.clock).map((r) => ({
        venue: r.rv.venue.id,
        note: r.note ?? null,
        on: r.on,
        deal: r.deal ? { item: r.deal.special.item, price: r.deal.price, on: r.deal.on, when: r.deal.when } : null,
      })),
    })),
  }

  const food = {
    types: FOOD_TYPES,
    serves: Object.fromEntries(VENUES.map((v) => [v.id, FOOD_TYPES.filter((f) => servesFood(v, f.id)).map((f) => f.id)])),
  }

  const specials: Special[] = [
    { kind: 'food', item: 'oysters', price: 2.5 },
    { kind: 'drink', item: 'pints', price: 6 },
    { kind: 'drink', item: 'Half-price wine bottles' },
    { kind: 'food', item: 'all-you-can-eat tacos (1 hour)', price: 29.95 },
  ]
  const days: Weekday[][] = [[0, 1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5], [0, 6], [5, 6], [2, 4], [3]]
  const format = {
    time: [0, 30, 59, 60, 11 * 60 + 59, 12 * 60, 12 * 60 + 5, 17 * 60, 17 * 60 + 30, 23 * 60 + 59, 24 * 60, 25 * 60 + 15].map((m) => ({
      minutes: m,
      full: formatTime(m),
      compact: formatTime(m, { compact: true }),
    })),
    range: [
      [16 * 60, 18 * 60],
      [11 * 60, 13 * 60],
      [21 * 60, 26 * 60],
      [17 * 60 + 30, 19 * 60 + 30],
      [22 * 60, 24 * 60],
    ].map(([start, end]) => ({ start, end, text: formatRange({ days: [1], start, end, specials: [] }) })),
    duration: [5, 45, 60, 80, 125, 180].map((m) => ({ minutes: m, text: formatDuration(m) })),
    days: days.map((d) => ({ days: d, text: formatDays(d) })),
    special: specials.map((s) => ({ special: s, text: formatSpecial(s) })),
    // Every deal name in the real and demo data, as the apps write it.
    item: [...new Set([...VENUES, ...SAMPLE_VENUES].flatMap(allSpecials).map((s) => s.item))]
      .sort()
      .map((item) => ({ item, text: formatItem(item) })),
    pinLabel: [
      { specials: [specials[1], specials[0]], text: pinLabel({ days: [1], start: 0, end: 60, specials: [specials[1], specials[0]] }) ?? null },
      {
        specials: [{ kind: 'drink', item: 'Selected wines by the glass (prices not published)' }],
        text: pinLabel({ days: [1], start: 0, end: 60, specials: [{ kind: 'drink', item: 'Selected wines by the glass (prices not published)' }] }) ?? null,
      },
    ],
    distance: [5, 94, 950, 1000, 1549].map((m) => ({ meters: m, text: formatDistance(m) })),
  }

  // Toronto wall-clock time from real instants, including both 2026 DST changes.
  const instants = [
    '2026-10-26T21:30:00Z',
    '2026-03-08T06:59:00Z',
    '2026-03-08T07:01:00Z',
    '2026-11-01T05:30:00Z',
    '2026-11-01T06:30:00Z',
    '2026-12-31T04:59:00Z',
    '2026-12-31T05:00:00Z',
  ]
  const clock = instants.map((iso) => ({ instant: iso, clock: torontoClock(new Date(iso)) }))

  const geo = [OSSINGTON.origin, ...VENUES.slice(0, 6)].map((p) => {
    const m = distanceMeters(origin, p)
    return { from: { lat: origin.lat, lng: origin.lng }, to: { lat: p.lat, lng: p.lng }, meters: round(m, 2), walkMinutes: walkMinutes(m) }
  })

  const base: SubmissionInput = {
    device: '6F9619FF-8B86-D011-B42D-00CF4FC964FF',
    venueId: 'union',
    venueName: 'Union',
    days: [2],
    start: 16 * 60,
    end: 18 * 60,
    specials: [{ kind: 'drink', item: 'pints', price: 6 }],
  }
  const { start: _start, end: _end, ...noHours } = base
  const submissions: { name: string; input: Partial<SubmissionInput> }[] = [
    { name: 'valid happy hour', input: base },
    { name: 'valid daily special, all day', input: { ...noHours, kind: 'daily', title: 'Pint Tuesday' } },
    { name: 'happy hour without hours', input: noHours },
    { name: 'no days', input: { ...base, days: [] } },
    { name: 'end before start', input: { ...base, end: base.start } },
    { name: 'longer than a happy hour', input: { ...base, start: 6 * 60, end: 23 * 60 } },
    { name: 'no specials', input: { ...base, specials: [] } },
    { name: 'blank special', input: { ...base, specials: [{ kind: 'drink', item: '  ' }] } },
    { name: 'negative price', input: { ...base, specials: [{ kind: 'drink', item: 'beer', price: -1 }] } },
    { name: 'bad device', input: { ...base, device: 'x' } },
    { name: 'new place without address', input: { ...base, venueId: undefined, venueName: 'Bar Raval' } },
    { name: 'new place outside every area', input: { ...base, venueId: undefined, venueName: 'Bar Raval', address: '1 Main St', lat: 45.5, lng: -73.6 } },
    { name: 'new place in Guelph', input: { ...base, venueId: undefined, venueName: 'The Albion', address: '49 Norfolk St', lat: 43.5452, lng: -80.2508 } },
    { name: 'title too long', input: { ...noHours, kind: 'daily', title: 'x'.repeat(41) } },
  ]
  const tallies: { name: string; tally: VoteTally | null }[] = [
    { name: 'none', tally: null },
    { name: 'confirmed', tally: { yes: 3, no: 1, lastYes: '2026-10-24T20:00:00Z', lastNo: '2026-10-20T20:00:00Z' } },
    { name: 'disputed recently', tally: { yes: 1, no: 2, lastYes: '2026-10-10T20:00:00Z', lastNo: '2026-10-26T19:00:00Z' } },
    { name: 'one yes today', tally: { yes: 1, no: 0, lastYes: '2026-10-26T15:00:00Z', lastNo: null } },
  ]
  const now = Date.parse('2026-10-26T20:00:00Z')
  const community = {
    // Checked against every area (venues.json has them as `areas`).
    submissions: submissions.map(({ name, input }) => ({ name, input, error: validateSubmission(input, AREA_LIST) })),
    votes: [
      { name: 'valid', input: { device: 'device-12345678', venueId: 'central', worked: true } },
      { name: 'missing answer', input: { device: 'device-12345678', venueId: 'central' } },
      { name: 'bad venue', input: { device: 'device-12345678', venueId: 'Central Bar!', worked: false } },
    ].map(({ name, input }) => ({ name, input, error: validateVote(input) })),
    voteSummary: { now: new Date(now).toISOString(), cases: tallies.map(({ name, tally }) => ({ name, tally, ...voteSummary(tally ?? undefined, now) })) },
    claims: (
      [
        { name: 'valid, email', input: { device: 'device-12345678', venueId: 'central', name: 'Sam', role: 'Manager', contact: 'sam@example.com' } },
        { name: 'valid, phone', input: { device: 'device-12345678', venueId: 'central', name: 'Sam', contact: '(416) 555-0123' } },
        { name: 'no contact', input: { device: 'device-12345678', venueId: 'central', name: 'Sam', contact: '' } },
        { name: 'short phone', input: { device: 'device-12345678', venueId: 'central', name: 'Sam', contact: '555-0123' } },
        { name: 'no name', input: { device: 'device-12345678', venueId: 'central', name: ' ', contact: 'sam@example.com' } },
      ] as { name: string; input: Partial<ClaimInput> }[]
    ).map(({ name, input }) => ({ name, input, error: validateClaim(input) })),
  }

  return {
    'venues.json': { schemaVersion: 1, area: OSSINGTON, areas: AREA_LIST, foodTypes: FOOD_TYPES, venues: VENUES },
    'areas.json': areaFixtures(),
    'usage.json': usageFixtures(),
    // The Demo data switch's venues (the iOS app bundles them).
    'sample-venues.json': SAMPLE_VENUES,
    'status.json': status,
    'rank.json': rank,
    'daily.json': daily,
    'search.json': search,
    'food.json': food,
    'format.json': format,
    'clock.json': clock,
    'geo.json': geo,
    'community.json': community,
    'chat.json': {
      limits: CHAT_LIMITS,
      rules: CHAT_RULES,
      messages: [
        '',
        '   ',
        'Manita’s oysters are on till 6!',
        'Anyone at Bar Koukla? Scunthorpe fans welcome',
        'That shiitake pizza at Libretto 🍕',
        'a'.repeat(CHAT_LIMITS.body),
        'a'.repeat(CHAT_LIMITS.body + 1),
        'what the fuck',
        'F.U.C.K this',
        'fuuuuck',
        'sh1t happens',
        'f u c k',
        'passing the class',
        'Ass is fine? classic',
        'rapeseed oil',
        'S-H-I-T',
        'you b1tch',
        'kys',
        'this patio is the shit',
      ].map((body) => ({ body, error: validateChatMessage(body) })),
      names: ['Connor', 'Zoë O’Brien', '', '  ', 'x'.repeat(CHAT_LIMITS.name), 'x'.repeat(CHAT_LIMITS.name + 1), '<script>', '-dash', 'shithead', 'bitch', 'B1tch', 'Mary-Jane 2', 'fuck', 'Sh1t'].map(
        (name) => ({ name, error: validateDisplayName(name) }),
      ),
    },
    ...featureFixtures(origin),
  }
}

/** Which area a point is in, which spots belong to one, and which community posts it shows. */
function areaFixtures() {
  const points: { name: string; point: LatLng }[] = [
    { name: 'Ossington & Dundas', point: { lat: 43.6496, lng: -79.4209 } },
    { name: 'Kensington Market', point: { lat: 43.6545, lng: -79.4006 } },
    { name: 'King & Portland', point: { lat: 43.64445, lng: -79.40006 } },
    { name: 'Liberty Village', point: { lat: 43.6383, lng: -79.4196 } },
    { name: 'Downtown Guelph', point: { lat: 43.5446, lng: -80.2482 } },
    { name: 'Downtown Burlington', point: { lat: 43.3255, lng: -79.7990 } },
    { name: 'Bronte, Oakville (Burlington’s area)', point: { lat: 43.3955, lng: -79.7105 } },
    { name: 'Downtown Oakville', point: { lat: 43.4466, lng: -79.6667 } },
    { name: 'Queen & Spadina (between areas)', point: { lat: 43.6487, lng: -79.3963 } },
    { name: 'CN Tower', point: { lat: 43.6426, lng: -79.3871 } },
    { name: 'Union Station', point: { lat: 43.6453, lng: -79.3806 } },
    { name: 'Downtown Hamilton', point: { lat: 43.2557, lng: -79.8711 } },
    { name: 'Waterloo', point: { lat: 43.4643, lng: -80.5204 } },
    { name: 'Montreal', point: { lat: 45.5017, lng: -73.5673 } },
  ]
  const kensington = AREA_LIST.find((a) => a.id === 'kensington')!
  const guelph = AREA_LIST.find((a) => a.id === 'guelph')!
  // Bathurst St is Kensington's west edge; spots on its far side still count.
  const edge: { name: string; area: string; point: LatLng }[] = [
    { name: 'inside', area: kensington.id, point: { lat: 43.6545, lng: -79.4006 } },
    { name: 'across Bathurst', area: kensington.id, point: { lat: 43.6551, lng: -79.4067 } },
    { name: 'a block past Bathurst', area: kensington.id, point: { lat: 43.6548, lng: -79.4085 } },
    { name: 'downtown', area: guelph.id, point: { lat: 43.5446, lng: -80.2482 } },
    { name: 'Puslinch, outside the box', area: guelph.id, point: { lat: 43.45, lng: -80.2 } },
  ]
  const post = (id: string, extra: Partial<CommunitySubmission>): CommunitySubmission => ({
    id,
    createdAt: '2026-10-20T20:00:00Z',
    venueName: 'Somewhere',
    days: [5],
    start: 960,
    end: 1080,
    specials: [{ kind: 'drink', item: 'pints', price: 6 }],
    ...extra,
  })
  const submissions = [
    post('listed', { venueId: 'manita', venueName: 'Manita' }),
    post('kensington-new', { venueName: 'New Kensington Bar', address: '200 Augusta Ave', lat: 43.6553, lng: -79.4023 }),
    post('kensington-later', { venueId: 'c-kensington-new', venueName: 'New Kensington Bar' }),
    post('before-areas', { venueName: 'Old Community Spot', address: '1 Ossington Ave' }),
    post('guelph-new', { venueName: 'New Guelph Pub', address: '1 Wyndham St N', lat: 43.5446, lng: -80.2482 }),
    post('unknown-venue', { venueId: 'nowhere', venueName: 'Nowhere' }),
  ]
  return {
    areaAt: points.map(({ name, point }) => ({ name, point, area: areaAt(point, AREA_LIST)?.id ?? null })),
    inArea: edge.map(({ name, area, point }) => ({ name, area, point, inside: inArea(point, AREA_LIST.find((a) => a.id === area)!) })),
    // Ossington is the legacy area: it keeps posts from before areas. Its spots are venues.json's.
    submissionsForArea: {
      submissions,
      cases: AREA_LIST.map((a) => ({
        area: a.id,
        legacy: a.id === OSSINGTON.id,
        venues: a.id === OSSINGTON.id ? 'venues.json' : 'none',
        ids: submissionsForArea(submissions, a, a.id === OSSINGTON.id ? VENUES : [], a.id === OSSINGTON.id).map((s) => s.id),
      })),
    },
  }
}

/** Usage counts: the rough square a point falls in, which squares the API accepts, reports and labels. */
function usageFixtures() {
  const points: { name: string; point: LatLng }[] = [
    { name: 'Ossington & Dundas', point: { lat: 43.6496, lng: -79.4209 } },
    { name: 'Downtown Guelph', point: { lat: 43.5446, lng: -80.2482 } },
    { name: 'Bronte, Oakville', point: { lat: 43.3955, lng: -79.7105 } },
    { name: 'Union Station (near King West)', point: { lat: 43.6453, lng: -79.3806 } },
    { name: 'Waterloo (far from every area)', point: { lat: 43.4643, lng: -80.5204 } },
    { name: 'Montreal', point: { lat: 45.5017, lng: -73.5673 } },
    { name: 'On a square’s edge', point: { lat: 43.65, lng: -79.415 } },
  ]
  const ids = AREA_LIST.map((a) => a.id)
  const days = recentDays('2026-10-28', 3)
  const report = (patch: Record<string, unknown>) => ({ platform: 'ios', device: 'device-12345678', area: 'ossington', events: { open: 1 }, ...patch })
  const reports: { name: string; input: Record<string, unknown> | null }[] = [
    { name: 'an open with its square', input: report({ cell: '43.6475,-79.4185' }) },
    { name: 'taps from yesterday', input: report({ day: '2026-10-27', events: { venue: 3, 'tile:beer': 1 } }) },
    { name: 'a day too long ago counts as today', input: report({ day: '2026-10-01', events: { venue: 1 } }) },
    { name: 'a square without an open is dropped', input: report({ cell: '43.6475,-79.4185', events: { venue: 1 } }) },
    { name: 'web, no device', input: { platform: 'web', area: 'guelph', events: { open: 1 } } },
    { name: 'an exact spot is refused', input: report({ cell: '43.6496,-79.4209' }) },
    { name: 'unknown area', input: report({ area: 'mississauga' }) },
    { name: 'unknown platform', input: report({ platform: 'android' }) },
    { name: 'bad event name', input: report({ events: { 'Open App': 1 } }) },
    { name: 'zero count', input: report({ events: { open: 0 } }) },
    { name: 'no events', input: report({ events: {} }) },
    { name: 'nothing', input: null },
  ]
  return {
    fine: FINE_CELL,
    coarse: COARSE_CELL,
    cells: points.map(({ name, point }) => ({ name, point, cell: cellKey(usageCell(point, AREA_LIST)) })),
    parse: ['43.6475,-79.4185', '43.4750,-80.5350', '43.4750,-80.5050', '43.6496,-79.4209', '43.6475', 'abc', '91.0025,-79.4185', '43.6475,-79.4186'].map((key) => ({
      key,
      cell: parseCell(key) ?? null,
    })),
    recentDays: { today: '2026-03-01', count: 3, days: recentDays('2026-03-01', 3) },
    validate: { days, cases: reports.map(({ name, input }) => ({ name, input, result: validateUsage(input as Partial<UsageReport> | null, ids, days) })) },
    labels: ['open', 'venue', 'tile:beer', 'filter:happy-hours', 'area:king-west', 'something-new'].map((name) => ({ name, label: eventLabel(name) })),
  }
}

