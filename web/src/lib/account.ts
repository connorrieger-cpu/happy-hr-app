// Accounts: sign in with a 6-digit code sent by email, and favourites that
// follow you to every device once you do. Shared by the apps and the Cloudflare
// functions, so validation is identical on both sides. No React or DOM here.

/** The signed-in person, as the API returns them. */
export interface Account {
  id: string
  /** Null for an Apple account that didn't share an email. */
  email: string | null
  /** Signed in with Apple (else with an emailed code). */
  apple: boolean
  /** The name shown in the chat; null until they pick one. */
  displayName: string | null
  /** Agreed to the chat rules. */
  chatRules: boolean
}

export const CODE_LENGTH = 6
/** A code works for this long, and for this many tries. */
export const CODE_MINUTES = 10
export const CODE_TRIES = 5
export const MAX_FAVOURITES = 300

/** "  Pat@Example.COM " → "pat@example.com". */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** A message for people when the email can't be right, else null. */
export function validateEmail(email: unknown): string | null {
  if (typeof email !== 'string' || !email.trim()) return 'Enter your email.'
  const e = normalizeEmail(email)
  if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'That email doesn’t look right.'
  return null
}

export function validateCode(code: unknown): string | null {
  if (typeof code !== 'string' || !new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code.trim())) return 'Enter the 6-digit code from the email.'
  return null
}

/** Listed venues ("bar-raval") and community places ("c-1a2b3c4d-5e6f"). */
const VENUE_ID = /^[a-z0-9][a-z0-9-]{0,79}$/

export function validateFavourites(venueIds: unknown): string | null {
  if (!Array.isArray(venueIds)) return 'Send favourites as a list of venues.'
  if (venueIds.length > MAX_FAVOURITES) return `That’s more than ${MAX_FAVOURITES} favourites.`
  if (!venueIds.every((id) => typeof id === 'string' && VENUE_ID.test(id))) return 'One of those isn’t a venue.'
  return null
}
