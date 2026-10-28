import { useMemo } from 'react'
import { dailyLabel, dailyToday } from '../lib/daily'
import { focusWindow, pinLabel, shortLabel, type RankedVenue } from '../lib/deals'
import { placeLabels, sideOfLine, type LabelRequest, type Side } from '../lib/declutter'
import { formatTime, type Clock } from '../lib/time'
import type { Area } from '../lib/types'

export interface PinModel {
  rv: RankedVenue
  label?: string
  side?: Side
  zIndex: number
  /** No happy hour (outside the Daily specials view): drawn as a faint dot. */
  quiet: boolean
  /** A quiet spot with a daily special today: a faint honey ring. */
  special: boolean
  /** In the Daily specials view. */
  daily: boolean
}

const RANK = { live: 3, soon: 2, later: 1, none: 0 } as const

/** Decides which pins get a label and on which side, for the current zoom. */
export function usePinLabels(
  area: Area,
  items: RankedVenue[],
  selectedId: string | null,
  worldSize: number,
  /** The map's current rotation; labels are placed in screen space. */
  bearing = area.bearing,
  /** The time shown in the app, for daily specials. */
  now?: Clock,
  /** The Daily specials view: pins are labelled with today's special. */
  daily = false,
): PinModel[] {
  // Labels only need re-placing when the zoom moves noticeably.
  const bucket = Math.round(Math.log2(worldSize) * 20)

  return useMemo(() => {
    const todays = (rv: RankedVenue) => (now ? dailyToday(rv.venue, now) : undefined)
    const textFor = (rv: RankedVenue): string | undefined => {
      if (daily) {
        const special = todays(rv)
        return special ? shortLabel(dailyLabel(special)) : undefined
      }
      const { status } = rv
      if (status.kind === 'live') return pinLabel(focusWindow(status))
      if (status.kind === 'soon') return formatTime(status.startsAt, { compact: true })
      return undefined
    }

    const prioritized = [...items].sort((a, b) => {
      if (a.venue.id === selectedId) return -1
      if (b.venue.id === selectedId) return 1
      return RANK[b.status.kind] - RANK[a.status.kind] || a.distanceM - b.distanceM
    })

    const requests: LabelRequest[] = prioritized.flatMap((rv) => {
      const text = textFor(rv)
      return text ? [{ id: rv.venue.id, point: rv.venue, text, preferred: sideOfLine(rv.venue, area.spine) }] : []
    })
    // Quiet dots (no happy hour) are faint enough for labels to sit over them.
    const dots = items.filter((rv) => daily || rv.venue.happyHours.length > 0).map((rv) => rv.venue)
    const sides = placeLabels(requests, dots, 2 ** (bucket / 20), bearing)

    return items.map((rv) => {
      const side = sides.get(rv.venue.id)
      const selected = rv.venue.id === selectedId
      const quiet = !daily && rv.venue.happyHours.length === 0
      return {
        rv,
        side,
        label: side ? textFor(rv) : undefined,
        zIndex: selected ? 100 : (daily ? 2 : RANK[rv.status.kind]) * 10 + (side ? 5 : 0),
        quiet,
        special: quiet && todays(rv) !== undefined,
        daily,
      }
    })
  }, [area, items, selectedId, bucket, bearing, now, daily])
}
