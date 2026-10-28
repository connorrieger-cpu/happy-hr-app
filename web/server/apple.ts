/// <reference types="@cloudflare/workers-types" />
// Sign in with Apple: checking the identity token the iPhone app gets from
// Apple, and (when a Sign in with Apple key is set up) revoking Apple's access
// when someone deletes their account, as App Review requires.

import { sha256 } from './auth'
import type { Env } from './shared'

const ISSUER = 'https://appleid.apple.com'

export interface AppleIdentity {
  /** Apple's stable id for this person and this developer team. */
  sub: string
  email?: string
  emailVerified: boolean
  /** A relay address (…@privaterelay.appleid.com) from "Hide My Email". */
  privateEmail: boolean
}

export const bundleIds = (env: Env) => (env.APPLE_BUNDLE_IDS ?? 'com.happyhr.app').split(',').map((s) => s.trim())

const b64urlToBytes = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0))
const bytesToB64url = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const jsonB64url = (value: unknown) => bytesToB64url(new TextEncoder().encode(JSON.stringify(value)))

interface Jwk extends JsonWebKey {
  kid: string
}

let keys: { fetched: number; keys: Jwk[] } | undefined

/** Apple's public signing keys, cached for an hour (refetched when a token names a new one). */
async function appleKeys(force = false): Promise<Jwk[]> {
  if (!force && keys && Date.now() - keys.fetched < 3_600_000) return keys.keys
  const response = await fetch(`${ISSUER}/auth/keys`)
  if (!response.ok) throw new Error('Couldn’t reach Apple. Try again.')
  keys = { fetched: Date.now(), keys: ((await response.json()) as { keys: Jwk[] }).keys }
  return keys.keys
}

/** Null when the token is genuine and fresh, for this app, and (if a nonce was sent) for this sign-in; else what's wrong. */
export async function verifyAppleToken(env: Env, idToken: string, rawNonce?: string): Promise<AppleIdentity | string> {
  const parts = idToken.split('.')
  if (parts.length !== 3) return 'That Apple sign-in didn’t look right.'
  let header: { kid?: string; alg?: string }
  let claims: Record<string, unknown>
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0])))
    claims = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])))
  } catch {
    return 'That Apple sign-in didn’t look right.'
  }
  if (header.alg !== 'RS256' || !header.kid) return 'That Apple sign-in didn’t look right.'

  let jwk = (await appleKeys()).find((k) => k.kid === header.kid)
  if (!jwk) jwk = (await appleKeys(true)).find((k) => k.kid === header.kid)
  if (!jwk) return 'That Apple sign-in didn’t look right.'
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`))
  if (!valid) return 'That Apple sign-in didn’t look right.'

  const now = Date.now() / 1000
  if (claims.iss !== ISSUER) return 'That Apple sign-in didn’t look right.'
  if (typeof claims.aud !== 'string' || !bundleIds(env).includes(claims.aud)) return 'That Apple sign-in is for a different app.'
  if (typeof claims.exp !== 'number' || claims.exp < now) return 'That Apple sign-in has expired. Try again.'
  if (typeof claims.sub !== 'string' || !claims.sub) return 'That Apple sign-in didn’t look right.'
  // The app sends Apple a SHA-256 of a random nonce, and the nonce itself to us: proof the token was made for this sign-in.
  if (rawNonce != null && claims.nonce !== (await sha256(rawNonce))) return 'That Apple sign-in didn’t match. Try again.'

  const yes = (v: unknown) => v === true || v === 'true'
  return {
    sub: claims.sub,
    email: typeof claims.email === 'string' ? claims.email.toLowerCase() : undefined,
    emailVerified: yes(claims.email_verified),
    privateEmail: yes(claims.is_private_email),
  }
}

// MARK: Revoking access (needs a Sign in with Apple key: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY)

const revocable = (env: Env) => Boolean(env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY)

/** The short-lived client secret Apple's token endpoints want: an ES256 JWT signed with the .p8 key. */
async function clientSecret(env: Env, clientId: string): Promise<string> {
  const pem = env.APPLE_PRIVATE_KEY!.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const now = Math.floor(Date.now() / 1000)
  const unsigned = `${jsonB64url({ alg: 'ES256', kid: env.APPLE_KEY_ID })}.${jsonB64url({ iss: env.APPLE_TEAM_ID, iat: now, exp: now + 300, aud: ISSUER, sub: clientId })}`
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned))
  return `${unsigned}.${bytesToB64url(signature)}`
}

/** Swaps the one-time authorization code for a refresh token, kept only so access can be revoked later. */
export async function appleRefreshToken(env: Env, code: string | undefined, clientId: string): Promise<string | null> {
  if (!code || !revocable(env)) return null
  const response = await fetch(`${ISSUER}/auth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: await clientSecret(env, clientId), code, grant_type: 'authorization_code' }),
  })
  if (!response.ok) return null
  return ((await response.json()) as { refresh_token?: string }).refresh_token ?? null
}

/** Tells Apple this app no longer has access (account deleted). Best effort. */
export async function revokeApple(env: Env, refreshToken: string | null): Promise<void> {
  if (!refreshToken || !revocable(env)) return
  for (const clientId of bundleIds(env)) {
    const response = await fetch(`${ISSUER}/auth/revoke`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: await clientSecret(env, clientId), token: refreshToken, token_type_hint: 'refresh_token' }),
    })
    if (response.ok) return
  }
}
