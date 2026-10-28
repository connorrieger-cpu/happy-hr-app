import { torontoDate } from '../../src/lib/time'
import { eventLabel, parseCell, recentDays, type UsagePlatform, type UsageSummary } from '../../src/lib/usage'
import { error, isMissingSchema, isOwner, json, type Env } from '../../server/shared'

// GET /api/owner-usage?days=30: the owner's Usage screen. App opens and phones per day and
// per area, where the apps were opened, and which buttons were tapped, over the last `days`
// days (1 to 365). Requires `Authorization: Bearer <OWNER_TOKEN>`.

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!isOwner(request, env)) return error('Not allowed.', 401)
  const asked = Number(new URL(request.url).searchParams.get('days') ?? 30)
  const days = Math.min(365, Math.max(1, Number.isInteger(asked) ? asked : 30))
  const range = recentDays(torontoDate(), days)
  const to = range[0]
  const from = range[range.length - 1]
  const q = (sql: string) => env.DB.prepare(sql).bind(from, to)
  try {
    const [opensByDay, peopleByDay, opensByArea, peopleByArea, platforms, cells, events, people, taps] = await env.DB.batch([
      q(`SELECT day, SUM(count) AS n FROM usage_events WHERE name = 'open' AND day BETWEEN ? AND ? GROUP BY day`),
      q(`SELECT day, COUNT(DISTINCT device_hash) AS n FROM usage_devices WHERE day BETWEEN ? AND ? GROUP BY day`),
      q(`SELECT area, SUM(count) AS n FROM usage_events WHERE name = 'open' AND day BETWEEN ? AND ? GROUP BY area`),
      q(`SELECT area, COUNT(DISTINCT device_hash) AS n FROM usage_devices WHERE day BETWEEN ? AND ? GROUP BY area`),
      q(`SELECT platform, SUM(count) AS n FROM usage_events WHERE name = 'open' AND day BETWEEN ? AND ? GROUP BY platform`),
      q(`SELECT area, cell, SUM(opens) AS n FROM usage_cells WHERE day BETWEEN ? AND ? GROUP BY area, cell ORDER BY n DESC LIMIT 2000`),
      q(`SELECT name, SUM(count) AS n FROM usage_events WHERE name != 'open' AND day BETWEEN ? AND ? GROUP BY name ORDER BY n DESC LIMIT 200`),
      q(`SELECT COUNT(DISTINCT device_hash) AS n FROM usage_devices WHERE day BETWEEN ? AND ?`),
      q(`SELECT SUM(count) AS n FROM usage_events WHERE name != 'open' AND day BETWEEN ? AND ?`),
    ])
    type Row = { n: number; day?: string; area?: string; platform?: UsagePlatform; cell?: string; name?: string }
    const rows = (r: D1Result) => r.results as Row[]
    const byKey = (r: D1Result, key: 'day' | 'area') => new Map(rows(r).map((row) => [row[key]!, row.n]))
    const dayOpens = byKey(opensByDay, 'day')
    const dayPeople = byKey(peopleByDay, 'day')
    const areaPeople = byKey(peopleByArea, 'area')
    const summary: UsageSummary = {
      days,
      from,
      to,
      totals: {
        opens: [...dayOpens.values()].reduce((a, b) => a + b, 0),
        people: rows(people)[0]?.n ?? 0,
        taps: rows(taps)[0]?.n ?? 0,
      },
      byDay: [...range].reverse().map((day) => ({ day, opens: dayOpens.get(day) ?? 0, people: dayPeople.get(day) ?? 0 })),
      areas: rows(opensByArea)
        .map((r) => ({ area: r.area!, opens: r.n, people: areaPeople.get(r.area!) ?? 0 }))
        .sort((a, b) => b.opens - a.opens),
      platforms: rows(platforms).map((r) => ({ platform: r.platform!, opens: r.n })),
      cells: rows(cells).flatMap((r) => {
        const at = parseCell(r.cell!)
        return at ? [{ area: r.area!, lat: at.lat, lng: at.lng, opens: r.n }] : []
      }),
      events: rows(events).map((r) => ({ name: r.name!, label: eventLabel(r.name!), count: r.n })),
    }
    return json(summary)
  } catch (e) {
    if (isMissingSchema(e)) return error('Usage counts aren’t switched on yet.', 503)
    throw e
  }
}
