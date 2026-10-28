/// <reference types="@cloudflare/workers-types" />
// Sign-in helpers for the functions in functions/api: codes, sessions and email.

import { CODE_MINUTES, type Account } from '../src/lib/account'
import type { Env } from './shared'

const hex = (bytes: ArrayBuffer | Uint8Array) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')

export async function sha256(text: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))
}

/** A uniformly random 6-digit code. */
export function newCode(): string {
  const limit = 4_294_000_000 // the largest multiple of 1,000,000 below 2^32, so every code is equally likely
  let n: number
  do n = crypto.getRandomValues(new Uint32Array(1))[0]
  while (n >= limit)
  return String(n % 1_000_000).padStart(6, '0')
}

/** A long random session token (base64url). Only its hash is stored. */
export function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Codes are stored salted with the server secret, so a leaked table can't be brute-forced offline. */
export const codeHash = (env: Env, email: string, code: string) => sha256(`${env.OWNER_TOKEN ?? 'happy-hr'}:${email}:${code}`)

export const SQL_NOW = `strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`
export const SQL_CODE_EXPIRY = `strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '+${CODE_MINUTES} minutes')`

/** The bearer token on a request, if any. */
export function bearer(request: Request): string | null {
  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  return token.length >= 20 ? token : null
}

/** The account columns, read the same way everywhere. */
export const ACCOUNT_COLUMNS = `users.id AS id, users.email AS email, users.apple_sub IS NOT NULL AS apple,
  users.display_name AS display_name, users.chat_rules_at IS NOT NULL AS chat_rules, users.chat_banned AS chat_banned`

export interface AccountRow {
  id: string
  email: string | null
  apple: number
  display_name: string | null
  chat_rules: number
  chat_banned: number
}

export const toAccount = (r: AccountRow): Account => ({
  id: r.id,
  email: r.email,
  apple: r.apple === 1,
  displayName: r.display_name,
  chatRules: r.chat_rules === 1,
})

export async function accountById(env: Env, id: string): Promise<AccountRow | null> {
  return env.DB.prepare(`SELECT ${ACCOUNT_COLUMNS} FROM users WHERE users.id = ?`).bind(id).first<AccountRow>()
}

/** A new session for this device; returns the token (only its hash is stored). */
export async function startSession(env: Env, userId: string, device: unknown): Promise<string> {
  const token = newToken()
  const id = typeof device === 'string' && device.length <= 64 ? device.toLowerCase() : null
  await env.DB.prepare(`INSERT INTO sessions (token_hash, user_id, device) VALUES (?, ?, ?)`).bind(await sha256(token), userId, id).run()
  return token
}

/** The signed-in person's row from `Authorization: Bearer <token>`, or null. */
export async function currentAccountRow(request: Request, env: Env): Promise<AccountRow | null> {
  const token = bearer(request)
  if (!token) return null
  const hash = await sha256(token)
  const row = await env.DB.prepare(`SELECT ${ACCOUNT_COLUMNS} FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ?`)
    .bind(hash)
    .first<AccountRow>()
  if (row) {
    // At most one write a day per device, to see which sessions are still in use.
    await env.DB.prepare(`UPDATE sessions SET last_used_at = ${SQL_NOW} WHERE token_hash = ? AND last_used_at < strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 day')`)
      .bind(hash)
      .run()
  }
  return row ?? null
}

/** The signed-in person from `Authorization: Bearer <token>`, or null. */
export async function currentAccount(request: Request, env: Env): Promise<Account | null> {
  const row = await currentAccountRow(request, env)
  return row ? toAccount(row) : null
}

export type SendResult = { sent: true; devCode?: string } | { sent: false; reason: 'not-configured' | 'failed' }

/** Emails the code with Resend, or (local testing only) hands it back. */
export async function sendCode(env: Env, email: string, code: string): Promise<SendResult> {
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [email],
        subject: `${code} is your Happy HR code`,
        text: `Your Happy HR sign-in code is ${code}.\n\nIt works for ${CODE_MINUTES} minutes. If you didn’t ask for it, you can ignore this email.`,
      }),
    })
    return response.ok ? { sent: true } : { sent: false, reason: 'failed' }
  }
  if (env.DEV_SHOW_CODE === '1') return { sent: true, devCode: code }
  return { sent: false, reason: 'not-configured' }
}
