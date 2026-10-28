import { DAY_MINUTES, DAY_SHORT, formatTime, type Clock } from './time'
import type { OpenSpan, Venue, Weekday } from './types'

// Opening hours: is it open right now, and when does it close or open next.

export type OpenState =
  | { kind: 'unknown' }
  | { kind: 'open'; closesAt: number; closesIn: number }
  | { kind: 'closed'; opensAt?: number; opensDay?: Weekday; opensIn?: number }

/** Closing within this many minutes reads as "Closes soon". */
export const CLOSING_SOON_MINUTES = 60

/** Every span from yesterday through the next 7 days, as minutes from now. */
function upcomingSpans(hours: OpenSpan[], clock: Clock) {
  const out: { span: OpenSpan; startsIn: number; endsIn: number; day: Weekday }[] = []
  for (const span of hours) {
    for (let offset = -1; offset <= 7; offset++) {
      const day = ((((clock.day + offset) % 7) + 7) % 7) as Weekday
      if (span.day !== day) continue
      const startsIn = offset * DAY_MINUTES + span.open - clock.minutes
      out.push({ span, day, startsIn, endsIn: startsIn + span.close - span.open })
    }
  }
  return out
}

/**
 * Where a span really ends: one that runs to midnight carries on into the next
 * day's span when that opens at midnight (Google lists a 24-hour place as
 * midnight to midnight, every day). Minutes after midnight of the span's day.
 */
function runsUntil(hours: OpenSpan[], span: OpenSpan): number {
  let close = span.close
  for (let offset = 1; offset <= 7 && close === offset * DAY_MINUTES; offset++) {
    const next = hours.find((s) => s.day === (span.day + offset) % 7 && s.open === 0)
    if (!next) break
    close = offset * DAY_MINUTES + next.close
  }
  return close
}

export function openState(venue: Venue, clock: Clock): OpenState {
  if (!venue.hours?.length) return { kind: 'unknown' }
  const all = upcomingSpans(venue.hours, clock)
  const now = all.filter((s) => s.startsIn <= 0 && s.endsIn > 0).sort((a, b) => b.endsIn - a.endsIn)[0]
  if (now) {
    const closesAt = runsUntil(venue.hours, now.span)
    return { kind: 'open', closesAt, closesIn: now.endsIn + closesAt - now.span.close }
  }
  const next = all.filter((s) => s.startsIn > 0).sort((a, b) => a.startsIn - b.startsIn)[0]
  return next ? { kind: 'closed', opensAt: next.span.open, opensDay: next.day, opensIn: next.startsIn } : { kind: 'closed' }
}

/** "Open · till 2 AM", "Open 24 hours", "Closes soon · 11:30 PM", "Closed · opens 5 PM", "Closed · opens Tue 5 PM", or "" when unknown. */
export function openLabel(state: OpenState, today: Weekday): string {
  switch (state.kind) {
    case 'unknown':
      return ''
    case 'open':
      if (state.closesIn >= DAY_MINUTES) return 'Open 24 hours'
      return state.closesIn <= CLOSING_SOON_MINUTES
        ? `Closes soon · ${formatTime(state.closesAt, { compact: true })}`
        : `Open · till ${formatTime(state.closesAt, { compact: true })}`
    case 'closed': {
      if (state.opensAt == null || state.opensDay == null) return 'Closed'
      const day = state.opensDay === today && (state.opensIn ?? 0) < DAY_MINUTES ? '' : `${DAY_SHORT[state.opensDay]} `
      return `Closed · opens ${day}${formatTime(state.opensAt, { compact: true })}`
    }
  }
}

/**
 * False only when the hours say it's closed right now. Use it to keep an
 * all-day special from reading "On now" at 3 AM.
 */
export const mightBeOpen = (venue: Venue, clock: Clock) => openState(venue, clock).kind !== 'closed'

/** The week's hours from today, e.g. [{ day: 2, text: "2 PM–2 AM" }, { day: 3, text: "Closed" }]. */
export function weekHours(venue: Venue, today: Weekday): { day: Weekday; text: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = ((today + i) % 7) as Weekday
    const spans = (venue.hours ?? []).filter((s) => s.day === day).sort((a, b) => a.open - b.open)
    const text = spans.length
      ? spans.map((s) => (s.close - s.open >= DAY_MINUTES ? 'Open 24 hours' : `${formatTime(s.open, { compact: true })}–${formatTime(s.close, { compact: true })}`)).join(', ')
      : 'Closed'
    return { day, text }
  })
}

/** Open at 1 AM or later on at least one night (24-hour places count). */
export const isOpenLate = (venue: Venue) => (venue.hours ?? []).some((s, _, all) => runsUntil(all, s) >= DAY_MINUTES + 60)
