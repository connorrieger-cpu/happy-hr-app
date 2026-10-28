import type { LatLng } from './types'

const EARTH_RADIUS_M = 6_371_000
/** Average city walking pace, 4.8 km/h. */
const WALK_METERS_PER_MIN = 80

export function distanceMeters(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

export function walkMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / WALK_METERS_PER_MIN))
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1)} km`
}
