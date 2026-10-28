import type { VoteTally } from './community'
import { torontoDate } from './time'
import type { Venue } from './types'

// How fresh a venue's deals are, so people know what to trust: when we last
// checked them, when someone last confirmed one in person, and whether they
// may have gone stale.

const DAY_MS = 24 * 60 * 60 * 1000
/** A confirmation this recent counts as "confirmed". */
export const CONFIRMED_DAYS = 14
/** Researched deals older than this without a confirmation may be out of date. */
export const STALE_CHECKED_DAYS = 120
/** A reported deal whose newest source is older than this may be out of date. */
export const STALE_SOURCE_DAYS = 365

export interface Freshness {
  /** "✓ Confirmed 2 days ago", "Checked Oct 26", "Added 3 days ago". */
  label: string
  confirmed: boolean
  /** Old enough that people should double-check. */
  stale: boolean
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2026-10-26" or "2026-10" → a Date at noon UTC (so the calendar day never shifts); undefined for "undated". */
function parseDay(text: string | undefined): Date | undefined {
  const m = text?.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/)
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3] ?? 1), 12)) : undefined
}

/** Calendar days in Toronto, so last night's check-in reads "yesterday" even if it was 20 hours ago. */
const dayNumber = (date: Date) => Date.parse(`${torontoDate(date)}T00:00:00Z`) / DAY_MS
const daysSince = (date: Date, now: number) => Math.round(dayNumber(new Date(now)) - dayNumber(date))

function ago(days: number): string {
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.round(days / 30)
  return months === 1 ? 'a month ago' : `${months} months ago`
}

/** Undefined for a venue with no deals, or sample deals. */
export function freshness(venue: Venue, tally: VoteTally | undefined, now = Date.now()): Freshness | undefined {
  const deals = [...venue.happyHours, ...(venue.dailySpecials ?? [])]
  if (!deals.length || venue.deals === 'sample') return undefined

  const lastYes = tally?.lastYes ? new Date(tally.lastYes) : undefined
  if (lastYes && daysSince(lastYes, now) <= CONFIRMED_DAYS) {
    const people = tally!.yes > 1 ? ` by ${tally!.yes} people` : ''
    return { label: `✓ Confirmed${people} ${ago(daysSince(lastYes, now))}`, confirmed: true, stale: false }
  }

  // Community-only deals: how long ago the newest was added.
  const added = deals.flatMap((d) => (d.community ? [new Date(d.community.createdAt)] : []))
  if (!venue.checked && added.length) {
    const newest = added.reduce((a, b) => (a > b ? a : b))
    const days = daysSince(newest, now)
    return { label: `Added ${ago(days)}`, confirmed: false, stale: days > STALE_CHECKED_DAYS }
  }

  const checked = parseDay(venue.checked)
  const sources = (venue.sources ?? []).map((s) => parseDay(s.date))
  const newestSource = sources.reduce<Date | undefined>((a, b) => (b && (!a || b > a) ? b : a), undefined)
  const sourceStale = venue.deals === 'reported' && (!newestSource || daysSince(newestSource, now) > STALE_SOURCE_DAYS)
  const checkedStale = checked ? daysSince(checked, now) > STALE_CHECKED_DAYS : true
  const label = checked ? `Checked ${MONTHS[checked.getUTCMonth()]} ${checked.getUTCDate()}` : 'Not checked yet'
  return { label, confirmed: false, stale: sourceStale || checkedStale }
}
