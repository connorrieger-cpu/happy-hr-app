import { AREA_LIST } from '../../src/data/areas'
import { validateSubmission, type SubmissionInput } from '../../src/lib/community'
import { error, ipHash, isMissingSchema, json, overLimit, readJson, venueForKey, type Env } from '../../server/shared'

// POST /api/submissions: someone adds a happy hour or a daily special. It goes
// live straight away, marked "Community"; the owner page can hide it. Sent with
// the venue's own key, it's marked "From the venue" instead.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const input = await readJson<SubmissionInput>(request)
  if (!input) return error('Couldn’t read that update.')
  if (typeof input.device === 'string') input.device = input.device.toLowerCase()
  const problem = validateSubmission(input, AREA_LIST)
  if (problem) return error(problem)

  let byVenue = false
  if (input.venueKey) {
    try {
      byVenue = (await venueForKey(env, input.venueKey)) === input.venueId
    } catch (e) {
      if (isMissingSchema(e)) return error('Venue posting isn’t switched on yet.', 503)
      throw e
    }
    if (!byVenue) return error('That venue key doesn’t match this venue.', 403)
  }

  const ip = await ipHash(request, env)
  if (!byVenue && (await overLimit(env, 'submissions', input.device as string, ip))) {
    return error('That’s a lot of updates for one day. Try again tomorrow.', 429)
  }

  const id = crypto.randomUUID().slice(0, 13)
  const s = input as SubmissionInput
  const values = [
    id,
    s.venueId ?? null,
    s.venueName.trim(),
    s.address?.trim() || null,
    s.lat ?? null,
    s.lng ?? null,
    JSON.stringify([...s.days].sort()),
    // A daily special without hours (all day) is stored as 0–0.
    s.start ?? 0,
    s.end ?? 0,
    JSON.stringify(s.specials.map((x) => ({ kind: x.kind, item: x.item.trim(), ...(x.price != null && { price: x.price }) }))),
    s.note?.trim() || null,
    s.device,
    ip,
    s.kind === 'daily' ? 'daily' : 'happy-hour',
    s.title?.trim() || null,
  ]
  const columns = 'id, venue_id, venue_name, address, lat, lng, days, start_min, end_min, specials, note, device, ip_hash, kind, title'
  try {
    await env.DB.prepare(`INSERT INTO submissions (${columns}, source) VALUES (${values.map(() => '?').join(', ')}, ?)`)
      .bind(...values, byVenue ? 'venue' : 'community')
      .run()
  } catch (e) {
    // Before migration 0003 there's no `source` column; community posts still work.
    if (!isMissingSchema(e) || byVenue) throw e
    await env.DB.prepare(`INSERT INTO submissions (${columns}) VALUES (${values.map(() => '?').join(', ')})`)
      .bind(...values)
      .run()
  }
  return json({ id }, 201)
}
