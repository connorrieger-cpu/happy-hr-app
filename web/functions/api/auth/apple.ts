import { validateDisplayName } from '../../../src/lib/chat'
import { appleRefreshToken, verifyAppleToken } from '../../../server/apple'
import { accountById, startSession, toAccount } from '../../../server/auth'
import { error, json, readJson, type Env } from '../../../server/shared'

interface AppleInput {
  /** The identity token (a JWT) the app got from Apple. */
  identityToken: string
  /** The one-time authorization code, for revoking access if the account is deleted. */
  authorizationCode?: string
  /** The random nonce whose SHA-256 the app sent Apple. */
  nonce?: string
  /** Apple only shares the person's name on their very first sign-in. */
  givenName?: string
  device?: string
}

// POST /api/auth/apple: Sign in with Apple. Finds the account by Apple's id;
// otherwise joins an email-code account with the same verified email; otherwise
// makes a new one. Returns a session token for this device.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const input = await readJson<AppleInput>(request, 8_000)
  if (!input || typeof input.identityToken !== 'string') return error('Couldn’t read that sign-in.')
  const identity = await verifyAppleToken(env, input.identityToken, typeof input.nonce === 'string' ? input.nonce : undefined)
  if (typeof identity === 'string') return error(identity, 401)

  let user = await env.DB.prepare(`SELECT id FROM users WHERE apple_sub = ?`).bind(identity.sub).first<{ id: string }>()
  if (!user && identity.email && identity.emailVerified) {
    // Same person who signed in with an emailed code before: one account.
    user = await env.DB.prepare(`SELECT id FROM users WHERE email = ? AND apple_sub IS NULL`).bind(identity.email).first<{ id: string }>()
    if (user) await env.DB.prepare(`UPDATE users SET apple_sub = ? WHERE id = ?`).bind(identity.sub, user.id).run()
  }
  if (!user) {
    const id = crypto.randomUUID()
    // An email someone else already uses (unlikely) isn't copied, so it can't clash.
    const taken = identity.email ? await env.DB.prepare(`SELECT 1 FROM users WHERE email = ?`).bind(identity.email).first() : null
    await env.DB.prepare(`INSERT INTO users (id, email, apple_sub) VALUES (?, ?, ?)`).bind(id, taken ? null : (identity.email ?? null), identity.sub).run()
    user = { id }
  }

  // A first name from Apple's first sign-in makes a good chat name, if there isn't one yet.
  const given = typeof input.givenName === 'string' ? input.givenName.trim() : ''
  if (given && !validateDisplayName(given)) {
    await env.DB.prepare(`UPDATE users SET display_name = ? WHERE id = ? AND display_name IS NULL`).bind(given, user.id).run()
  }
  const clientId = (JSON.parse(atob(input.identityToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { aud: string }).aud
  const refresh = await appleRefreshToken(env, input.authorizationCode, clientId)
  if (refresh) await env.DB.prepare(`UPDATE users SET apple_refresh_token = ? WHERE id = ?`).bind(refresh, user.id).run()

  const token = await startSession(env, user.id, input.device)
  return json({ token, account: toAccount((await accountById(env, user.id))!) })
}
