import { bearer, sha256 } from '../../../server/auth'
import { json, type Env } from '../../../server/shared'

// POST /api/auth/sign-out: ends this device's session. Fine to call twice.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = bearer(request)
  if (token) await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(await sha256(token)).run()
  return json({ ok: true })
}
