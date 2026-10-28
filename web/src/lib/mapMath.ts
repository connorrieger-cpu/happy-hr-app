import type { LatLng } from './types'

// Web Mercator helpers shared by both map engines.
// worldSize is the width of the whole world in pixels at the current zoom:
// 256·2^zoom for Google Maps, 512·2^zoom for MapLibre.

export const googleWorldSize = (zoom: number) => 256 * 2 ** zoom
export const maplibreWorldSize = (zoom: number) => 512 * 2 ** zoom

export function project(p: LatLng, worldSize: number): { x: number; y: number } {
  const sin = Math.sin((p.lat * Math.PI) / 180)
  return {
    x: ((p.lng + 180) / 360) * worldSize,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize,
  }
}

export function unproject({ x, y }: { x: number; y: number }, worldSize: number): LatLng {
  const lng = (x / worldSize) * 360 - 180
  const n = Math.PI - (2 * Math.PI * y) / worldSize
  return { lat: (Math.atan(Math.sinh(n)) * 180) / Math.PI, lng }
}

/** Rotates world pixels into screen orientation for a map rotated to `bearing` degrees. */
export function toScreen(p: LatLng, worldSize: number, bearing: number) {
  const { x, y } = project(p, worldSize)
  const t = (-bearing * Math.PI) / 180
  return { x: x * Math.cos(t) - y * Math.sin(t), y: x * Math.sin(t) + y * Math.cos(t) }
}

/**
 * The map centre that puts `p` at a point shifted (dx, dy) screen pixels from the
 * viewport centre. Used to keep a selected pin clear of the sheet on Google Maps,
 * which has no camera padding option.
 */
export function centerFor(p: LatLng, dx: number, dy: number, worldSize: number, bearing: number): LatLng {
  const t = (bearing * Math.PI) / 180
  const wx = dx * Math.cos(t) - dy * Math.sin(t)
  const wy = dx * Math.sin(t) + dy * Math.cos(t)
  const { x, y } = project(p, worldSize)
  return unproject({ x: x - wx, y: y - wy }, worldSize)
}
