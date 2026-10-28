import { isOpenLate, openState } from './hours'
import type { Clock } from './time'
import type { Amenity, Venue } from './types'

// Vibe and amenity filters for search: some stored (patio, live music…), some
// worked out (open now and open late from hours, trivia from the specials).

export type VibeFilter = Amenity | 'open-now' | 'open-late' | 'trivia'

export interface VibeInfo {
  id: VibeFilter
  label: string
  emoji: string
}

export const VIBES: VibeInfo[] = [
  { id: 'open-now', label: 'Open now', emoji: '🟢' },
  { id: 'patio', label: 'Patio', emoji: '☀️' },
  { id: 'live-music', label: 'Live music', emoji: '🎶' },
  { id: 'sports', label: 'Sports on TV', emoji: '📺' },
  { id: 'trivia', label: 'Trivia', emoji: '🧠' },
  { id: 'open-late', label: 'Open late', emoji: '🌙' },
  { id: 'groups', label: 'Good for groups', emoji: '👥' },
  { id: 'dogs', label: 'Dog-friendly', emoji: '🐕' },
]

const BY_ID = new Map(VIBES.map((v) => [v.id, v]))
export const vibeInfo = (id: VibeFilter) => BY_ID.get(id)!

const mentionsTrivia = (venue: Venue) =>
  [...venue.tags, ...(venue.dailySpecials ?? []).flatMap((d) => [d.title ?? '', d.note ?? ''])].some((t) => /trivia|quiz/i.test(t))

export function hasVibe(venue: Venue, vibe: VibeFilter, clock: Clock): boolean {
  switch (vibe) {
    case 'open-now':
      return openState(venue, clock).kind === 'open'
    case 'open-late':
      return isOpenLate(venue)
    case 'trivia':
      return mentionsTrivia(venue)
    default:
      return venue.amenities?.includes(vibe) ?? false
  }
}

/** The amenities worth showing on a venue's page, in display order (not "open now", which has its own line). */
export const venueVibes = (venue: Venue, clock: Clock): VibeInfo[] =>
  VIBES.filter((v) => v.id !== 'open-now' && hasVibe(venue, v.id, clock))
