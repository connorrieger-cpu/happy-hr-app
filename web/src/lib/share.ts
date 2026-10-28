import { VENUE_KEY_RE } from './community'
import { dailyLabel, dailyToday } from './daily'
import { focusWindow, formatSpecial, headlineSpecial, type RankedVenue } from './deals'
import { openState } from './hours'
import { DAY_MINUTES, formatDays, formatRange, formatTime, type Clock } from './time'
import type { Venue } from './types'

// Shareable links: a venue (`?v=manita`) or a plan to meet there
// (`?v=manita&meet=1050`, minutes after midnight). The same links become
// universal links for the iOS app.

export interface SharedLink {
  venueId?: string
  /** Suggested meeting time, minutes after midnight, Toronto time. */
  meet?: number
  /** A venue owner's key, from the link the owner sends after approving a claim. */
  venueKey?: string
  /** The spot's area (`a=guelph`); links from before areas have none and mean Ossington. */
  areaId?: string
}

export function parseLink(search: string): SharedLink {
  const params = new URLSearchParams(search)
  const areaId = params.get('a') ?? undefined
  const venueId = params.get('v') ?? undefined
  const meet = Number(params.get('meet'))
  const venueKey = params.get('venuekey') ?? undefined
  return {
    venueId: venueId && /^[a-z0-9-]{1,80}$/.test(venueId) ? venueId : undefined,
    meet: Number.isInteger(meet) && meet > 0 && meet < DAY_MINUTES ? meet : undefined,
    venueKey: venueKey && VENUE_KEY_RE.test(venueKey) ? venueKey : undefined,
    areaId: areaId && /^[a-z0-9-]{1,40}$/.test(areaId) ? areaId : undefined,
  }
}

/** A link to a spot: `?a=guelph&v=…` (links without the area are Ossington's, from before areas). */
export function venueLink(base: string, venueId: string, meet?: number, areaId?: string): string {
  const url = new URL(base)
  url.search = ''
  url.hash = ''
  if (areaId) url.searchParams.set('a', areaId)
  url.searchParams.set('v', venueId)
  if (meet != null) url.searchParams.set('meet', String(meet))
  return url.toString()
}

/** A line about the deal worth sharing, e.g. "$2.50 oysters till 6 PM" or "Taco Tuesday today". */
export function dealLine(rv: RankedVenue, clock: Clock): string | undefined {
  const s = rv.status
  const lead = headlineSpecial(focusWindow(s))
  if (s.kind === 'live' && lead) return `${formatSpecial(lead)} till ${formatTime(s.endsAt, { compact: true })}`
  if ((s.kind === 'soon' || s.kind === 'later') && lead) return `${formatSpecial(lead)}, ${formatRange(s.window)} today`
  const today = dailyToday(rv.venue, clock)
  if (today) return `${dailyLabel(today)} today`
  return undefined
}

/** The message that goes with a shared link. */
export function shareMessage(rv: RankedVenue, clock: Clock, meet?: number): string {
  const deal = dealLine(rv, clock)
  if (meet != null) return `Meet at ${rv.venue.name} at ${formatTime(meet, { compact: true })}?${deal ? ` ${deal}.` : ''}`
  return `${rv.venue.name} on ${rv.venue.address}${deal ? `: ${deal}` : ''}`
}

/**
 * Meeting times to offer, all later today: the next few half hours (from when
 * it opens, if it's closed now), only while it's open when the hours are
 * known, plus the start of today's happy hour when it's coming up.
 */
export function meetOptions(rv: RankedVenue, clock: Clock): number[] {
  const soonest = Math.ceil((clock.minutes + 15) / 30) * 30
  const now = openState(rv.venue, clock)
  // Closed now but opening later today: start from the opening time.
  const opensToday = now.kind === 'closed' && now.opensAt != null && now.opensDay === clock.day && now.opensAt > clock.minutes
  const first = opensToday ? Math.max(soonest, Math.ceil(now.opensAt! / 30) * 30) : soonest
  const isOpenAt = (m: number) => openState(rv.venue, { day: clock.day, minutes: m }).kind !== 'closed'
  const times = new Set([first, first + 30, first + 60, first + 90].filter((m) => m < DAY_MINUTES && isOpenAt(m)))
  const s = rv.status
  if ((s.kind === 'soon' || s.kind === 'later') && s.startsAt < DAY_MINUTES) times.add(s.startsAt)
  return [...times].sort((a, b) => a - b).slice(0, 5)
}

/**
 * A summary for link previews (iMessage, WhatsApp…), true whatever the time:
 * "Happy hour Mon–Fri 3–6 PM: $6 pints, $2.50 oysters. 1100 Queen St W."
 */
export function previewText(venue: Venue): string {
  const window = venue.happyHours[0]
  const daily = venue.dailySpecials?.[0]
  const deal = window
    ? `Happy hour ${formatDays(window.days)} ${formatRange(window)}: ${window.specials.slice(0, 2).map(formatSpecial).join(', ')}. `
    : daily
      ? `${formatDays(daily.days)}: ${dailyLabel(daily)}. `
      : ''
  return `${deal}${venue.address}.`
}
