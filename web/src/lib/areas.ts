import type { Area, LatLng } from './types'

// Areas: which one someone is in, and which spots belong to one. Shared by the apps
// and the API. No React or DOM here.

/** How far past a neighbourhood's outline a spot still belongs to it (both sides of its boundary streets). */
export const EDGE_METERS = 45
/** Someone outside every area gets the nearest one within this distance; further away, none. */
export const NEAR_METERS = 3000

const rad = (d: number) => (d * Math.PI) / 180

/** Metres east and north of `origin`: flat enough for a city. */
function local(p: LatLng, origin: LatLng): [number, number] {
  return [rad(p.lng - origin.lng) * Math.cos(rad(origin.lat)) * 6_371_000, rad(p.lat - origin.lat) * 6_371_000]
}

/** Is the point inside the outline? */
export function inRegion(p: LatLng, region: LatLng[]): boolean {
  let inside = false
  for (let i = 0, j = region.length - 1; i < region.length; j = i++) {
    const a = region[i]
    const b = region[j]
    if (a.lat > p.lat !== b.lat > p.lat && p.lng < ((b.lng - a.lng) * (p.lat - a.lat)) / (b.lat - a.lat) + a.lng) inside = !inside
  }
  return inside
}

/** Metres from the point to the outline; 0 inside it. */
export function metersToRegion(p: LatLng, region: LatLng[]): number {
  if (inRegion(p, region)) return 0
  let best = Infinity
  for (let i = 0, j = region.length - 1; i < region.length; j = i++) {
    const [ax, ay] = local(region[j], p)
    const [bx, by] = local(region[i], p)
    const dx = bx - ax
    const dy = by - ay
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)))
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy))
  }
  return best
}

/** The outline's size, to prefer a neighbourhood over a city around it. */
function regionSize(region: LatLng[]): number {
  let sum = 0
  for (let i = 0, j = region.length - 1; i < region.length; j = i++) sum += region[j].lng * region[i].lat - region[i].lng * region[j].lat
  return Math.abs(sum) / 2
}

/** Does a spot at `p` belong to the area? Neighbourhoods keep both sides of their boundary streets. */
export function inArea(p: LatLng, area: Area): boolean {
  return metersToRegion(p, area.region) <= (area.addressCity ? 0 : EDGE_METERS)
}

/**
 * The area someone at `p` is in: the one whose outline contains them (the smallest, if
 * outlines overlap), else the nearest within NEAR_METERS, else none.
 */
export function areaAt(p: LatLng, areas: Area[]): Area | undefined {
  const containing = areas.filter((a) => inRegion(p, a.region)).sort((a, b) => regionSize(a.region) - regionSize(b.region))
  if (containing.length) return containing[0]
  let nearest: Area | undefined
  let best = NEAR_METERS
  for (const a of areas) {
    const d = metersToRegion(p, a.region)
    if (d <= best) {
      best = d
      nearest = a
    }
  }
  return nearest
}
