// The group chat: one room everyone can read; signed-in people can post.
// Shared by the apps and the Cloudflare functions, so the rules are identical
// on both sides. No React or DOM here.

/** A message as the API returns it. */
export interface ChatMessage {
  id: number
  /** The poster's account id, for blocking. */
  userId: string
  name: string
  body: string
  createdAt: string
}

export const CHAT_LIMITS = {
  body: 500,
  name: 24,
  /** Seconds between two messages from one person. */
  cooldownSeconds: 3,
  perHour: 60,
  /** Reports from this many different people hide a message until the owner looks. */
  autoHideReports: 3,
}

/** What everyone agrees to before their first message (App Store rule 1.2). */
export const CHAT_RULES = [
  'Be kind. Swearing’s fine; slurs, harassment, hate and threats aren’t.',
  'No spam, ads or links to sell things.',
  'Nothing sexual or illegal, and no one’s personal details.',
  'Report anything that breaks these rules. We review reports within a day and remove people who break them.',
]

// Words are matched whole, in any case, including simple disguises (repeated
// letters, digits for letters, separators between letters).
/** Everyday swearing: fine in messages, not in chat names. */
const SWEARS = ['fuck', 'fucking', 'fucker', 'motherfucker', 'shit']
/** Never allowed: slurs, sexual insults and threats (App Store rule 1.2 asks for a filter). */
const BLOCKED = [
  'cunt', 'bitch', 'whore', 'slut',
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'tranny', 'kike', 'spic', 'chink', 'paki', 'wetback', 'dyke',
  'rape', 'rapist', 'kys',
]

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's', '!': 'i' }

/** "F.U.C.K", "fuuuck", "sh1t" → "fuck", "fuck", "shit": the forms the word list is checked against. */
export function normalizeForFilter(text: string): string[] {
  const lower = text.toLowerCase().replace(/[013457@$!]/g, (c) => LEET[c])
  const words = lower.split(/[^a-z]+/).filter(Boolean)
  // Single letters split by separators ("f u c k", "f.u.c.k this") rejoin into one word.
  const rejoined: string[] = []
  let run = ''
  for (const w of [...words, '']) {
    if (w.length === 1) {
      run += w
      continue
    }
    if (run.length > 1) rejoined.push(run)
    run = ''
  }
  const squeeze = (w: string) => w.replace(/(.)\1+/g, '$1')
  const all = [...words, ...rejoined]
  return [...all, ...all.map(squeeze)]
}

const squeezed = (words: string[]) => new Set(words.flatMap((w) => [w, w.replace(/(.)\1+/g, '$1')]))
const BLOCKED_SQUEEZED = squeezed(BLOCKED)
const SWEARS_SQUEEZED = squeezed(SWEARS)

/** Slurs, sexual insults and threats; swearing too unless `allowSwearing` (messages allow it, names don't). */
export function isObjectionable(text: string, { allowSwearing = false } = {}): boolean {
  return normalizeForFilter(text).some((w) => BLOCKED_SQUEEZED.has(w) || (!allowSwearing && SWEARS_SQUEEZED.has(w)))
}

/** A message for people when the post can't go out, else null. */
export function validateChatMessage(body: unknown): string | null {
  if (typeof body !== 'string' || !body.trim()) return 'Write a message first.'
  if (body.trim().length > CHAT_LIMITS.body) return `Keep it under ${CHAT_LIMITS.body} characters.`
  if (isObjectionable(body, { allowSwearing: true })) return 'That message breaks the chat rules.'
  return null
}

/** The name shown next to someone's messages. */
export function validateDisplayName(name: unknown): string | null {
  if (typeof name !== 'string' || !name.trim()) return 'Pick a name for the chat.'
  const n = name.trim()
  if (n.length > CHAT_LIMITS.name) return `Keep your name under ${CHAT_LIMITS.name} characters.`
  if (!/^[\p{L}\p{N}][\p{L}\p{N} .'’_-]*$/u.test(n)) return 'Use letters, numbers and spaces in your name.'
  if (isObjectionable(n)) return 'Pick a different name.'
  return null
}
