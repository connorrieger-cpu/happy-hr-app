import { inArea, metersToRegion, NEAR_METERS } from './areas'
import type { Area, DailySpecial, HappyHourWindow, LatLng, Special, Venue, Weekday } from './types'

// Community updates: people add happy hours or daily specials (to a listed
// venue or a new place) and say whether a deal worked. Shared by the app and the Cloudflare functions,
// so validation is identical on both sides. No React or DOM here.

export type SubmissionKind = 'happy-hour' | 'daily'

/** What the app sends when someone adds a happy hour or a daily special. */
export interface SubmissionInput {
  device: string
  /** Defaults to 'happy-hour'. */
  kind?: SubmissionKind
  /** A daily special's name, e.g. "Taco Tuesday". */
  title?: string
  /** A listed venue this adds to; omitted for a new place. */
  venueId?: string
  venueName: string
  address?: string
  lat?: number
  lng?: number
  days: Weekday[]
  /** Required for a happy hour; a daily special without hours runs all day. */
  start?: number
  end?: number
  specials: Special[]
  note?: string
  /** A venue's own key: the deal then shows as "From the venue". */
  venueKey?: string
}

/** A stored submission, as the API returns it. */
export interface CommunitySubmission extends Omit<SubmissionInput, 'device' | 'venueKey'> {
  id: string
  createdAt: string
  /** Posted by the venue itself (with its venue key). */
  byVenue?: boolean
}

/** POST /api/claims: someone who runs a venue asks to manage its page. */
export interface ClaimInput {
  device: string
  venueId: string
  name: string
  /** "Owner", "Manager"… */
  role?: string
  /** An email address or phone number. */
  contact: string
  message?: string
}

export interface VoteInput {
  device: string
  venueId: string
  worked: boolean
}

/** Votes for one venue over the last 30 days. */
export interface VoteTally {
  yes: number
  no: number
  lastYes: string | null
  lastNo: string | null
}

export interface CommunityData {
  submissions: CommunitySubmission[]
  votes: Record<string, VoteTally>
}

export const LIMITS = {
  name: 80,
  role: 40,
  contact: 120,
  title: 40,
  address: 120,
  item: 60,
  note: 280,
  specials: 6,
  price: 500,
}

// Any app-made id: a UUID (Apple's are uppercase) or similar. The server stores it lowercased.
const DEVICE_RE = /^[a-z0-9-]{8,64}$/i
const VENUE_ID_RE = /^[a-z0-9-]{1,80}$/
/** "HHV-7K2M-QX9D-4FTW"; checked loosely so a mistyped key gets a clear answer from the server. */
export const VENUE_KEY_RE = /^[A-Z0-9-]{8,40}$/i

const isWeekday = (d: unknown): d is Weekday => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6
const isMinute = (m: unknown, max: number) => Number.isInteger(m) && (m as number) >= 0 && (m as number) <= max

