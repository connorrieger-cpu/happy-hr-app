import { currentAccount } from '../../../server/auth'
import { error, json, readJson, type Env } from '../../../server/shared'

const ID = /^[0-9a-f-]{36}$/

// GET /api/chat/blocks: the people you've blocked, to unblock them.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const me = await currentAccount(request, env)
  if (!me) return error('Not signed in.', 401)
  const rows = await env.DB.prepare(
    `SELECT chat_blocks.blocked_id AS userId, COALESCE(users.display_name, 'Someone') AS name
     FROM chat_blocks LEFT JOIN users ON users.id = chat_blocks.blocked_id WHERE chat_blocks.user_id = ? ORDER BY chat_blocks.created_at`,
  )
    .bind(me.id)
    .all<{ userId: string; name: string }>()
  return json({ blocked: rows.results })
}

// POST /api/chat/blocks { userId }: stop seeing someone's messages.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const me = await currentAccount(request, env)
  if (!me) return error('Sign in to block someone.', 401)
  const input = await readJson<{ userId: string }>(request, 500)
  if (!input || typeof input.userId !== 'string' || !ID.test(input.userId) || input.userId === me.id) return error('Unknown person.')
  await env.DB.prepare(`INSERT INTO chat_blocks (user_id, blocked_id) VALUES (?, ?) ON CONFLICT DO NOTHING`).bind(me.id, input.userId).run()
  return json({ ok: true })
}

// DELETE /api/chat/blocks { userId }: see their messages again.
export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const me = await currentAccount(request, env)
  if (!me) return error('Not signed in.', 401)
  const input = await readJson<{ userId: string }>(request, 500)
  if (!input || typeof input.userId !== 'string') return error('Unknown person.')
  await env.DB.prepare(`DELETE FROM chat_blocks WHERE user_id = ? AND blocked_id = ?`).bind(me.id, input.userId).run()
  return json({ ok: true })
}
