import { AREA_LIST } from '../../src/data/areas'
import { torontoDate } from '../../src/lib/time'
import { recentDays, validateUsage, type UsageReport } from '../../src/lib/usage'
import { error, ipHash, isMissingSchema, readJson, saltedHash, type Env } from '../../server/shared'

// POST /api/usage: an app's anonymous counts (which area it opened, the rough square it was
// opened in, which buttons were tapped). Only daily totals are kept; see src/lib/usage.ts.

const AREA_IDS = AREA_LIST.map((a) => a.id)
/** Reports one network may send a day; a phone sends one or two each time it's opened. */
const REPORTS_PER_NETWORK = 400
/** Device hashes count phones for this long, then go. */
const KEEP_DEVICE_DAYS = 90

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const days = recentDays(torontoDate(), 3)
  const report = validateUsage(await readJson<UsageReport>(request, 4_000), AREA_IDS, days)
  if ('error' in report) return error(report.error)
  try {
    const calls = await env.DB.prepare(
      `INSERT INTO usage_calls (day, ip_hash, count) VALUES (?, ?, 1)
       ON CONFLICT (day, ip_hash) DO UPDATE SET count = count + 1 RETURNING count`,
    )
      .bind(days[0], await ipHash(request, env))
      .first<{ count: number }>()
    if ((calls?.count ?? 0) > REPORTS_PER_NETWORK) return error('Too many reports today.', 429)

    const { day, area, platform, cell, device, events } = report
    const statements = events.map(([name, count]) =>
      env.DB.prepare(
        `INSERT INTO usage_events (day, area, platform, name, count) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (day, area, platform, name) DO UPDATE SET count = count + excluded.count`,
      ).bind(day, area, platform, name, count),
    )
    const opens = events.find(([name]) => name === 'open')?.[1]
    if (cell && opens) {
      statements.push(
        env.DB.prepare(
          `INSERT INTO usage_cells (day, area, cell, opens) VALUES (?, ?, ?, ?)
           ON CONFLICT (day, area, cell) DO UPDATE SET opens = opens + excluded.opens`,
        ).bind(day, area, cell, opens),
      )
    }
    if (device) {
      statements.push(
        env.DB.prepare(`INSERT OR IGNORE INTO usage_devices (day, area, device_hash) VALUES (?, ?, ?)`).bind(day, area, await saltedHash(env, `device:${device}`)),
      )
    }
    // Now and then, clear out what's past keeping.
    if (Math.random() < 0.02) {
      const [, , oldCalls] = recentDays(days[0], 3)
      statements.push(
        env.DB.prepare(`DELETE FROM usage_devices WHERE day < ?`).bind(recentDays(days[0], KEEP_DEVICE_DAYS + 1)[KEEP_DEVICE_DAYS]),
        env.DB.prepare(`DELETE FROM usage_calls WHERE day < ?`).bind(oldCalls),
      )
    }
    await env.DB.batch(statements)
    return new Response(null, { status: 204 })
  } catch (e) {
    if (isMissingSchema(e)) return error('Usage counts aren’t switched on yet.', 503)
    throw e
  }
}
