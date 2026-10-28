// The curated venue lists, served to native apps from the same TypeScript the
// web app bundles, so there's one source of truth. One payload per area, built
// once per worker and versioned by a hash of its contents.
import { AREA_LIST, DEFAULT_AREA, LOADERS } from '../src/data/areas'
import { FOOD_TYPES } from '../src/lib/food'
import type { Area, Venue } from '../src/lib/types'

/** Bump when the payload's shape changes in a way old apps can't read. */
export const SCHEMA_VERSION = 1

export interface VenuesPayload {
  schemaVersion: number
  /** Changes whenever any venue or deal changes; also the ETag. */
  version: string
  area: Area
  /** Every area, for the area menu and for working out where someone is. */
  areas: Area[]
  foodTypes: typeof FOOD_TYPES
  venues: Venue[]
}

const cached = new Map<string, Promise<{ payload: VenuesPayload; body: string }>>()

async function build(id: string) {
  const { area, venues } = await LOADERS[id]()
  const content = { schemaVersion: SCHEMA_VERSION, area, areas: AREA_LIST, foodTypes: FOOD_TYPES, venues }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(content)))
  const version = [...new Uint8Array(digest)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const payload: VenuesPayload = { ...content, version }
  return { payload, body: JSON.stringify(payload) }
}

/** An area's payload; Ossington when no area is given (what apps from before areas ask for). Undefined for an unknown area. */
export function venuesPayload(id: string = DEFAULT_AREA.id) {
  if (!LOADERS[id]) return undefined
  let entry = cached.get(id)
  if (!entry) {
    entry = build(id)
    cached.set(id, entry)
  }
  return entry
}

let everywhere: Promise<Map<string, { area: Area; venue: Venue }>> | undefined

/** A listed spot in any area, by id (ids are unique across areas; the tests check). */
export async function findVenue(id: string): Promise<{ area: Area; venue: Venue } | undefined> {
  everywhere ??= Promise.all(AREA_LIST.map((a) => LOADERS[a.id]())).then(
    (all) => new Map(all.flatMap(({ area, venues }) => venues.map((venue) => [venue.id, { area, venue }] as const))),
  )
  return (await everywhere).get(id)
}
