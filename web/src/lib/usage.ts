import { areaAt } from './areas'
import type { Area, LatLng } from './types'

// Anonymous usage counts for the owner: which area the apps open, a rough square of the map
// they're opened in, and which buttons get tapped. Nothing here is tied to a person or an
// account: the server keeps daily totals, plus a hashed device id for 90 days to count how
// many phones used the app each day. Shared by the apps and the API (Swift: Usage.swift).

/** Near one of the areas, a square about 550 m across; anywhere else, about 5.5 km. */
export const FINE_CELL = { lat: 0.005, lng: 0.007 }
export const COARSE_CELL = { lat: 0.05, lng: 0.07 }

const round4 = (n: number) => Math.round(n * 10_000) / 10_000

function snap(p: LatLng, size: { lat: number; lng: number }): LatLng {
  return { lat: round4((Math.floor(p.lat / size.lat) + 0.5) * size.lat), lng: round4((Math.floor(p.lng / size.lng) + 0.5) * size.lng) }
}

/** The centre of the square around `p` (a fine one near an area, else a coarse one): never the exact spot. */
export function usageCell(p: LatLng, areas: Area[]): LatLng {
  return snap(p, areaAt(p, areas) ? FINE_CELL : COARSE_CELL)
}

/** How a square is sent and stored: "43.6475,-79.4185". */
export const cellKey = (c: LatLng) => `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`

const onGrid = (value: number, step: number) => {
  const k = value / step - 0.5
  return Math.abs(k - Math.round(k)) < 1e-6
}

/** A square's centre from its key, or undefined unless it's the centre of a fine or coarse square, so no exact spot can be stored. */
export function parseCell(key: string): LatLng | undefined {
  const m = /^(-?\d{1,2}\.\d{4}),(-?\d{1,3}\.\d{4})$/.exec(key)
  if (!m) return undefined
  const c = { lat: Number(m[1]), lng: Number(m[2]) }
  if (Math.abs(c.lat) > 90 || Math.abs(c.lng) > 180) return undefined
  const fits = (size: { lat: number; lng: number }) => onGrid(c.lat, size.lat) && onGrid(c.lng, size.lng)
  return fits(FINE_CELL) || fits(COARSE_CELL) ? c : undefined
}

// ---------- Events ----------

/**
 * A tap worth counting: a short name, optionally with what was picked after a colon
 * ("filter:now", "tile:beer", "area:guelph"). "open" is the app opening (or coming back).
 */
export const EVENT_NAME = /^[a-z][a-z0-9-]{0,31}(:[a-z0-9-]{1,40})?$/
export const USAGE_LIMITS = { names: 60, count: 500 }

/** What each event means, for the owner's Usage screen. */
export const EVENT_LABELS: Record<string, string> = {
  open: 'Opened the app',
  venue: 'Opened a spot',
  search: 'Opened search',
  tile: 'Search tile',
  when: 'Search: when',
  sort: 'Search: sort',
  filter: 'Filter chip',
  favourite: 'Starred a spot',
  unfavourite: 'Unstarred a spot',
  share: 'Shared a spot',
  meet: 'Sent a “meet at”',
  directions: 'Directions',
  book: 'Booking link',
  'google-maps': 'Google Maps',
  call: 'Called',
  website: 'Website',
  menu: 'Menu',
  instagram: 'Instagram',
  'live-activity': 'Live Activity',
  'check-in': 'Checked a deal',
  contribute: 'Added a deal',
  claim: 'Claimed a spot',
  chat: 'Opened chat',
  'chat-send': 'Sent a chat message',
  'area-menu': 'Opened the area menu',
  area: 'Switched area',
  'time-preview': 'Time preview',
  locate: 'Locate me',
  'sign-in': 'Signed in',
  account: 'Opened account',
  'favourites-strip': 'Your spots strip',
  link: 'Opened a shared link',
}

/** "tile:beer" → "Search tile: beer"; unknown names show as they are. */
export function eventLabel(name: string): string {
  const [base, detail] = name.split(':')
  const label = EVENT_LABELS[base] ?? base
  return detail ? `${label}: ${detail.replace(/-/g, ' ')}` : label
}

// ---------- Reports ----------

/** `today` and the `count - 1` days before it, newest first ("2026-10-28", "2026-10-27"…). */
export function recentDays(today: string, count: number): string[] {
  const [y, m, d] = today.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10))
}


export type UsagePlatform = 'ios' | 'web'

/** What an app sends: one area's taps on one day, and where it was opened. */
export interface UsageReport {
  platform: UsagePlatform
  /** The app's anonymous device id (the server keeps only a hash, for 90 days). */
  device?: string
  area: string
  /** Toronto date the taps happened (YYYY-MM-DD); today if missing. */
  day?: string
  /** The square the app was opened in (`cellKey`), only with an "open". */
  cell?: string
  events: Record<string, number>
}

export interface CleanReport {
  platform: UsagePlatform
  device?: string
  area: string
  day: string
  cell?: string
  events: [string, number][]
}

/**
 * Checks a report. `days` are the Toronto dates it may be for, today first (a phone may
 * send yesterday's taps); any other day counts as today.
 */
export function validateUsage(input: Partial<UsageReport> | null, areaIds: string[], days: string[]): CleanReport | { error: string } {
  if (!input || typeof input !== 'object') return { error: 'Bad request.' }
  const { platform, device, area, day, cell, events } = input
  if (platform !== 'ios' && platform !== 'web') return { error: 'Unknown platform.' }
  if (typeof area !== 'string' || !areaIds.includes(area)) return { error: 'Unknown area.' }
  if (device != null && (typeof device !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(device))) return { error: 'Bad device.' }
  if (cell != null && (typeof cell !== 'string' || !parseCell(cell))) return { error: 'Bad cell.' }
  if (!events || typeof events !== 'object' || Array.isArray(events)) return { error: 'No events.' }
  const entries = Object.entries(events)
  if (!entries.length) return { error: 'No events.' }
  if (entries.length > USAGE_LIMITS.names) return { error: 'Too many events.' }
  for (const [name, count] of entries) {
    if (!EVENT_NAME.test(name)) return { error: `Bad event: ${name.slice(0, 40)}` }
    if (!Number.isInteger(count) || count < 1 || count > USAGE_LIMITS.count) return { error: 'Bad count.' }
  }
  return {
    platform,
    device: device ?? undefined,
    area,
    day: typeof day === 'string' && days.includes(day) ? day : days[0],
    cell: cell && events.open ? cell : undefined,
    events: entries,
  }
}

// ---------- The owner's summary ----------

export interface UsageSummary {
  days: number
  from: string
  to: string
  /** App opens, phones (distinct devices), and taps other than opening. */
  totals: { opens: number; people: number; taps: number }
  byDay: { day: string; opens: number; people: number }[]
  areas: { area: string; opens: number; people: number }[]
  platforms: { platform: UsagePlatform; opens: number }[]
  /** Where the apps were opened: square centres with how many opens. */
  cells: { area: string; lat: number; lng: number; opens: number }[]
  events: { name: string; label: string; count: number }[]
}
