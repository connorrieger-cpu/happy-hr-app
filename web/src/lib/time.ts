import type { HappyHourWindow, Venue, Weekday } from './types'

export const TIME_ZONE = 'America/Toronto'
export const DAY_MINUTES = 24 * 60
/** A window starting within this many minutes counts as "starting soon". */
export const SOON_MINUTES = 120

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** A moment expressed as Toronto weekday + minutes after midnight. */
export interface Clock {
  day: Weekday
  minutes: number
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
})

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Today's date in Toronto, e.g. "2026-10-26". */
export const torontoDate = (date = new Date()) => dateFormatter.format(date)

/** Converts a real instant to Toronto wall-clock time, whatever the device's time zone. */
export function torontoClock(date: Date): Clock {
  const parts = partsFormatter.formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const day = DAY_SHORT.indexOf(get('weekday') as (typeof DAY_SHORT)[number]) as Weekday
  const hour = Number(get('hour')) % 24
  return { day, minutes: hour * 60 + Number(get('minute')) }
}

export type VenueStatus =
  | { kind: 'live'; window: HappyHourWindow; minutesLeft: number; endsAt: number; progress: number }
  | { kind: 'soon' | 'later'; window: HappyHourWindow; startsIn: number; startsAt: number }
  | { kind: 'none'; next?: { window: HappyHourWindow; day: Weekday; startsAt: number } }

interface Occurrence {
  window: HappyHourWindow
  day: Weekday
  /** Minutes from now until it starts (negative once started). */
  startsIn: number
  endsIn: number
  dayOffset: number
}

/** Every occurrence of a venue's windows from yesterday through the next 6 days. */
function occurrences(venue: Venue, clock: Clock): Occurrence[] {
  const out: Occurrence[] = []
  for (const window of venue.happyHours) {
    for (let dayOffset = -1; dayOffset <= 6; dayOffset++) {
      const day = (((clock.day + dayOffset) % 7) + 7) % 7 as Weekday
      if (!window.days.includes(day)) continue
      const startsIn = dayOffset * DAY_MINUTES + window.start - clock.minutes
      out.push({ window, day, startsIn, endsIn: startsIn + window.end - window.start, dayOffset })
    }
  }
  return out
}

export function venueStatus(venue: Venue, clock: Clock): VenueStatus {
  const all = occurrences(venue, clock)

  const live = all
    .filter((o) => o.startsIn <= 0 && o.endsIn > 0)
    .sort((a, b) => b.endsIn - a.endsIn)[0]
  if (live) {
    const length = live.window.end - live.window.start
    return {
      kind: 'live',
      window: live.window,
      minutesLeft: live.endsIn,
      endsAt: live.window.end,
      progress: (length - live.endsIn) / length,
    }
  }

  const upcoming = all.filter((o) => o.startsIn > 0).sort((a, b) => a.startsIn - b.startsIn)[0]
  if (!upcoming) return { kind: 'none' }
  if (upcoming.dayOffset === 0) {
    return {
      kind: upcoming.startsIn <= SOON_MINUTES ? 'soon' : 'later',
      window: upcoming.window,
      startsIn: upcoming.startsIn,
      startsAt: upcoming.window.start,
    }
  }
  return { kind: 'none', next: { window: upcoming.window, day: upcoming.day, startsAt: upcoming.window.start } }
}

/** "5 PM", "5:30 PM", "12:30 AM". Accepts minutes past 24h. */
export function formatTime(minutes: number, { compact = false } = {}): string {
  const m = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES
  const h24 = Math.floor(m / 60)
  const min = m % 60
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  const suffix = h24 < 12 ? 'AM' : 'PM'
  const time = min === 0 && compact ? `${h12}` : `${h12}:${String(min).padStart(2, '0')}`
  return `${time} ${suffix}`
}

export function formatRange(window: HappyHourWindow): string {
  const sameHalf = Math.floor((window.start % DAY_MINUTES) / 720) === Math.floor((window.end % DAY_MINUTES) / 720)
  const start = formatTime(window.start, { compact: true })
  const end = formatTime(window.end, { compact: true })
  return sameHalf ? `${start.replace(/ (AM|PM)$/, '')}–${end}` : `${start}–${end}`
}

/** "45 min", "1h 20m", "3h". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/** Short summary of the days a window runs: "Daily", "Mon–Fri", "Fri, Sat". */
export function formatDays(days: Weekday[]): string {
  const sorted = [...days].sort((a, b) => a - b)
  if (sorted.length === 7) return 'Daily'
  const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1)
  if (contiguous && sorted.length >= 3) return `${DAY_SHORT[sorted[0]]}–${DAY_SHORT[sorted[sorted.length - 1]]}`
  if (sorted.join() === '0,6') return 'Weekends'
  return sorted.map((d) => DAY_SHORT[d]).join(', ')
}
