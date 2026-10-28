// Finds every bar and restaurant in an area with Google Places, for the deal research.
//
//   node scripts/places-sweep.mjs guelph            # from web/; needs GOOGLE_PLACES_SERVER_KEY in .env.local
//
// Reads src/data/areas/<id>/area.ts, tiles the area's region (splitting a tile whenever
// Google's 60-result cap is hit), keeps operating places inside the region (and in the
// area's city, for a whole city), drops places that don't serve alcohol, tags chains
// (src/data/chains.ts) and writes src/data/areas/<id>/candidates.json with hours, website and
// amenities, nearest to the area's centre first. Re-run it to refresh an area; details already
// in candidates.json are reused rather than fetched again.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chainOf } from '../src/data/chains.ts'
import { callCount, details, textSearch } from './places.mjs'

const id = process.argv[2]
if (!id) throw new Error('Usage: node scripts/places-sweep.mjs <area id>')
const dir = fileURLToPath(new URL(`../src/data/areas/${id}/`, import.meta.url))
const module = await import(pathToFileURL(`${dir}area.ts`).href)
const area = Object.values(module).find((v) => v && typeof v === 'object' && v.id === id)
if (!area) throw new Error(`No area "${id}" in ${dir}area.ts`)

// ---------- Geometry ----------

const R = 6371000
const rad = (d) => (d * Math.PI) / 180
function meters(a, b) {
  const x = rad(b.lng - a.lng) * Math.cos(rad((a.lat + b.lat) / 2))
  const y = rad(b.lat - a.lat)
  return Math.hypot(x, y) * R
}
function inside(p, poly) {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j]
    if (a.lat > p.lat !== b.lat > p.lat && p.lng < ((b.lng - a.lng) * (p.lat - a.lat)) / (b.lat - a.lat) + a.lng) hit = !hit
  }
  return hit
}
function distanceToEdge(p, poly) {
  let best = Infinity
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j], b = poly[i]
    const ax = 0, ay = 0
    const bx = meters(a, { lat: a.lat, lng: b.lng }) * Math.sign(b.lng - a.lng), by = meters(a, { lat: b.lat, lng: a.lng }) * Math.sign(b.lat - a.lat)
    const px = meters(a, { lat: a.lat, lng: p.lng }) * Math.sign(p.lng - a.lng), py = meters(a, { lat: p.lat, lng: a.lng }) * Math.sign(p.lat - a.lat)
    const t = Math.max(0, Math.min(1, ((px - ax) * bx + (py - ay) * by) / (bx * bx + by * by || 1)))
    best = Math.min(best, Math.hypot(px - t * bx, py - t * by))
  }
  return best
}
// Neighbourhoods keep both sides of their boundary streets; cities use their address instead.
const BUFFER = area.addressCity ? 0 : 45
const inArea = (p) => inside(p, area.region) || distanceToEdge(p, area.region) <= BUFFER

const lats = area.region.map((p) => p.lat), lngs = area.region.map((p) => p.lng)
const pad = 0.0006
const box = { south: Math.min(...lats) - pad, north: Math.max(...lats) + pad, west: Math.min(...lngs) - pad, east: Math.max(...lngs) + pad }

// ---------- Sweep ----------

const QUERIES = [
  { textQuery: 'restaurant', includedType: 'restaurant', strictTypeFiltering: true },
  { textQuery: 'bar', includedType: 'bar', strictTypeFiltering: true },
  { textQuery: 'pub' },
  { textQuery: 'brewery taproom' },
  { textQuery: 'wine bar' },
]
const FIELDS = ['id', 'displayName', 'formattedAddress', 'location', 'types', 'primaryType', 'primaryTypeDisplayName', 'businessStatus', 'googleMapsUri']
// Places that rarely or never serve alcohol, and fast food, takeout and delivery: the app
// lists sit-down spots people go out to.
const SKIP_TYPES = new Set([
  'meal_takeaway', 'pizza_delivery', 'sandwich_shop', 'salad_shop', 'hot_dog_stand', 'snack_bar',
  'cafe', 'coffee_shop', 'bakery', 'ice_cream_shop', 'dessert_shop', 'donut_shop', 'bagel_shop', 'fast_food_restaurant',
  'tea_house', 'juice_shop', 'acai_shop', 'confectionery', 'chocolate_shop', 'candy_store', 'food_court', 'cafeteria',
  'grocery_store', 'supermarket', 'convenience_store', 'liquor_store', 'catering_service', 'meal_delivery', 'dessert_restaurant',
])

const found = new Map()
const startKm = area.addressCity ? 2.5 : 10
const latStep = startKm / 111, lngStep = startKm / (111 * Math.cos(rad(box.south)))

async function sweep(tile, query, depth = 0) {
  const places = await textSearch(
    { ...query, locationRestriction: { rectangle: { low: { latitude: tile.south, longitude: tile.west }, high: { latitude: tile.north, longitude: tile.east } } } },
    FIELDS,
  )
  for (const p of places) found.set(p.id, p)
  const sideKm = (tile.north - tile.south) * 111
  if (places.length >= 60 && sideKm > 0.3 && depth < 6) {
    const midLat = (tile.south + tile.north) / 2, midLng = (tile.west + tile.east) / 2
    for (const [s, n] of [[tile.south, midLat], [midLat, tile.north]])
      for (const [w, e] of [[tile.west, midLng], [midLng, tile.east]]) await sweep({ south: s, north: n, west: w, east: e }, query, depth + 1)
  }
}

