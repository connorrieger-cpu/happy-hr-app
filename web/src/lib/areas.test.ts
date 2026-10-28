import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { AREA_LIST, DEFAULT_AREA, LOADERS } from '../data/areas'
import { mergeArea } from '../data/areas/merge'
import { areaAt, inArea, inRegion, metersToRegion } from './areas'

const folder = (id: string) => new URL(`../data/areas/${id}/`, import.meta.url)
const read = (id: string, file: string, fallback: unknown) => {
  const url = new URL(file, folder(id))
  return existsSync(url) ? JSON.parse(readFileSync(url, 'utf8')) : fallback
}

describe('areas', () => {
  it('puts people in the area they’re standing in', () => {
    expect(areaAt({ lat: 43.6496, lng: -79.4209 }, AREA_LIST)?.id).toBe('ossington')
    expect(areaAt({ lat: 43.6545, lng: -79.4006 }, AREA_LIST)?.id).toBe('kensington')
    expect(areaAt({ lat: 43.64445, lng: -79.40006 }, AREA_LIST)?.id).toBe('king-west')
    expect(areaAt({ lat: 43.5446, lng: -80.2482 }, AREA_LIST)?.id).toBe('guelph')
    expect(areaAt({ lat: 43.3255, lng: -79.799 }, AREA_LIST)?.id).toBe('burlington')
  })

  it('gives the nearest area to someone just outside, and none far away', () => {
    expect(areaAt({ lat: 43.6487, lng: -79.3963 }, AREA_LIST)).toBeDefined()
    expect(areaAt({ lat: 45.5017, lng: -73.5673 }, AREA_LIST)).toBeUndefined()
  })

  it('keeps both sides of a neighbourhood’s boundary streets', () => {
    const kensington = AREA_LIST.find((a) => a.id === 'kensington')!
    expect(inArea({ lat: 43.6551, lng: -79.4067 }, kensington)).toBe(true)
    expect(inArea({ lat: 43.6548, lng: -79.4085 }, kensington)).toBe(false)
  })

  it.each(AREA_LIST.map((a) => [a.id, a] as const))('%s is set up', (id, area) => {
    expect(LOADERS[id], 'add it to LOADERS').toBeDefined()
    expect(area.region.length).toBeGreaterThanOrEqual(3)
    expect(inRegion(area.origin, area.region), 'origin is inside the region').toBe(true)
    expect(inRegion(area.center, area.region), 'center is inside the region').toBe(true)
    expect(metersToRegion(area.origin, area.region)).toBe(0)
    const { south, west, north, east } = area.bounds
    expect(area.origin.lat > south && area.origin.lat < north && area.origin.lng > west && area.origin.lng < east, 'the map opens on the origin').toBe(true)
  })

  it('starts far-away people in an area that exists', () => {
    expect(AREA_LIST).toContain(DEFAULT_AREA)
  })
})

describe('area venues', async () => {
  const all = await Promise.all(AREA_LIST.map((a) => LOADERS[a.id]()))

  it('gives every spot an id no other area uses (check-ins and favourites are keyed by it)', () => {
    const seen = new Map<string, string>()
    for (const { area, venues } of all)
      for (const v of venues) {
        expect(seen.get(v.id), `${v.id} is in ${seen.get(v.id)} and ${area.id}`).toBeUndefined()
        seen.set(v.id, area.id)
      }
  })

  it.each(all.map((d) => [d.area.id, d] as const))('%s lists only its own spots', (_, { area, venues }) => {
    const outside = venues.filter((v) => !inArea(v, area)).map((v) => v.id)
    expect(outside).toEqual([])
  })

  // Ossington is written by hand in src/data/ossington.ts; the others are built.
  it.each(AREA_LIST.filter((a) => existsSync(new URL('candidates.json', folder(a.id)))).map((a) => [a.id, a] as const))(
    '%s venues.json is up to date (run npm run areas)',
    async (id, area) => {
      const built = mergeArea(area, read(id, 'deals.json', []), read(id, 'directory.json', []), read(id, 'candidates.json', { candidates: [] }).candidates)
      expect(read(id, 'venues.json', [])).toEqual(built)
    },
  )
})
