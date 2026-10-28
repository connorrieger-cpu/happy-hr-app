import { dailyLabel, dailyToday } from './daily'
import type { RankedVenue } from './deals'
import { openLabel, openState } from './hours'
import { DAY_SHORT, formatTime, type Clock } from './time'

// Favourite spots: the short line each shows in "Your spots", and which ones
// deserve a heads-up because their happy hour is about to start.

export type FavouriteTone = 'live' | 'soon' | 'today' | 'quiet'

export interface FavouriteLine {
  rv: RankedVenue
  /** "On · till 6 PM", "Starts 4 PM", "Taco Tuesday today", "Tue 4 PM", "Open · till 2 AM". */
  label: string
  tone: FavouriteTone
}

const ORDER: Record<FavouriteTone, number> = { live: 0, soon: 1, today: 2, quiet: 3 }

export function favouriteLines(items: RankedVenue[], ids: string[], clock: Clock): FavouriteLine[] {
  const chosen = items.filter((rv) => ids.includes(rv.venue.id))
  return chosen
    .map((rv): FavouriteLine => {
      const s = rv.status
      if (s.kind === 'live') return { rv, tone: 'live', label: `On · till ${formatTime(s.endsAt, { compact: true })}` }
      if (s.kind === 'soon' || s.kind === 'later') return { rv, tone: 'soon', label: `Starts ${formatTime(s.startsAt, { compact: true })}` }
      const daily = dailyToday(rv.venue, clock)
      if (daily) return { rv, tone: 'today', label: `${dailyLabel(daily)} today` }
      if (s.kind === 'none' && s.next) return { rv, tone: 'quiet', label: `${DAY_SHORT[s.next.day]} ${formatTime(s.next.startsAt, { compact: true })}` }
      return { rv, tone: 'quiet', label: openLabel(openState(rv.venue, clock), clock.day) || rv.venue.category }
    })
    .sort((a, b) => ORDER[a.tone] - ORDER[b.tone] || a.rv.distanceM - b.rv.distanceM)
}

/** Heads-up window: a favourite's happy hour starting within this many minutes. */
export const HEADS_UP_MINUTES = 15

/** Favourites whose happy hour starts within the heads-up window. */
export function startingSoon(items: RankedVenue[], ids: string[]): RankedVenue[] {
  return items.filter((rv) => ids.includes(rv.venue.id) && rv.status.kind === 'soon' && rv.status.startsIn <= HEADS_UP_MINUTES)
}
