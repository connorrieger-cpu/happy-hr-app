import type { VoteTally } from '../../src/lib/community'
import { isMissingSchema, json, toSubmission, type Env, type SubmissionRow } from '../../server/shared'

const COLUMNS = 'id, venue_id, venue_name, address, lat, lng, days, start_min, end_min, specials, note, kind, title, created_at'

// GET /api/community: everything the app shows from the community,
// visible submissions plus each venue's vote tally over the last 30 days.
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const read = (withSource: boolean) =>
    env.DB.batch([
      env.DB.prepare(`SELECT ${COLUMNS}${withSource ? ', source' : ''} FROM submissions WHERE hidden = 0 ORDER BY created_at LIMIT 500`),
      env.DB.prepare(
        `SELECT venue_id,
                SUM(worked) AS yes,
                SUM(1 - worked) AS no,
                MAX(CASE WHEN worked = 1 THEN created_at END) AS last_yes,
                MAX(CASE WHEN worked = 0 THEN created_at END) AS last_no
         FROM votes
         WHERE hidden = 0 AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-30 days')
         GROUP BY venue_id`,
      ),
    ])
  // Before migration 0003 there's no `source` column (who posted it); read without it.
  const [submissions, votes] = await read(true).catch((e) => {
    if (isMissingSchema(e)) return read(false)
    throw e
  })

  const tallies: Record<string, VoteTally> = {}
  for (const r of votes.results as { venue_id: string; yes: number; no: number; last_yes: string | null; last_no: string | null }[]) {
    tallies[r.venue_id] = { yes: r.yes, no: r.no, lastYes: r.last_yes, lastNo: r.last_no }
  }
  return json(
    { submissions: (submissions.results as unknown as SubmissionRow[]).map(toSubmission), votes: tallies },
    200,
    { 'access-control-allow-origin': '*' },
  )
}
