import type { Amenity, Area, OpenSpan, Venue, Weekday } from '../../lib/types'

// Merges an area's research (deals.json and directory.json) with Google's details
// (candidates.json) into the listed venues (venues.json). Run by `npm run areas`; the
// tests check venues.json is up to date.

export interface Candidate {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  googleMapsUrl?: string
  website?: string
  phone?: string
  /** [day (0 = Sunday), open, close] in minutes after midnight. */
  hours?: [number, number, number][]
  amenities?: Amenity[]
  chain?: string
}

/** A researched spot: the app's Venue, with what Google already knows left out. */
export type Researched = Partial<Venue> & Pick<Venue, 'id' | 'name' | 'category' | 'vibe'> & { placeId?: string }

/**
 * "123 Augusta Ave, Toronto, ON M5T 2L4, Canada" → "123 Augusta Ave". With more than one
 * city, addresses outside the first keep their city: "67 Bronte Rd, Oakville".
 */
export function shortAddress(address: string, city: string | string[]): string {
  const parts = address.split(',').map((p) => p.trim())
  const cities = (Array.isArray(city) ? city : [city]).map((c) => c.toLowerCase())
  const at = parts.findIndex((p) => cities.includes(p.toLowerCase()))
  if (at <= 0) return parts[0]
  return parts.slice(0, cities.indexOf(parts[at].toLowerCase()) > 0 ? at + 1 : at).join(', ')
}

const span = ([day, open, close]: [number, number, number]): OpenSpan => ({ day: day as Weekday, open, close })

export function mergeArea(area: Area, deals: Researched[], directory: Researched[], candidates: Candidate[]): Venue[] {
  const byPlace = new Map(candidates.map((c) => [c.placeId, c]))
  const city = [area.addressCity ?? area.city, ...(area.alsoCities ?? [])]
  const seen = new Set<string>()
  const venues: Venue[] = []
  for (const r of [...deals, ...directory]) {
    if (seen.has(r.id)) throw new Error(`${area.id}: "${r.id}" is listed twice`)
    seen.add(r.id)
    const c = r.placeId ? byPlace.get(r.placeId) : undefined
    if (r.placeId && !c) throw new Error(`${area.id}: ${r.id} has a placeId that isn't in candidates.json`)
    const lat = r.lat ?? c?.lat
    const lng = r.lng ?? c?.lng
    const address = r.address ?? (c ? shortAddress(c.address, city) : undefined)
    if (lat == null || lng == null || !address) throw new Error(`${area.id}: ${r.id} needs a placeId, or an address and coordinates`)
    const amenities = [...new Set([...(c?.amenities ?? []), ...(r.amenities ?? [])])]
    const venue: Venue = {
      id: r.id,
      name: r.name,
      category: r.category,
      vibe: r.vibe,
      address,
      lat,
      lng,
      tags: r.tags ?? [],
      happyHours: r.happyHours ?? [],
      deals: r.deals ?? 'none',
    }
    if (r.dailySpecials?.length) venue.dailySpecials = r.dailySpecials
    if (r.food?.length) venue.food = r.food
    if (r.aka?.length) venue.aka = r.aka
    const hours = r.hours ?? c?.hours?.map(span)
    if (hours?.length) venue.hours = hours
    if (amenities.length) venue.amenities = amenities
    if (r.placeId) venue.placeId = r.placeId
    if (r.menuUrl) venue.menuUrl = r.menuUrl
    if (r.checked) venue.checked = r.checked
    if (r.sources?.length) venue.sources = r.sources
    const phone = r.phone ?? c?.phone
    if (phone) venue.phone = phone
    const website = r.website ?? c?.website
    if (website) venue.website = website
    const maps = r.googleMapsUrl ?? c?.googleMapsUrl
    if (maps) venue.googleMapsUrl = maps
    if (r.booking) venue.booking = r.booking
    venues.push(venue)
  }
  return venues
}
