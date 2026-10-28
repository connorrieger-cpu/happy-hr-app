import { dailyLabel } from './daily'
import { formatSpecial } from './deals'
import { DAY_MINUTES, torontoDate } from './time'
import type { DailySpecial, HappyHourWindow, Venue, Weekday } from './types'

// Reminders for a favourite spot's deal. The web app hands people a calendar
// event (.ics) that repeats every week with an alert 15 minutes before; the
// iOS app can schedule the same thing as local notifications from
// `reminderPlan` without the calendar.

export const REMINDER_LEAD_MINUTES = 15

export interface ReminderPlan {
  title: string
  /** What's on, e.g. "$10 margaritas · $6 happy hour food (12 dishes)". */
  detail: string
  days: Weekday[]
  /** Minutes after midnight of each of `days`, Toronto time (≥ 1440 means early the next morning); undefined for an all-day special. */
  start?: number
  end?: number
}

export function reminderPlan(venue: Venue, deal: HappyHourWindow | DailySpecial, kind: 'happy-hour' | 'daily'): ReminderPlan {
  const title = kind === 'daily' ? `${dailyLabel(deal as DailySpecial)} at ${venue.name}` : `Happy hour at ${venue.name}`
  const detail = deal.specials.slice(0, 3).map(formatSpecial).join(' · ')
  return { title, detail, days: [...deal.days].sort((a, b) => a - b), start: deal.start ?? undefined, end: deal.end ?? undefined }
}

const ICS_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const pad = (n: number) => String(n).padStart(2, '0')

/** "2026-10-27" plus n days → "20261029". */
function shiftDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`
}

const stamp = (minutes: number) => {
  const dayShift = Math.floor(minutes / DAY_MINUTES)
  const m = minutes % DAY_MINUTES
  return { dayShift, time: `T${pad(Math.floor(m / 60))}${pad(m % 60)}00` }
}

const escapeText = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

/**
 * A weekly repeating calendar event for the plan, starting on its next day
 * (today if it runs today), with an alert 15 minutes before it starts.
 */
export function reminderIcs(plan: ReminderPlan, venue: Venue, opts: { now?: Date; url: string; uid: string }): string {
  const now = opts.now ?? new Date()
  const today = torontoDate(now)
  const todayDay = new Date(`${today}T12:00:00Z`).getUTCDay()
  const offset = Math.min(...plan.days.map((d) => (d - todayDay + 7) % 7))
  const startDate = shiftDate(today, offset)
  // A late-night deal that starts past midnight (start ≥ 1440) happens the day after each of its days.
  const startShift = plan.start == null ? 0 : Math.floor(plan.start / DAY_MINUTES)
  const byDay = plan.days.map((d) => ICS_DAYS[(d + startShift) % 7]).join(',')
  const created = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')

  const when: string[] = []
  if (plan.start == null || plan.end == null) {
    when.push(`DTSTART;VALUE=DATE:${startDate}`, `DTEND;VALUE=DATE:${shiftDate(today, offset + 1)}`)
  } else {
    const s = stamp(plan.start)
    const e = stamp(plan.end)
    when.push(
      `DTSTART;TZID=America/Toronto:${shiftDate(today, offset + s.dayShift)}${s.time}`,
      `DTEND;TZID=America/Toronto:${shiftDate(today, offset + e.dayShift)}${e.time}`,
    )
  }
  const alarm = plan.start == null ? 'TRIGGER:PT12H' : `TRIGGER:-PT${REMINDER_LEAD_MINUTES}M`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Happy HR//Reminders//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VTIMEZONE',
    'TZID:America/Toronto',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0400',
    'TZNAME:EDT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0400',
    'TZOFFSETTO:-0500',
    'TZNAME:EST',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${opts.uid}@happyhr`,
    `DTSTAMP:${created}`,
    ...when,
    `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`,
    `SUMMARY:${escapeText(plan.title)}`,
    `DESCRIPTION:${escapeText(`${plan.detail}\n\nDeals change: check Happy HR before you go. ${opts.url}`)}`,
    `LOCATION:${escapeText(`${venue.name}, ${venue.address}, Toronto`)}`,
    `URL:${opts.url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(plan.title)}`,
    alarm,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}
