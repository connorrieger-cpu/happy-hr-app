/// <reference types="@cloudflare/workers-types" />
// Helpers shared by the Pages Functions in functions/api.

export interface Env {
  DB: D1Database
  /** Secret for the owner page; also salts IP hashes. Set with `wrangler pages secret put OWNER_TOKEN`. */
  OWNER_TOKEN?: string
  /** Sends sign-in codes through Resend (resend.com). Set with `wrangler pages secret put RESEND_API_KEY`. */
  RESEND_API_KEY?: string
  /** Who sign-in emails come from, e.g. "Happy HR <codes@happyhr.app>" (a domain verified in Resend). */
  EMAIL_FROM?: string
  /** Local testing only: '1' returns the code in the response instead of emailing it. Never set in production. */
  DEV_SHOW_CODE?: string
  /** The iOS bundle id(s) Sign in with Apple tokens must be for, comma-separated (default com.happyhr.app). */
  APPLE_BUNDLE_IDS?: string
  /** Optional until App Store submission: a Sign in with Apple key, to revoke Apple access when an account is deleted. */
  APPLE_TEAM_ID?: string
  APPLE_KEY_ID?: string
  APPLE_PRIVATE_KEY?: string
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  })

export const error = (message: string, status = 400) => json({ error: message }, status)

/** Reads a JSON body, or null when it's missing, malformed or too big. */
export async function readJson<T>(request: Request, maxBytes = 8_000): Promise<Partial<T> | null> {
  const text = await request.text()
  if (text.length > maxBytes) return null
  try {
    const value = JSON.parse(text)
    return value && typeof value === 'object' ? value : null
  } catch {
    return null
  }
}

/** A salted, shortened SHA-256, for values that are only ever compared, never read back. */
export async function saltedHash(env: Env, value: string): Promise<string> {
  const data = new TextEncoder().encode(`${env.OWNER_TOKEN ?? 'happy-hr'}:${value}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)]
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** A salted hash of the caller's IP, used only for rate limits and spotting abuse. */
export const ipHash = (request: Request, env: Env): Promise<string> => saltedHash(env, request.headers.get('cf-connecting-ip') ?? 'unknown')

export const isOwner = (request: Request, env: Env) => {
  const token = env.OWNER_TOKEN
  return Boolean(token) && request.headers.get('authorization') === `Bearer ${token}`
}

/** Counts a caller's rows in the last 24 hours, by network or by device, for rate limiting. */
export async function recentCount(env: Env, table: 'submissions' | 'votes', by: 'ip_hash' | 'device', value: string): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM ${table} WHERE ${by} = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 day')`,
  )
    .bind(value)
    .first<{ n: number }>()
  return row?.n ?? 0
}

/**
 * Daily limits. Per device keeps one person in check; the per-network cap is
 * higher because phones on mobile data often share an IP with strangers.
 */
export const LIMITS_PER_DAY = {
  submissions: { device: 10, network: 40 },
  votes: { device: 60, network: 300 },
}

/** True when this device or network has hit its daily limit. */
export async function overLimit(env: Env, table: 'submissions' | 'votes', device: string, ip: string): Promise<boolean> {
  const limit = LIMITS_PER_DAY[table]
  const [byDevice, byNetwork] = await Promise.all([recentCount(env, table, 'device', device), recentCount(env, table, 'ip_hash', ip)])
  return byDevice >= limit.device || byNetwork >= limit.network
}

export interface SubmissionRow {
  id: string
  venue_id: string | null
  venue_name: string
  address: string | null
  lat: number | null
  lng: number | null
  days: string
  start_min: number
  end_min: number
  specials: string
  note: string | null
  kind?: string | null
  title?: string | null
  source?: string | null
  created_at: string
  hidden?: number
  device?: string
  ip_hash?: string
}

const ALL_DAY = (r: SubmissionRow) => r.kind === 'daily' && r.start_min === 0 && r.end_min === 0

export const toSubmission = (r: SubmissionRow) => ({
  id: r.id,
  kind: r.kind === 'daily' ? ('daily' as const) : ('happy-hour' as const),
  title: r.title ?? undefined,
  ...(r.source === 'venue' && { byVenue: true }),
  venueId: r.venue_id ?? undefined,
  venueName: r.venue_name,
  address: r.address ?? undefined,
  lat: r.lat ?? undefined,
  lng: r.lng ?? undefined,
  days: JSON.parse(r.days),
  // A daily special stored without hours runs all day.
  start: ALL_DAY(r) ? undefined : r.start_min,
  end: ALL_DAY(r) ? undefined : r.end_min,
  specials: JSON.parse(r.specials),
  note: r.note ?? undefined,
  createdAt: r.created_at,
})

/** True when a D1 error means a newer migration hasn't been applied yet (so the API can fall back). */
export const isMissingSchema = (e: unknown) =>
  // Reads say "no such column: x"; inserts say "table t has no column named x".
  /no such (table|column)|has no column named/i.test(String(e instanceof Error ? e.message : e))

/** SHA-256 hex of a venue key; only the hash is stored. */
export async function hashKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key.trim().toUpperCase()))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** A new venue key, e.g. "HHV-7K2M-QX9D-4FTW" (no look-alike characters). */
export function newVenueKey(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  const chars = [...bytes].map((b) => alphabet[b % alphabet.length])
  return `HHV-${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8, 12).join('')}`
}

/** The venue a key belongs to, or null when it's unknown or revoked. */
export async function venueForKey(env: Env, key: string): Promise<string | null> {
  const row = await env.DB.prepare(`SELECT venue_id FROM venue_keys WHERE key_hash = ? AND revoked = 0`)
    .bind(await hashKey(key))
    .first<{ venue_id: string }>()
  return row?.venue_id ?? null
}
