import { reminderIcs, reminderPlan } from '../lib/reminders'
import { venueLink } from '../lib/share'
import type { DailySpecial, HappyHourWindow, Venue } from '../lib/types'

/** Hands the browser a weekly calendar event for a deal (phones offer "Add to Calendar"). */
export function downloadReminder(venue: Venue, deal: HappyHourWindow | DailySpecial, kind: 'happy-hour' | 'daily') {
  const plan = reminderPlan(venue, deal, kind)
  const uid = `${venue.id}-${kind}-${plan.days.join('')}-${plan.start ?? 'all-day'}`
  const ics = reminderIcs(plan, venue, { url: venueLink(window.location.href, venue.id), uid })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  link.download = `${venue.id}-${kind}.ics`
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 30_000)
}
