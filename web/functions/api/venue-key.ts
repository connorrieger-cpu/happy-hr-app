import { VENUE_KEY_RE } from '../../src/lib/community'
import { error, isMissingSchema, json, readJson, venueForKey, type Env } from '../../server/shared'
import { findVenue } from '../../server/venues'

// POST /api/venue-key { key }: which venue a key belongs to, so the app can
// show "You manage this page" to the venue's staff.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const input = await readJson<{ key: string }>(request, 500)
  if (!input || typeof input.key !== 'string' || !VENUE_KEY_RE.test(input.key)) return error('That key doesn’t look right.')
  try {
    const venueId = await venueForKey(env, input.key)
    if (!venueId) return error('That key isn’t valid (or was replaced).', 404)
    // The area too, so the app can open the right one.
    return json({ venueId, areaId: (await findVenue(venueId))?.area.id })
  } catch (e) {
    if (isMissingSchema(e)) return error('Venue keys aren’t switched on yet.', 503)
    throw e
  }
}
