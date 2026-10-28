import { describe, expect, it } from 'vitest'
import { formatDays, formatRange, formatTime, torontoClock, venueStatus } from './time'
import type { Venue } from './types'

const venue = (happyHours: Venue['happyHours']): Venue => ({
  id: 'v',
  name: 'Test',
  category: 'Bar',
  vibe: 'bar',
  address: '1 Ossington Ave',
  lat: 43.647,
  lng: -79.42,
  tags: [],
  deals: 'sample',
  happyHours,
})

const afterWork = venue([{ days: [1, 2, 3, 4, 5], start: 15 * 60, end: 18 * 60, specials: [] }])
const lateNight = venue([{ days: [5, 6], start: 23 * 60, end: 26 * 60, specials: [] }])

describe('torontoClock', () => {
  it('reads Toronto wall time during daylight time (UTC-4)', () => {
    // Fri 23 Oct 2026, 21:30 UTC = 5:30 PM EDT
    expect(torontoClock(new Date('2026-10-23T21:30:00Z'))).toEqual({ day: 5, minutes: 17 * 60 + 30 })
  })

  it('reads Toronto wall time during standard time (UTC-5)', () => {
    // Fri 16 Jan 2026, 22:30 UTC = 5:30 PM EST
    expect(torontoClock(new Date('2026-01-16T22:30:00Z'))).toEqual({ day: 5, minutes: 17 * 60 + 30 })
  })

  it('rolls the weekday back when UTC has already passed midnight', () => {
    // Sat 03:15 UTC = Fri 11:15 PM EDT
    expect(torontoClock(new Date('2026-10-24T03:15:00Z'))).toEqual({ day: 5, minutes: 23 * 60 + 15 })
  })
})

describe('venueStatus', () => {
  it('is live mid-window with minutes left and progress', () => {
    const s = venueStatus(afterWork, { day: 2, minutes: 16 * 60 + 30 })
    expect(s).toMatchObject({ kind: 'live', minutesLeft: 90, endsAt: 18 * 60, progress: 0.5 })
  })

  it('is live at the exact start and not at the exact end', () => {
    expect(venueStatus(afterWork, { day: 2, minutes: 15 * 60 }).kind).toBe('live')
    expect(venueStatus(afterWork, { day: 2, minutes: 18 * 60 }).kind).not.toBe('live')
  })

  it('is soon within two hours of the start, later beyond that', () => {
    expect(venueStatus(afterWork, { day: 3, minutes: 13 * 60 })).toMatchObject({ kind: 'soon', startsIn: 120 })
    expect(venueStatus(afterWork, { day: 3, minutes: 12 * 60 + 59 })).toMatchObject({ kind: 'later', startsIn: 121 })
  })

  it('reports the next day when nothing is left today', () => {
    // Friday 7 PM: next window is Monday.
    expect(venueStatus(afterWork, { day: 5, minutes: 19 * 60 })).toMatchObject({ kind: 'none', next: { day: 1 } })
  })

  it("does not run on days that aren't listed", () => {
    expect(venueStatus(afterWork, { day: 6, minutes: 16 * 60 }).kind).toBe('none')
  })

  it("is live after midnight from the previous night's window", () => {
    // Saturday 12:30 AM belongs to Friday's 11 PM–2 AM window.
    expect(venueStatus(lateNight, { day: 6, minutes: 30 })).toMatchObject({ kind: 'live', minutesLeft: 90 })
    // Sunday 12:30 AM belongs to Saturday's window.
    expect(venueStatus(lateNight, { day: 0, minutes: 30 }).kind).toBe('live')
    // Monday 12:30 AM: Sunday has no window.
    expect(venueStatus(lateNight, { day: 1, minutes: 30 }).kind).toBe('none')
  })
})

describe('formatting', () => {
  it('formats times and ranges', () => {
    expect(formatTime(17 * 60 + 30)).toBe('5:30 PM')
    expect(formatTime(24 * 60 + 30)).toBe('12:30 AM')
    expect(formatRange({ days: [], start: 15 * 60, end: 18 * 60, specials: [] })).toBe('3–6 PM')
    expect(formatRange({ days: [], start: 23 * 60, end: 26 * 60, specials: [] })).toBe('11 PM–2 AM')
    expect(formatRange({ days: [], start: 16 * 60 + 30, end: 18 * 60, specials: [] })).toBe('4:30–6 PM')
  })

  it('formats day sets', () => {
    expect(formatDays([0, 1, 2, 3, 4, 5, 6])).toBe('Daily')
    expect(formatDays([1, 2, 3, 4, 5])).toBe('Mon–Fri')
    expect(formatDays([0, 1, 2, 3, 4])).toBe('Sun–Thu')
    expect(formatDays([0, 6])).toBe('Weekends')
    expect(formatDays([5, 6])).toBe('Fri, Sat')
  })
})
