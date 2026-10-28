import { validateFavourites, type Account } from '../../src/lib/account'
import { currentAccount } from '../../server/auth'
import { error, json, readJson, type Env } from '../../server/shared'

const list = async (env: Env, account: Account) => {
  const rows = await env.DB.prepare(`SELECT venue_id FROM favourites WHERE user_id = ? ORDER BY created_at, venue_id`).bind(account.id).all<{ venue_id: string }>()
  return rows.results.map((r) => r.venue_id)
}

// GET /api/favourites: the signed-in person's starred venues.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const account = await currentAccount(request, env)
  if (!account) return error('Not signed in.', 401)
  return json({ venueIds: await list(env, account) })
}

// PUT /api/favourites: replaces them with the list sent (the apps merge first).
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const account = await currentAccount(request, env)
  if (!account) return error('Not signed in.', 401)
  const input = await readJson<{ venueIds: string[] }>(request, 30_000)
  const problem = validateFavourites(input?.venueIds)
  if (problem) return error(problem)

  // One JSON parameter rather than one per venue: D1 caps bound values and queries per request.
  const wanted = JSON.stringify([...new Set(input?.venueIds as string[])])
  await env.DB.batch([
    // Keep the ones still starred (and when they were added); drop the rest; add the new ones.
    env.DB.prepare(`DELETE FROM favourites WHERE user_id = ? AND venue_id NOT IN (SELECT value FROM json_each(?))`).bind(account.id, wanted),
    env.DB.prepare(`INSERT INTO favourites (user_id, venue_id) SELECT ?, value FROM json_each(?) WHERE true ON CONFLICT DO NOTHING`).bind(account.id, wanted),
  ])
  return json({ venueIds: await list(env, account) })
}
