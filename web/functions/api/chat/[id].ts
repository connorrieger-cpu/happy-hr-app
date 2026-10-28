import { currentAccount } from '../../../server/auth'
import { error, json, type Env } from '../../../server/shared'

// DELETE /api/chat/:id: take back your own message.
export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const me = await currentAccount(request, env)
  if (!me) return error('Not signed in.', 401)
  const id = Number(params.id)
  if (!Number.isInteger(id)) return error('Unknown message.', 404)
  const result = await env.DB.prepare(`UPDATE chat_messages SET hidden = 1 WHERE id = ? AND user_id = ?`).bind(id, me.id).run()
  return result.meta.changes ? json({ ok: true }) : error('You can only delete your own messages.', 403)
}
