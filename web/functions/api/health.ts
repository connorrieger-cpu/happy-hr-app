import { json, type Env } from '../../server/shared'
import { SCHEMA_VERSION, venuesPayload } from '../../server/venues'

// GET /api/health: is the API up, which data version it serves, and whether
// the database answers. Apps can use it to decide whether to refetch venues.
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { payload } = await venuesPayload()!
  let database = 'ok'
  try {
    await env.DB.prepare('SELECT 1').first()
  } catch {
    database = 'unavailable'
  }
  return json(
    { ok: database === 'ok', api: 1, schemaVersion: SCHEMA_VERSION, dataVersion: payload.version, database, time: new Date().toISOString() },
    database === 'ok' ? 200 : 503,
  )
}