for (let s = box.south; s < box.north; s += latStep)
  for (let w = box.west; w < box.east; w += lngStep) {
    const tile = { south: s, north: Math.min(s + latStep, box.north), west: w, east: Math.min(w + lngStep, box.east) }
    for (const q of QUERIES) await sweep(tile, q)
  }
console.log(`${area.name}: ${found.size} places from ${callCount()} searches`)

// ---------- Filter ----------

// A whole city keeps only addresses in it (and in `alsoCities`, where its region runs on).
const cities = area.addressCity ? [area.addressCity, ...(area.alsoCities ?? [])] : []
const excluded = []
const kept = []
for (const p of found.values()) {
  const name = p.displayName?.text ?? ''
  const at = { lat: p.location.latitude, lng: p.location.longitude }
  const why =
    p.businessStatus && p.businessStatus !== 'OPERATIONAL' ? p.businessStatus.toLowerCase()
    : !inArea(at) ? 'outside the area'
    : cities.length && !cities.some((city) => new RegExp(`,\\s*${city},\\s*ON`, 'i').test(p.formattedAddress ?? '')) ? `not in ${cities.join(' or ')}`
    : SKIP_TYPES.has(p.primaryType) ? `type: ${p.primaryType}`
    : undefined
  if (why) excluded.push({ placeId: p.id, name, address: p.formattedAddress, reason: why })
  else kept.push(p)
}

// ---------- Details ----------

const DETAIL_FIELDS = ['id', 'dineIn', 'websiteUri', 'nationalPhoneNumber', 'regularOpeningHours', 'servesBeer', 'servesWine', 'servesCocktails',
  'outdoorSeating', 'liveMusic', 'goodForGroups', 'goodForWatchingSports', 'allowsDogs', 'rating', 'userRatingCount', 'priceLevel']

function hours(opening) {
  const periods = opening?.periods
  if (!periods?.length) return undefined
  if (periods.length === 1 && !periods[0].close) return [0, 1, 2, 3, 4, 5, 6].map((day) => [day, 0, 1440])
  return periods
    .filter((p) => p.open && p.close)
    .map((p) => {
      const open = p.open.hour * 60 + (p.open.minute ?? 0)
      const days = (p.close.day - p.open.day + 7) % 7
      return [p.open.day, open, days * 1440 + p.close.hour * 60 + (p.close.minute ?? 0) || 1440]
    })
}

// Details from the last run, so a re-run only pays for places it hasn't seen.
const previous = new Map()
if (existsSync(`${dir}candidates.json`)) {
  const last = JSON.parse(readFileSync(`${dir}candidates.json`, 'utf8'))
  for (const c of last.candidates) previous.set(c.placeId, c)
}

const candidates = []
for (const p of kept) {
  const at = { lat: p.location.latitude, lng: p.location.longitude }
  const chain = chainOf(p.displayName?.text ?? '')
  const seen = previous.get(p.id)
  if (seen) {
    candidates.push({ ...seen, chain, metersFromCentre: Math.round(meters(area.center, at)) })
    continue
  }
  const d = await details(p.id, DETAIL_FIELDS)
  if (d.servesBeer === false && d.servesWine === false && d.servesCocktails === false) {
    excluded.push({ placeId: p.id, name: p.displayName?.text, address: p.formattedAddress, reason: 'no alcohol, per Google' })
    continue
  }
  if (d.dineIn === false) {
    excluded.push({ placeId: p.id, name: p.displayName?.text, address: p.formattedAddress, reason: 'no dine-in, per Google' })
    continue
  }
  const amenities = [
    d.outdoorSeating && 'patio', d.liveMusic && 'live-music', d.goodForWatchingSports && 'sports', d.goodForGroups && 'groups', d.allowsDogs && 'dogs',
  ].filter(Boolean)
  candidates.push({
    placeId: p.id,
    name: p.displayName?.text,
    address: p.formattedAddress,
    lat: +at.lat.toFixed(6),
    lng: +at.lng.toFixed(6),
    metersFromCentre: Math.round(meters(area.center, at)),
    primaryType: p.primaryType,
    typeLabel: p.primaryTypeDisplayName?.text,
    types: p.types,
    googleMapsUrl: p.googleMapsUri,
    website: d.websiteUri,
    phone: d.nationalPhoneNumber,
    hours: hours(d.regularOpeningHours),
    serves: { beer: d.servesBeer, wine: d.servesWine, cocktails: d.servesCocktails },
    amenities,
    rating: d.rating,
    ratings: d.userRatingCount,
    priceLevel: d.priceLevel,
    chain,
  })
}
candidates.sort((a, b) => a.metersFromCentre - b.metersFromCentre)

writeFileSync(
  `${dir}candidates.json`,
  JSON.stringify(
    {
      area: area.id,
      sweptAt: new Date().toISOString().slice(0, 10),
      note: 'Generated by web/scripts/places-sweep.mjs from Google Places. Hours are [day (0 = Sunday), open, close] in minutes after midnight; a close past 1440 runs into the next day.',
      googleCalls: callCount(),
      candidates,
      excluded: excluded.sort((a, b) => a.reason.localeCompare(b.reason)),
    },
    null,
    1,
  ) + '\n',
)
console.log(`${area.name}: ${candidates.length} candidates, ${excluded.length} left out, ${callCount()} Google calls in all`)
