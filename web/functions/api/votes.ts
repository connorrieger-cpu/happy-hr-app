import { validateVote, type VoteInput } from '../../src/lib/community'
import { torontoDate } from '../../src/lib/time'
import { error, ipHash, json, overLimit, readJson, type Env } from '../../server/shared'

// POST /api/votes: "did the deal work?" One vote per device, venue and day;
// voting again the same day changes the answer.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const input = await readJson<VoteInput>(request, 1_000)
  if (!input) return error('Couldn’t read that vote.')
  if (typeof input.device === 'string') input.device = input.device.toLowerCase()
  const problem = validateVote(input)
  if (problem) return error(problem)

  const ip = await ipHash(request, env)
  if (await overLimit(env, 'votes', input.device as string, ip)) return error('Too many check-ins today.', 429)

  const v = input as VoteInput
  await env.DB.prepare(
    `INSERT INTO votes (venue_id, device, day, worked, ip_hash) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (venue_id, device, day)
     DO UPDATE SET worked = excluded.worked, created_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`,
  )
    .bind(v.venueId, v.device, torontoDate(), v.worked ? 1 : 0, ip)
    .run()
  return json({ ok: true })
}
