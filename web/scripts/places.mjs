// Google Places API (New) helpers for the area scripts. The key is
// GOOGLE_PLACES_SERVER_KEY in web/.env.local (git-ignored, never shipped).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const envPath = fileURLToPath(new URL('../.env.local', import.meta.url))

function key() {
  const line = readFileSync(envPath, 'utf8')
    .split('\n')
    .find((l) => l.startsWith('GOOGLE_PLACES_SERVER_KEY='))
  if (!line) throw new Error('Add GOOGLE_PLACES_SERVER_KEY to web/.env.local')
  return line.slice('GOOGLE_PLACES_SERVER_KEY='.length).trim()
}

let calls = 0
export const callCount = () => calls

async function post(path, body, fieldMask) {
  calls++
  const res = await fetch(`https://places.googleapis.com/v1/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key(), 'X-Goog-FieldMask': fieldMask },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`${path}: ${res.status} ${json.error?.message ?? ''}`)
  return json
}

/** Text Search, following page tokens (Google returns at most 60 results). */
export async function textSearch(body, fields) {
  const mask = [...fields.map((f) => `places.${f}`), 'nextPageToken'].join(',')
  const places = []
  let pageToken
  do {
    const json = await post('places:searchText', { ...body, pageSize: 20, ...(pageToken ? { pageToken } : {}) }, mask)
    places.push(...(json.places ?? []))
    pageToken = json.nextPageToken
    if (pageToken) await new Promise((r) => setTimeout(r, 400))
  } while (pageToken)
  return places
}

/** Place Details for one place id. */
export async function details(placeId, fields) {
  calls++
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: { 'X-Goog-Api-Key': key(), 'X-Goog-FieldMask': fields.join(',') },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`details ${placeId}: ${res.status} ${json.error?.message ?? ''}`)
  return json
}
