import type { FoodType, Special, Venue } from './types'

// Food types for search. A venue matches a type when it's tagged with it, or
// when its category or one of its specials mentions it (so a pub with a
// Tuesday burger shows up under Burgers).

export interface FoodTypeInfo {
  id: FoodType
  label: string
  emoji: string
  /** Lowercase words that count as a mention. */
  words: string[]
}

export const FOOD_TYPES: FoodTypeInfo[] = [
  { id: 'pizza', label: 'Pizza', emoji: '🍕', words: ['pizza', 'pizzetta'] },
  { id: 'pasta', label: 'Pasta & Italian', emoji: '🍝', words: ['pasta', 'italian', 'rigatoni', 'spaghetti'] },
  { id: 'tacos', label: 'Tacos & Mexican', emoji: '🌮', words: ['taco', 'mexican', 'nachos', 'burrito'] },
  { id: 'burgers', label: 'Burgers', emoji: '🍔', words: ['burger', 'sliders'] },
  { id: 'wings', label: 'Wings', emoji: '🍗', words: ['wings'] },
  { id: 'oysters', label: 'Oysters & seafood', emoji: '🦪', words: ['oyster', 'seafood', 'fish', 'crudo', 'caviar'] },
  { id: 'sushi', label: 'Sushi & Japanese', emoji: '🍣', words: ['sushi', 'japanese', 'izakaya', 'maki', 'nigiri', 'sashimi'] },
  { id: 'korean', label: 'Korean', emoji: '🍲', words: ['korean'] },
  { id: 'vietnamese', label: 'Vietnamese', emoji: '🍜', words: ['vietnamese', 'pho', 'banh mi'] },
  { id: 'thai', label: 'Thai', emoji: '🌶️', words: ['thai'] },
  { id: 'asian', label: 'Asian fusion', emoji: '🥢', words: ['asian', 'malaysian'] },
  { id: 'middle-eastern', label: 'Mediterranean', emoji: '🧆', words: ['middle eastern', 'mediterranean', 'israeli', 'falafel', 'hummus'] },
  { id: 'greek', label: 'Greek', emoji: '🫒', words: ['greek'] },
  { id: 'french', label: 'French', emoji: '🥖', words: ['french', 'bistro'] },
  { id: 'spanish', label: 'Tapas & Portuguese', emoji: '🥘', words: ['tapas', 'portuguese', 'spanish'] },
  { id: 'steak', label: 'Steak', emoji: '🥩', words: ['steak', 'prime rib'] },
  { id: 'pub', label: 'Pub food', emoji: '🥧', words: ['pub', 'fish & chips', 'pie'] },
  { id: 'vegan', label: 'Vegan', emoji: '🌱', words: ['vegan', 'plant-based', 'veggie'] },
  { id: 'diner', label: 'Diner', emoji: '🍳', words: ['diner', 'brunch'] },
  { id: 'snacks', label: 'Bar snacks', emoji: '🥨', words: ['snack', 'bites', 'fries', 'nachos'] },
]

const BY_ID = new Map(FOOD_TYPES.map((f) => [f.id, f]))

export const foodInfo = (id: FoodType) => BY_ID.get(id)!

/** Every special a venue offers, happy hours and daily specials alike. */
export function allSpecials(venue: Venue): Special[] {
  return [...venue.happyHours.flatMap((w) => w.specials), ...(venue.dailySpecials ?? []).flatMap((d) => d.specials)]
}

const mentions = (text: string, words: string[]) => {
  const lower = text.toLowerCase()
  return words.some((w) => lower.includes(w))
}

/** Is this a food special that mentions the food type? */
export const specialIsFood = (special: Special, type: FoodType) => special.kind === 'food' && mentions(special.item, foodInfo(type).words)

/** The first special that mentions this food type, if any. */
export function foodSpecial(venue: Venue, type: FoodType): Special | undefined {
  return allSpecials(venue).find((s) => specialIsFood(s, type))
}

export function servesFood(venue: Venue, type: FoodType): boolean {
  if (venue.food?.includes(type)) return true
  return mentions(venue.category, foodInfo(type).words) || foodSpecial(venue, type) !== undefined
}

/** Food types that at least one of these venues serves, in list order. */
export function foodTypesIn(venues: Venue[]): FoodTypeInfo[] {
  return FOOD_TYPES.filter((f) => venues.some((v) => servesFood(v, f.id)))
}
