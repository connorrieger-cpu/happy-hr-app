import { CHAT_LIMITS } from '../../../src/lib/chat'
import { currentAccount } from '../../../server/auth'
import { error, json, readJson, type Env } from '../../../server/shared'

// POST /api/chat/report { messageId, reason? }: flag a message for the owner.
// Reports from several different people hide it until the owner looks.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const me = await currentAccount(request, env)
  if (!me) return error('Sign in to report a message.', 401)
  const input = await readJson<{ messageId: number; reason?: string }>(request, 1_000)
  if (!input || !Number.isInteger(input.messageId)) return error('Unknown message.')
  const reason = typeof input.reason === 'string' ? input.reason.trim().slice(0, 200) || null : null
  const exists = await env.DB.prepare(`SELECT 1 FROM chat_messages WHERE id = ?`).bind(input.messageId).first()
  if (!exists) return error('Unknown message.', 404)

  await env.DB.batch([
    env.DB.prepare(`INSERT INTO chat_reports (message_id, reporter_id, reason) VALUES (?, ?, ?) ON CONFLICT DO NOTHING`).bind(input.messageId, me.id, reason),
    env.DB.prepare(
      `UPDATE chat_messages SET hidden = 1 WHERE id = ?
         AND (SELECT COUNT(*) FROM chat_reports WHERE message_id = ? AND resolved = 0) >= ?`,
    ).bind(input.messageId, input.messageId, CHAT_LIMITS.autoHideReports),
  ])
  return json({ ok: true })
}
