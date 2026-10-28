import { error, isOwner, json, readJson, type Env } from '../../server/shared'

// The owner's chat moderation: reported messages to act on, and the latest
// messages. Requires `Authorization: Bearer <OWNER_TOKEN>`.

interface ReportedRow {
  id: number
  user_id: string
  name: string | null
  body: string
  created_at: string
  hidden: number
  banned: number
  reports: number
  reasons: string | null
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!isOwner(request, env)) return error('Not allowed.', 401)
  const [reported, recent] = await env.DB.batch<ReportedRow>([
    env.DB.prepare(
      `SELECT m.id, m.user_id, u.display_name AS name, m.body, m.created_at, m.hidden, u.chat_banned AS banned,
         COUNT(r.reporter_id) AS reports, GROUP_CONCAT(r.reason, ' · ') AS reasons
       FROM chat_reports r JOIN chat_messages m ON m.id = r.message_id LEFT JOIN users u ON u.id = m.user_id
       WHERE r.resolved = 0 GROUP BY m.id ORDER BY MAX(r.created_at) DESC LIMIT 200`,
    ),
    env.DB.prepare(
      `SELECT m.id, m.user_id, u.display_name AS name, m.body, m.created_at, m.hidden, u.chat_banned AS banned, 0 AS reports, NULL AS reasons
       FROM chat_messages m LEFT JOIN users u ON u.id = m.user_id ORDER BY m.id DESC LIMIT 100`,
    ),
  ])
  const shape = (r: ReportedRow) => ({
    id: r.id,
    userId: r.user_id,
    name: r.name ?? 'Someone',
    body: r.body,
    createdAt: r.created_at,
    hidden: r.hidden === 1,
    banned: r.banned === 1,
    reports: r.reports,
    reasons: r.reasons ?? undefined,
  })
  return json({ reported: reported.results.map(shape), recent: recent.results.map(shape) })
}

interface ActionInput {
  action: 'hide' | 'restore' | 'dismiss' | 'ban' | 'unban'
  messageId?: number
  userId?: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isOwner(request, env)) return error('Not allowed.', 401)
  const input = await readJson<ActionInput>(request, 1_000)
  if (!input) return error('Bad request.')
  const { action, messageId, userId } = input
  if ((action === 'hide' || action === 'restore' || action === 'dismiss') && Number.isInteger(messageId)) {
    // Either way the reports are dealt with.
    await env.DB.batch([
      ...(action === 'dismiss' ? [] : [env.DB.prepare(`UPDATE chat_messages SET hidden = ? WHERE id = ?`).bind(action === 'hide' ? 1 : 0, messageId)]),
      env.DB.prepare(`UPDATE chat_reports SET resolved = 1 WHERE message_id = ?`).bind(messageId),
    ])
    return json({ ok: true })
  }
  if ((action === 'ban' || action === 'unban') && typeof userId === 'string') {
    await env.DB.batch([
      env.DB.prepare(`UPDATE users SET chat_banned = ? WHERE id = ?`).bind(action === 'ban' ? 1 : 0, userId),
      // Removing someone also hides what they wrote.
      ...(action === 'ban' ? [env.DB.prepare(`UPDATE chat_messages SET hidden = 1 WHERE user_id = ?`).bind(userId)] : []),
    ])
    return json({ ok: true })
  }
  return error('Bad request.')
}