/** Returns an error message, or null when the submission is acceptable. */
/** Checks a submission; with `areas`, a new place must be in or near one of them. */
export function validateSubmission(input: Partial<SubmissionInput>, areas: Area[] = []): string | null {
  if (typeof input.device !== 'string' || !DEVICE_RE.test(input.device)) return 'Missing device id.'
  if (input.venueId != null && (typeof input.venueId !== 'string' || !VENUE_ID_RE.test(input.venueId))) return 'Unknown venue.'
  if (input.venueKey != null && (typeof input.venueKey !== 'string' || !VENUE_KEY_RE.test(input.venueKey) || !input.venueId)) {
    return 'That venue key doesn’t look right.'
  }
  const name = input.venueName?.trim()
  if (!name || name.length > LIMITS.name) return 'Add the venue’s name.'
  if (input.venueId == null) {
    const address = input.address?.trim()
    if (!address || address.length > LIMITS.address) return 'Add the venue’s street address.'
    if (input.lat != null || input.lng != null) {
      if (typeof input.lat !== 'number' || typeof input.lng !== 'number') return 'Bad location.'
      const p = { lat: input.lat, lng: input.lng }
      if (areas.length && !areas.some((a) => metersToRegion(p, a.region) <= NEAR_METERS)) return 'That address isn’t in one of our areas.'
    }
  }
  if (!Array.isArray(input.days) || input.days.length === 0 || !input.days.every(isWeekday)) return 'Pick at least one day.'
  if (new Set(input.days).size !== input.days.length) return 'Each day can only be picked once.'
  if (input.kind != null && input.kind !== 'happy-hour' && input.kind !== 'daily') return 'Unknown kind of deal.'
  const daily = input.kind === 'daily'
  if (input.title != null && (typeof input.title !== 'string' || input.title.length > LIMITS.title)) return 'The name is too long.'
  if (!(daily && input.start == null && input.end == null)) {
    if (!isMinute(input.start, 24 * 60 - 1) || !isMinute(input.end, 30 * 60)) return 'Pick a start and end time.'
    if ((input.end as number) <= (input.start as number)) return 'The end time must be after the start.'
    if (!daily && (input.end as number) - (input.start as number) > 16 * 60) return 'That’s longer than a happy hour.'
  }
  const specials = input.specials
  if (!Array.isArray(specials) || specials.length === 0) return 'Add at least one special.'
  if (specials.length > LIMITS.specials) return `Up to ${LIMITS.specials} specials.`
  for (const s of specials) {
    if (s?.kind !== 'drink' && s?.kind !== 'food') return 'Each special is a drink or food.'
    const item = typeof s.item === 'string' ? s.item.trim() : ''
    if (!item || item.length > LIMITS.item) return 'Describe each special.'
    if (s.price != null && (typeof s.price !== 'number' || !(s.price >= 0) || s.price > LIMITS.price)) return 'Check the prices.'
  }
  if (input.note != null && (typeof input.note !== 'string' || input.note.length > LIMITS.note)) return 'The note is too long.'
  return null
}

export function validateClaim(input: Partial<ClaimInput>): string | null {
  if (typeof input.device !== 'string' || !DEVICE_RE.test(input.device)) return 'Missing device id.'
  if (typeof input.venueId !== 'string' || !VENUE_ID_RE.test(input.venueId)) return 'Unknown venue.'
  const name = input.name?.trim()
  if (!name || name.length > LIMITS.name) return 'Add your name.'
  if (input.role != null && (typeof input.role !== 'string' || input.role.length > LIMITS.role)) return 'Keep the role short.'
  const contact = input.contact?.trim() ?? ''
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
  const phone = (contact.match(/\d/g) ?? []).length >= 10
  if (!contact || contact.length > LIMITS.contact || !(email || phone)) return 'Add an email or phone number we can reach you at.'
  if (input.message != null && (typeof input.message !== 'string' || input.message.length > LIMITS.note)) return 'The message is too long.'
  return null
}

export function validateVote(input: Partial<VoteInput>): string | null {
  if (typeof input.device !== 'string' || !DEVICE_RE.test(input.device)) return 'Missing device id.'
  if (typeof input.venueId !== 'string' || !VENUE_ID_RE.test(input.venueId)) return 'Unknown venue.'
  if (typeof input.worked !== 'boolean') return 'Say whether it worked.'
  return null
}

/** Venue id for a place that only exists because of a submission. */
export const communityVenueId = (submissionId: string) => `c-${submissionId}`

/**
 * Adds community happy hours to the curated list: windows on listed venues are
 * appended (never replacing the curated ones), and new places become venues
 * marked 'community'. Submissions for the same new place (same name and
 * address) are grouped into one venue.
 */
