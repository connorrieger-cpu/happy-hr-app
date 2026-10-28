/// <reference types="@cloudflare/workers-types" />
// Helpers for the group chat functions in functions/api/chat.

import type { ChatMessage } from '../src/lib/chat'

export interface ChatRow {
  id: number
  user_id: string
  name: string | null
  body: string
  created_at: string
}

export const toMessage = (r: ChatRow): ChatMessage => ({ id: r.id, userId: r.user_id, name: r.name ?? 'Someone', body: r.body, createdAt: r.created_at })

/** Visible messages, newest last, without anyone `viewerId` has blocked. */
export const CHAT_SELECT = `SELECT chat_messages.id AS id, chat_messages.user_id AS user_id, users.display_name AS name,
  chat_messages.body AS body, chat_messages.created_at AS created_at
  FROM chat_messages JOIN users ON users.id = chat_messages.user_id
  WHERE chat_messages.hidden = 0
    AND chat_messages.user_id NOT IN (SELECT blocked_id FROM chat_blocks WHERE user_id = ?)`
