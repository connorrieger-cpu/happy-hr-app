import { CHAT_LIMITS, validateChatMessage } from '../../../src/lib/chat'
import { currentAccountRow } from '../../../server/auth'
import { CHAT_SELECT, toMessage, type ChatRow } from '../../../server/chat'
import { error, ipHash, json, readJson, type Env } from '../../../server/shared'

// GET /api/chat: the latest 50 messages, oldest first; with ?after=<id>, only
// newer ones (the app asks every few seconds while the chat is open). Anyone can
// read; a signed-in reader doesn't see people they've blocked.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const me = await currentAccountRow(request, env)
  const after = Number(new URL(request.url).searchParams.get('after'))
  const viewer = me?.id ?? ''
  const rows = Number.isInteger(after) && after > 0
    ? await env.DB.prepare(`${CHAT_SELECT} AND chat_messages.id > ? ORDER BY chat_messages.id LIMIT 100`).bind(viewer, after).all<ChatRow>()
    : await env.DB.prepare(`SELECT * FROM (${CHAT_SELECT} ORDER BY chat_messages.id DESC LIMIT 50) ORDER BY id`).bind(viewer).all<ChatRow>()
  return json({ messages: rows.results.map(toMessage) })
}

// POST /api/chat { body }: post to the group chat. Signed in, with a chat name,
// having agreed to the rules; checked against the word filter and rate limits.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const me = await currentAccountRow(request, env)
  if (!me) return error('Sign in to chat.', 401)
  if (me.chat_banned) return error('You can’t post in the chat.', 403)
  if (!me.display_name) return error('Pick a name for the chat.')
  if (!me.chat_rules) return error('Agree to the chat rules first.')
  const input = await readJson<{ body: string }>(request, 4_000)
  const problem = validateChatMessage(input?.body)
  if (problem) return error(problem)

  const recent = await env.DB.prepare(
    `SELECT COUNT(*) AS n, MAX(created_at) > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?) AS tooSoon
     FROM chat_messages WHERE user_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 hour')`,
  )
    .bind(`-${CHAT_LIMITS.cooldownSeconds} seconds`, me.id)
    .first<{ n: number; tooSoon: number | null }>()
  if (recent?.tooSoon) return error('Slow down a little.', 429)
  if ((recent?.n ?? 0) >= CHAT_LIMITS.perHour) return error('That’s a lot of messages. Take a break and try again later.', 429)

  const row = await env.DB.prepare(`INSERT INTO chat_messages (user_id, body, ip_hash) VALUES (?, ?, ?) RETURNING id, created_at`)
    .bind(me.id, (input!.body as string).trim(), await ipHash(request, env))
    .first<{ id: number; created_at: string }>()
  return json({ message: toMessage({ id: row!.id, user_id: me.id, name: me.display_name, body: (input!.body as string).trim(), created_at: row!.created_at }) }, 201)
}
