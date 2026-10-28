import { CODE_TRIES, normalizeEmail, validateCode, validateEmail } from '../../../src/lib/account'
import { accountById, codeHash, SQL_NOW, startSession, toAccount } from '../../../server/auth'
import { error, json, readJson, type Env } from '../../../server/shared'

interface VerifyInput {
  email: string
  code: string
  /** The app's anonymous device id, to tell signed-in devices apart. */
  device?: string
}

// POST /api/auth/verify: checks the emailed code. Right code: creates the
// account if it's new and returns a session token for this device.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const input = await readJson<VerifyInput>(request, 1_000)
  if (!input) return error('Couldn’t read that.')
  const problem = validateEmail(input.email) ?? validateCode(input.code)
  if (problem) return error(problem)
  const email = normalizeEmail(input.email as string)
  const code = (input.code as string).trim()

  const row = await env.DB.prepare(`SELECT code_hash, attempts, expires_at > ${SQL_NOW} AS live FROM sign_in_codes WHERE email = ?`)
    .bind(email)
    .first<{ code_hash: string; attempts: number; live: number }>()
  if (!row || !row.live) return error('That code has expired. Ask for a new one.')
  if (row.attempts >= CODE_TRIES) return error('Too many tries. Ask for a new code.', 429)
  if (row.code_hash !== (await codeHash(env, email, code))) {
    await env.DB.prepare(`UPDATE sign_in_codes SET attempts = attempts + 1 WHERE email = ?`).bind(email).run()
    return error('That code isn’t right.')
  }

  // Signed in: the code is used up, the account exists, and this device gets a session.
  const [, , user] = await env.DB.batch<{ id: string }>([
    env.DB.prepare(`DELETE FROM sign_in_codes WHERE email = ?`).bind(email),
    env.DB.prepare(`INSERT INTO users (id, email) VALUES (?, ?) ON CONFLICT (email) DO NOTHING`).bind(crypto.randomUUID(), email),
    env.DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(email),
  ])
  const id = user.results[0].id
  const token = await startSession(env, id, input.device)
  return json({ token, account: toAccount((await accountById(env, id))!) })
}
