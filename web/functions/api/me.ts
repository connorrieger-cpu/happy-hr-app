import { validateDisplayName } from '../../src/lib/chat'
import { revokeApple } from '../../server/apple'
import { accountById, currentAccount, toAccount } from '../../server/auth'
import { error, json, readJson, type Env } from '../../server/shared'

// GET /api/me: who's signed in on this device.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const account = await currentAccount(request, env)
  return account ? json({ account }) : error('Not signed in.', 401)
}

interface ProfileInput {
  /** The name shown in the chat. */
  displayName?: string
  /** True once they've agreed to the chat rules. */
  chatRules?: boolean
}

// PATCH /api/me: change the chat name, or agree to the chat rules.
export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  const account = await currentAccount(request, env)
  if (!account) return error('Not signed in.', 401)
  const input = await readJson<ProfileInput>(request, 1_000)
  if (!input) return error('Couldn’t read that.')
  if (input.displayName !== undefined) {
    const problem = validateDisplayName(input.displayName)
    if (problem) return error(problem)
    await env.DB.prepare(`UPDATE users SET display_name = ? WHERE id = ?`).bind(input.displayName.trim(), account.id).run()
  }
  if (input.chatRules === true) {
    await env.DB.prepare(`UPDATE users SET chat_rules_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ? AND chat_rules_at IS NULL`)
      .bind(account.id)
      .run()
  }
  return json({ account: toAccount((await accountById(env, account.id))!) })
}

// DELETE /api/me: deletes the account, its favourites, its chat messages and
// every signed-in device, and tells Apple to revoke access for Apple accounts.
export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const account = await currentAccount(request, env)
  if (!account) return error('Not signed in.', 401)
  const apple = await env.DB.prepare(`SELECT apple_refresh_token FROM users WHERE id = ?`).bind(account.id).first<{ apple_refresh_token: string | null }>()
  await revokeApple(env, apple?.apple_refresh_token ?? null)
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM favourites WHERE user_id = ?`).bind(account.id),
    env.DB.prepare(`DELETE FROM chat_messages WHERE user_id = ?`).bind(account.id),
    env.DB.prepare(`DELETE FROM chat_blocks WHERE user_id = ? OR blocked_id = ?`).bind(account.id, account.id),
    env.DB.prepare(`DELETE FROM chat_reports WHERE reporter_id = ?`).bind(account.id),
    env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(account.id),
    env.DB.prepare(`DELETE FROM sign_in_codes WHERE email = ?`).bind(account.email ?? ''),
    env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(account.id),
  ])
  return json({ ok: true })
}
