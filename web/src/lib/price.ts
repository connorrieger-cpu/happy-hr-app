import { dailyRunning } from './daily'
import { mightBeOpen } from './hours'
import type { RankedVenue } from './deals'
import { formatDays, formatRange, formatTime, type Clock } from './time'
import type { DailySpecial, HappyHourWindow, Special } from './types'

// Prices for search's "Cheapest first": the cheapest special at a spot that matches what
// someone picked (beer, tacos…). Only single items at one price compare; bottles,
// pitchers, "any 3 tacos" and discounts are left out so the order stays fair.

// Not one drink or plate at one price, so not comparable.
const NOT_SINGLE = /\b(bottles?|pitchers?|buckets?|flights?|towers?|any \d|set|per person|for (two|2)|feast)\b|half-price|half price|% off|\$\d+ off|\bfree\b/i

/** The special's price when it's one comparable item at one price. */
export function singlePrice(special: Special): number | undefined {
  return special.price != null && !NOT_SINGLE.test(special.item) ? special.price : undefined
}

export interface PriceDeal {
  special: Special
  price: number
  /** Running right now. */
  on: boolean
  /** When it's available: "On now · till 6 PM", "Today 4–6 PM", "Mon–Fri 4–6 PM", "Tue". */
  when: string
}

function windowWhen(rv: RankedVenue, window: HappyHourWindow, clock: Clock): { on: boolean; when: string } {
  const s = rv.status
  if (s.kind === 'live' && s.window === window) return { on: true, when: `On now · till ${formatTime(s.endsAt, { compact: true })}` }
  if ((s.kind === 'soon' || s.kind === 'later') && s.window === window) return { on: false, when: `Today ${formatRange(window)}` }
  if (window.days.includes(clock.day) && window.start > clock.minutes) return { on: false, when: `Today ${formatRange(window)}` }
  return { on: false, when: `${formatDays(window.days)} ${formatRange(window)}` }
}

function dailyWhen(special: DailySpecial, clock: Clock): { on: boolean; when: string } {
  const today = special.days.includes(clock.day)
  const hours = special.start != null && special.end != null ? formatRange({ days: special.days, start: special.start, end: special.end, specials: [] }) : ''
  if (today && dailyRunning(special, clock.minutes)) {
    return { on: true, when: special.end != null ? `On now · till ${formatTime(special.end, { compact: true })}` : 'On today' }
  }
  if (today && special.start != null && special.start > clock.minutes) return { on: false, when: `Today ${hours}` }
  return { on: false, when: `${special.days.length === 7 ? 'Every day' : formatDays(special.days)}${hours ? ` ${hours}` : ''}` }
}

/**
 * The spot's cheapest single-priced special that `matches` accepts; on a tie, the one on
 * now, then the first listed.
 */
export function cheapestDeal(rv: RankedVenue, matches: (special: Special) => boolean, clock: Clock): PriceDeal | undefined {
  let best: PriceDeal | undefined
  const consider = (special: Special, timing: { on: boolean; when: string }) => {
    const price = singlePrice(special)
    if (price == null || !matches(special)) return
    if (!best || price < best.price || (price === best.price && timing.on && !best.on)) best = { special, price, ...timing }
  }
  for (const window of rv.venue.happyHours) {
    for (const special of window.specials) consider(special, windowWhen(rv, window, clock))
  }
  // An all-day special isn't on while the venue is closed.
  const open = mightBeOpen(rv.venue, clock)
  for (const daily of rv.venue.dailySpecials ?? []) {
    const timing = dailyWhen(daily, clock)
    if (timing.on && !open) Object.assign(timing, { on: false, when: timing.when === 'On today' ? 'Today' : timing.when })
    for (const special of daily.specials) consider(special, timing)
  }
  return best
}
