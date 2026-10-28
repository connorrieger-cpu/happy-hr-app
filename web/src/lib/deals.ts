import { distanceMeters, walkMinutes } from './geo'
import { venueStatus, type Clock, type VenueStatus } from './time'
import type { HappyHourWindow, LatLng, Special, Venue } from './types'

export interface RankedVenue {
  venue: Venue
  status: VenueStatus
  distanceM: number
  walkMin: number
}

export interface RightNow {
  live: RankedVenue[]
  soon: RankedVenue[]
  later: RankedVenue[]
  /** Nothing else today. */
  rest: RankedVenue[]
  /** Restaurants and bars with no known happy hour (some have daily specials), nearest first. */
  unlisted: RankedVenue[]
}

export type DealFilter = 'all' | 'drinks' | 'food' | 'ending' | 'late' | 'daily'

export const FILTERS: { id: DealFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'food', label: 'Food' },
  { id: 'ending', label: 'Ending soon' },
  { id: 'late', label: 'Late night' },
  { id: 'daily', label: 'Daily specials' },
]

const ENDING_SOON_MIN = 30
const LATE_NIGHT_START = 21 * 60

export const isEndingSoon = (s: VenueStatus) => s.kind === 'live' && s.minutesLeft <= ENDING_SOON_MIN

/** The window a card should talk about: the live one, else the next one. */
export function focusWindow(status: VenueStatus): HappyHourWindow | undefined {
  return status.kind === 'none' ? status.next?.window : status.window
}

export function matchesFilter(rv: RankedVenue, filter: DealFilter): boolean {
  const { status, venue } = rv
  switch (filter) {
    case 'all':
      return true
    case 'drinks':
    case 'food': {
      const kind = filter === 'drinks' ? 'drink' : 'food'
      return focusWindow(status)?.specials.some((s) => s.kind === kind) ?? false
    }
    case 'ending':
      return isEndingSoon(status)
    case 'late':
      return venue.happyHours.some((w) => w.start >= LATE_NIGHT_START)
    case 'daily':
      return (venue.dailySpecials?.length ?? 0) > 0
  }
}

export const hasHappyHour = (venue: Venue) => venue.happyHours.length > 0

/** Any deal at all: a happy hour or a daily special. */
export const hasDeals = (venue: Venue) => hasHappyHour(venue) || (venue.dailySpecials?.length ?? 0) > 0

export function rankVenues(venues: Venue[], clock: Clock, origin: LatLng, filter: DealFilter = 'all'): RightNow {
  const all = venues
    .map((venue): RankedVenue => {
      const distanceM = distanceMeters(origin, venue)
      return { venue, status: venueStatus(venue, clock), distanceM, walkMin: walkMinutes(distanceM) }
    })
    .filter((rv) => matchesFilter(rv, filter))
  const ranked = all.filter((rv) => hasHappyHour(rv.venue))

  const by = (kind: VenueStatus['kind']) => ranked.filter((rv) => rv.status.kind === kind)
  const startsIn = (rv: RankedVenue) => ('startsIn' in rv.status ? rv.status.startsIn : 0)
  const minutesLeft = (rv: RankedVenue) => ('minutesLeft' in rv.status ? rv.status.minutesLeft : 0)

  return {
    // Nearest first, since the point is "where can I walk to right now".
    live: by('live').sort((a, b) => a.distanceM - b.distanceM || minutesLeft(b) - minutesLeft(a)),
    soon: by('soon').sort((a, b) => startsIn(a) - startsIn(b) || a.distanceM - b.distanceM),
    later: by('later').sort((a, b) => startsIn(a) - startsIn(b) || a.distanceM - b.distanceM),
    rest: by('none').sort((a, b) => a.distanceM - b.distanceM),
    unlisted: all.filter((rv) => !hasHappyHour(rv.venue)).sort((a, b) => a.distanceM - b.distanceM),
  }
}

/** Venues with a happy hour, in list order. */
export const dealsOf = (r: RightNow): RankedVenue[] => [...r.live, ...r.soon, ...r.later, ...r.rest]

/** Every venue, the ones without a happy hour last. */
export const allOf = (r: RightNow): RankedVenue[] => [...dealsOf(r), ...r.unlisted]

export function formatPrice(price: number): string {
  return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`
}

// Small words stay lowercase inside a deal's name (unless they start it), as do units.
const MINOR_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'via', 'vs', 'with'])
const PARTICLES = new Set(['de', 'del', 'dei', 'des', 'di', 'du'])
const UNITS = new Set(['oz', 'ml', 'cl', 'lb', 'lbs', 'kg'])

/**
 * Deals read as names: "house beer" → "House Beer", "half-price wine bottles (whole list)" →
 * "Half-Price Wine Bottles (whole list)". Words with capitals inside (OG, IPA) stay as written,
 * and so does anything in brackets.
 */
export function formatItem(item: string): string {
  let depth = 0
  let first = true
  return item.replace(/[()]|[^\s()]+/g, (word) => {
    if (word === '(') {
      depth++
      return word
    }
    if (word === ')') {
      depth = Math.max(0, depth - 1)
      return word
    }
    if (depth > 0) return word
    const isFirst = first
    first = false
    if (/[A-Z]/.test(word.slice(1))) return word
    const lower = word.toLowerCase()
    if (!isFirst && (MINOR_WORDS.has(lower) || PARTICLES.has(lower) || UNITS.has(lower))) return word
    return word.replace(/(^|-)([a-z])/g, (_, before: string, letter: string) => before + letter.toUpperCase())
  })
}

export function formatSpecial(special: Special): string {
  const item = formatItem(special.item)
  return special.price == null ? item : `${formatPrice(special.price)} ${item}`
}

const PIN_LABEL_MAX = 18

/** The special to lead with: the cheapest priced one, else the first. */
export function headlineSpecial(window: Pick<HappyHourWindow, 'specials'> | undefined): Special | undefined {
  const priced = window?.specials.filter((s) => s.price != null).sort((a, b) => a.price! - b.price!)
  return priced?.[0] ?? window?.specials[0]
}

/** Trims a label to fit on a map pin. */
export const shortLabel = (label: string) =>
  label.length > PIN_LABEL_MAX ? `${label.slice(0, PIN_LABEL_MAX - 1).trimEnd()}…` : label

/** Short pin label, e.g. "$2 oysters". */
export function pinLabel(window: HappyHourWindow | undefined): string | undefined {
  const special = headlineSpecial(window)
  return special ? shortLabel(formatSpecial(special)) : undefined
}
