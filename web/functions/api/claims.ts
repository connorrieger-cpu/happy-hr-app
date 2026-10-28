import { validateClaim, type ClaimInput } from '../../src/lib/community'
import { error, ipHash, isMissingSchema, json, readJson, type Env } from '../../server/shared'
import { findVenue } from '../../server/venues'

const MAX_PER_DAY = 3

// POST /api/claims: someone who runs a venue asks to manage its page. The
// owner reviews it on the owner page and, if it checks out, sends them a key.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const input = await readJson<ClaimInput>(request, 2_000)
  if (!input) return error('Couldn’t read that request.')
  if (typeof input.device === 'string') input.device = input.device.toLowerCase()
  const problem = validateClaim(input)
  if (problem) return error(problem)

  const c = input as ClaimInput
  // Only listed venues have a page to manage (not places the community added).
  if (!(await findVenue(c.venueId))) return error('Unknown venue.')
  const ip = await ipHash(request, env)
  try {
    const recent = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM claims WHERE (device = ? OR ip_hash = ?) AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 day')`,
    )
      .bind(c.device, ip)
      .first<{ n: number }>()
    if ((recent?.n ?? 0) >= MAX_PER_DAY) return error('We’ve got your request. We’ll be in touch.', 429)

    const id = crypto.randomUUID().slice(0, 13)
    await env.DB.prepare(
      `INSERT INTO claims (id, venue_id, name, role, contact, message, device, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, c.venueId, c.name.trim(), c.role?.trim() || null, c.contact.trim(), c.message?.trim() || null, c.device, ip)
      .run()
    return json({ id }, 201)
  } catch (e) {
    if (isMissingSchema(e)) return error('Claiming a page isn’t switched on yet. Try again soon.', 503)
    throw e
  }
}
