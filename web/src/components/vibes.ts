import type { Vibe } from '../lib/types'

/** One emoji per kind of place, for venue heroes and plain list rows. */
export const VIBE_GLYPH: Record<Vibe, string> = {
  bar: '🍺',
  brewery: '🍻',
  wine: '🍷',
  cocktails: '🍸',
  restaurant: '🍽️',
  casual: '🥢',
}
