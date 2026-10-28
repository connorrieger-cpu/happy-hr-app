import { normalizeEmail, validateEmail } from '../../../src/lib/account'
import { codeHash, newCode, sendCode, SQL_CODE_EXPIRY, SQL_NOW } from '../../../server/auth'
import { error, ipHash, json, readJson, type Env } from '../../../server/shared'

/** At most this many codes an hour per email, and a day per network. */
const PER_EMAIL_PER_HOUR = 5
const PER_NETWORK_PER_DAY = 30

// POST /api/auth/code: emails a 6-digit sign-in code. A new email gets an
// account when the code is verified; the reply is the same either way.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const input = await readJson<{ email: string }>(request, 1_000)
  const problem = validateEmail(input?.email)
  if (problem) return error(problem)
  const email = normalizeEmail(input?.email as string)

  const ip = await ipHash(request, env)
  const [byEmail, byNetwork] = await env.DB.batch<{ n: number }>([
    env.DB.prepare(`SELECT COUNT(*) AS n FROM code_requests WHERE email = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 hour')`).bind(email),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM code_requests WHERE ip_hash = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 day')`).bind(ip),
  ])
  if ((byEmail.results[0]?.n ?? 0) >= PER_EMAIL_PER_HOUR || (byNetwork.results[0]?.n ?? 0) >= PER_NETWORK_PER_DAY) {
    return error('That’s a lot of codes. Try again in a little while.', 429)
  }

  // Saved before sending, so a code that arrives always works.
  const code = newCode()
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO sign_in_codes (email, code_hash, expires_at, attempts, ip_hash) VALUES (?, ?, ${SQL_CODE_EXPIRY}, 0, ?)
       ON CONFLICT (email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0,
         ip_hash = excluded.ip_hash, created_at = ${SQL_NOW}`,
    ).bind(email, await codeHash(env, email, code), ip),
    env.DB.prepare(`INSERT INTO code_requests (email, ip_hash) VALUES (?, ?)`).bind(email, ip),
  ])

  const result = await sendCode(env, email, code)
  if (!result.sent) {
    return result.reason === 'not-configured' ? error('Sign-in isn’t switched on yet.', 503) : error('Couldn’t send the email. Try again.', 502)
  }
  return json({ sent: true, ...(result.devCode && { devCode: result.devCode }) })
}
