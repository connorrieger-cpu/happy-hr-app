import { toScreen } from './mapMath'
import type { LatLng } from './types'

// Map-agnostic label placement. Venues on Ossington sit a few metres apart, so
// pin labels collide constantly. Labels are placed greedily in priority order,
// beside their pin on the preferred side (away from the street), then the other
// side, and otherwise dropped so that only the pin's dot shows.

export type Side = 'left' | 'right'

export interface LabelRequest {
  id: string
  point: LatLng
  text: string
  preferred: Side
}

interface Rect {
  x1: number
  y1: number
  x2: number
  y2: number
}

const LABEL_HEIGHT = 28
const DOT_GAP = 11
const CHAR_WIDTH = 7.1
const LABEL_PADDING = 22
const DOT_RADIUS = 8

const overlaps = (a: Rect, b: Rect) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1

export function labelWidth(text: string): number {
  return text.length * CHAR_WIDTH + LABEL_PADDING
}

export function placeLabels(
  requests: LabelRequest[],
  dots: LatLng[],
  worldSize: number,
  bearing = 0,
): Map<string, Side> {
  const taken: Rect[] = dots.map((d) => {
    const { x, y } = toScreen(d, worldSize, bearing)
    return { x1: x - DOT_RADIUS, y1: y - DOT_RADIUS, x2: x + DOT_RADIUS, y2: y + DOT_RADIUS }
  })
  const placed = new Map<string, Side>()

  for (const req of requests) {
    const { x, y } = toScreen(req.point, worldSize, bearing)
    const w = labelWidth(req.text)
    const rectFor = (side: Side): Rect =>
      side === 'right'
        ? { x1: x + DOT_GAP, x2: x + DOT_GAP + w, y1: y - LABEL_HEIGHT / 2, y2: y + LABEL_HEIGHT / 2 }
        : { x1: x - DOT_GAP - w, x2: x - DOT_GAP, y1: y - LABEL_HEIGHT / 2, y2: y + LABEL_HEIGHT / 2 }

    const other: Side = req.preferred === 'left' ? 'right' : 'left'
    for (const side of [req.preferred, other]) {
      const rect = rectFor(side)
      // Ignore the label's own dot, which sits just outside the rect anyway.
      if (!taken.some((r) => overlaps(r, rect))) {
        taken.push(rect)
        placed.set(req.id, side)
        break
      }
    }
  }
  return placed
}

/** Which side of a street (given as two points along it) a point lies on. */
export function sideOfLine(p: LatLng, [a, b]: [LatLng, LatLng]): Side {
  const cross = (b.lng - a.lng) * (p.lat - a.lat) - (b.lat - a.lat) * (p.lng - a.lng)
  return cross > 0 ? 'left' : 'right'
}
