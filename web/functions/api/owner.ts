import { error, hashKey, isMissingSchema, isOwner, json, newVenueKey, readJson, toSubmission, type Env, type SubmissionRow } from '../../server/shared'
import { findVenue } from '../../server/venues'

// The owner page: list everything (hidden included), hide or restore items,
// and approve or turn down venue claims. Requires `Authorization: Bearer <OWNER_TOKEN>`.

interface ClaimRow {
  id: string
  venue_id: string
  name: string
  role: string | null
  contact: string
  message: string | null
  created_at: string
  status: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!isOwner(request, env)) return error('Not allowed.', 401)
  const [submissions, votes] = await env.DB.batch([
    env.DB.prepare(`SELECT * FROM submissions ORDER BY created_at DESC LIMIT 300`),
    env.DB.prepare(`SELECT venue_id, device, day, worked, ip_hash, created_at, hidden FROM votes ORDER BY created_at DESC LIMIT 300`),
  ])
  // Claims arrive with migration 0003; until then there are none.
  const claims = await env.DB.prepare(`SELECT id, venue_id, name, role, contact, message, created_at, status FROM claims ORDER BY created_at DESC LIMIT 200`)
    .all<ClaimRow>()
    .then((r) => r.results)
    .catch((e) => {
      if (isMissingSchema(e)) return [] as ClaimRow[]
      throw e
    })
  return json({
    submissions: (submissions.results as unknown as SubmissionRow[]).map((r) => ({
      ...toSubmission(r),
      hidden: r.hidden === 1,
      device: r.device,
      ipHash: r.ip_hash,
    })),
    votes: (votes.results as { venue_id: string; device: string; day: string; worked: number; ip_hash: string; created_at: string; hidden: number }[]).map(
      (r) => ({
        venueId: r.venue_id,
        device: r.device,
        day: r.day,
        worked: r.worked === 1,
        ipHash: r.ip_hash,
        createdAt: r.created_at,
        hidden: r.hidden === 1,
      }),
    ),
    claims: await Promise.all(claims.map(async (c) => ({
      id: c.id,
      venueId: c.venue_id,
      venueName: await claimName(c.venue_id),
      name: c.name,
      role: c.role ?? undefined,
      contact: c.contact,
      message: c.message ?? undefined,
      createdAt: c.created_at,
      status: c.status,
    }))),
  })
}

/** "Bar Raval (Ossington)", so the owner knows which area a claim is in. */
async function claimName(venueId: string): Promise<string> {
  const found = await findVenue(venueId)
  return found ? `${found.venue.name} (${found.area.name})` : venueId
}

interface OwnerAction {
  target: 'submission' | 'vote' | 'claim'
  /** A submission id, a vote's "venueId|device|day", or a claim id. */
  key: string
  /** Submissions and votes: hide or restore. */
  hidden?: boolean
  /** Claims: approve (makes a new venue key, replacing any earlier one) or turn down. */
  action?: 'approve' | 'reject'
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isOwner(request, env)) return error('Not allowed.', 401)
  const input = await readJson<OwnerAction>(request, 1_000)
  if (!input || typeof input.key !== 'string') return error('Bad request.')

  if (input.target === 'claim') {
    const claim = await env.DB.prepare(`SELECT id, venue_id FROM claims WHERE id = ?`).bind(input.key).first<{ id: string; venue_id: string }>()
    if (!claim) return error('No such claim.', 404)
    if (input.action === 'reject') {
      await env.DB.prepare(`UPDATE claims SET status = 'rejected' WHERE id = ?`).bind(claim.id).run()
      return json({ ok: true })
    }
    if (input.action !== 'approve') return error('Bad request.')
    // One live key per venue: approving again replaces the old one.
    const key = newVenueKey()
    await env.DB.batch([
      env.DB.prepare(`UPDATE venue_keys SET revoked = 1 WHERE venue_id = ?`).bind(claim.venue_id),
      env.DB.prepare(`INSERT INTO venue_keys (key_hash, venue_id, claim_id) VALUES (?, ?, ?)`).bind(await hashKey(key), claim.venue_id, claim.id),
      env.DB.prepare(`UPDATE claims SET status = 'approved' WHERE id = ?`).bind(claim.id),
    ])
    // Shown once, for the owner to send to the venue.
    return json({ ok: true, key, venueId: claim.venue_id })
  }

  if (typeof input.hidden !== 'boolean') return error('Bad request.')
  const hidden = input.hidden ? 1 : 0
  if (input.target === 'submission') {
    await env.DB.prepare(`UPDATE submissions SET hidden = ? WHERE id = ?`).bind(hidden, input.key).run()
  } else if (input.target === 'vote') {
    const [venueId, device, day] = input.key.split('|')
    await env.DB.prepare(`UPDATE votes SET hidden = ? WHERE venue_id = ? AND device = ? AND day = ?`)
      .bind(hidden, venueId, device, day)
      .run()
  } else {
    return error('Bad request.')
  }
  return json({ ok: true })
}