export function mergeCommunity(venues: Venue[], submissions: CommunitySubmission[], fallback: LatLng, city = 'Toronto'): Venue[] {
  // Keyed by id, so later submissions can add to community-added places too
  // (submissions arrive oldest first, so a place always exists before additions).
  const merged = new Map(venues.map((v) => [v.id, { ...v, happyHours: [...v.happyHours] }]))
  const newPlaces = new Map<string, Venue>()

  /** Adds the submission to a venue as a happy-hour window or a daily special. */
  const addTo = (venue: Venue, s: CommunitySubmission) => {
    const community = { id: s.id, createdAt: s.createdAt, ...(s.byVenue && { byVenue: true }) }
    const note = s.byVenue
      ? s.note
        ? `From ${venue.name}: “${s.note}”`
        : `Posted by ${venue.name}.`
      : s.note
        ? `Community: “${s.note}”`
        : 'Added by the community.'
    if (s.kind === 'daily') {
      const special: DailySpecial = { days: s.days, specials: s.specials, note, community }
      if (s.title?.trim()) special.title = s.title.trim()
      if (s.start != null && s.end != null) Object.assign(special, { start: s.start, end: s.end })
      venue.dailySpecials = [...(venue.dailySpecials ?? []), special]
    } else {
      const window: HappyHourWindow = { days: s.days, start: s.start ?? 0, end: s.end ?? 0, specials: s.specials, note, community }
      venue.happyHours.push(window)
    }
  }

  for (const s of submissions) {
    const listed = s.venueId ? merged.get(s.venueId) : undefined
    if (listed) {
      addTo(listed, s)
      // A spot with no researched deal is now known through the venue itself or the community.
      if (s.byVenue && (listed.deals === 'none' || listed.deals === 'community' || listed.deals === 'reported')) listed.deals = 'venue'
      else if (listed.deals === 'none') listed.deals = 'community'
      continue
    }
    const key = `${s.venueName.trim().toLowerCase()}|${(s.address ?? '').trim().toLowerCase()}`
    const place = newPlaces.get(key)
    if (place) {
      addTo(place, s)
      continue
    }
    const venue: Venue = {
      id: communityVenueId(s.id),
      name: s.venueName.trim(),
      category: 'Added by the community',
      vibe: 'bar',
      address: s.address?.trim() ?? '',
      lat: s.lat ?? fallback.lat,
      lng: s.lng ?? fallback.lng,
      tags: ['Community'],
      deals: 'community',
      happyHours: [],
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.venueName}, ${s.address ?? ''}, ${city}`)}`,
    }
    addTo(venue, s)
    newPlaces.set(key, venue)
    merged.set(venue.id, venue)
  }
  return [...merged.values()]
}

/**
 * The submissions that belong to an area: those for its listed spots, and new places inside
 * it (with later additions to them). New places sent before areas existed have no location
 * check beyond the area they were added in, so `legacy` areas (Ossington) keep those.
 */
export function submissionsForArea(submissions: CommunitySubmission[], area: Area, venues: Venue[], legacy = false): CommunitySubmission[] {
  const ids = new Set(venues.map((v) => v.id))
  return submissions.filter((s) => {
    if (s.venueId && ids.has(s.venueId)) return true
    if (s.venueId) return false
    const here = s.lat != null && s.lng != null ? inArea({ lat: s.lat, lng: s.lng }, area) : legacy
    if (here) ids.add(communityVenueId(s.id))
    return here
  })
}

const DAY_MS = 24 * 60 * 60 * 1000

export type VoteMood = 'confirmed' | 'disputed' | 'none'

/** A short, honest read of recent votes, e.g. "Worked for 3 people · 2 days ago". */
export function voteSummary(tally: VoteTally | undefined, now = Date.now()): { mood: VoteMood; text: string } {
  if (!tally || tally.yes + tally.no === 0) return { mood: 'none', text: 'No check-ins yet' }
  const ago = (iso: string | null) => {
    if (!iso) return ''
    const days = Math.floor((now - Date.parse(iso)) / DAY_MS)
    return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
  }
  const recentNo = tally.lastNo != null && now - Date.parse(tally.lastNo) < 7 * DAY_MS
  if (tally.no > tally.yes && recentNo) {
    return { mood: 'disputed', text: `${tally.no} said it didn’t work · last ${ago(tally.lastNo)}` }
  }
  if (tally.yes > 0) {
    const people = tally.yes === 1 ? '1 person' : `${tally.yes} people`
    const doubts = tally.no > 0 ? ` · ${tally.no} said it didn’t` : ''
    return { mood: 'confirmed', text: `Worked for ${people} · last ${ago(tally.lastYes)}${doubts}` }
  }
  return { mood: 'disputed', text: `${tally.no} said it didn’t work · last ${ago(tally.lastNo)}` }
}
