import { formatSpecial, type RankedVenue } from './deals'
import { DAY_NAMES, DAY_SHORT, formatRange, type Clock } from './time'
import type { DailySpecial, Venue, Weekday } from './types'

// Daily specials: deals tied to a day of the week rather than a happy-hour
// window. They sit alongside happy hours (a pill, a filter, a section on the
// venue page) and never replace the happy-hour countdowns.

/** The daily specials a venue runs on a given day. */
export const dailyOn = (venue: Venue, day: Weekday): DailySpecial[] =>
  (venue.dailySpecials ?? []).filter((d) => d.days.includes(day))

/** True when the special has hours and they've ended for the day. */
export function dailyOver(special: DailySpecial, minutes: number): boolean {
  return special.end != null && minutes >= special.end
}

/** True when the special runs right now: all day, or within its hours. */
export function dailyRunning(special: DailySpecial, minutes: number): boolean {
  if (special.start == null || special.end == null) return true
  return minutes >= special.start && minutes < special.end
}

/** Today's special worth mentioning on a card: one that's on or still to come. */
export function dailyToday(venue: Venue, clock: Clock): DailySpecial | undefined {
  const today = dailyOn(venue, clock.day).filter((d) => !dailyOver(d, clock.minutes))
  // A weekly special ("Taco Tuesday") says more than an every-day one ("$5 shot").
  const weekly = today.filter((d) => d.days.length < 7)
  return weekly.find((d) => d.title) ?? weekly[0] ?? today[0]
}

/** Short label, e.g. "Taco Tuesday" or "$12 cheeseburger" (the first special listed leads). */
export function dailyLabel(special: DailySpecial): string {
  const lead = special.specials[0]
  return special.title ?? (lead ? formatSpecial(lead) : 'Daily special')
}

/** Everything on special, e.g. "any 3 tacos $20 · margaritas $10". */
export const dailyDetail = (special: DailySpecial): string => special.specials.map(formatSpecial).join(' · ')

/** "4–10 PM", or "All day" when the special has no hours. */
export function dailyHours(special: DailySpecial): string {
  if (special.start == null || special.end == null) return 'All day'
  return formatRange({ days: special.days, start: special.start, end: special.end, specials: [] })
}

export interface DailyEntry {
  rv: RankedVenue
  special: DailySpecial
}

export interface DailyDay {
  day: Weekday
  /** "Tomorrow", "Wednesday"… */
  label: string
  entries: DailyEntry[]
}

/**
 * The week of daily specials, starting today. Today lists what's on now first,
 * then what's still to come, nearest first; finished specials drop off.
 */
export function dailyBoard(items: RankedVenue[], clock: Clock): { today: DailyEntry[]; week: DailyDay[] } {
  const entriesFor = (day: Weekday) =>
    items.flatMap((rv) => dailyOn(rv.venue, day).map((special) => ({ rv, special })))

  const today = entriesFor(clock.day)
    .filter((e) => !dailyOver(e.special, clock.minutes))
    .sort(
      (a, b) =>
        Number(dailyRunning(b.special, clock.minutes)) - Number(dailyRunning(a.special, clock.minutes)) ||
        Number(a.special.days.length === 7) - Number(b.special.days.length === 7) ||
        a.rv.distanceM - b.rv.distanceM,
    )

  const week: DailyDay[] = []
  for (let offset = 1; offset < 7; offset++) {
    const day = ((clock.day + offset) % 7) as Weekday
    // Every-day specials were already listed under today.
    const entries = entriesFor(day)
      .filter((e) => e.special.days.length < 7)
      .sort((a, b) => a.rv.distanceM - b.rv.distanceM)
    if (entries.length) week.push({ day, label: offset === 1 ? 'Tomorrow' : DAY_NAMES[day], entries })
  }
  return { today, week }
}

/** "Mon, Tue" style day list for a special, or "Every day". */
export function dailyDays(special: DailySpecial): string {
  if (special.days.length === 7) return 'Every day'
  return [...special.days]
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((d) => DAY_SHORT[d])
    .join(', ')
}
