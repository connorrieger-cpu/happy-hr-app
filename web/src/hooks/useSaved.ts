import { useCallback, useState } from 'react'

// Things kept on this device only: favourite spots, and the keys of venues
// this device manages. No account needed. (The iOS app keeps the same in
// UserDefaults and the Keychain.)

const FAVOURITES_KEY = 'happyhr:favourites'
const VENUE_KEYS_KEY = 'happyhr:venue-keys'

function load<T>(key: string, fallback: T): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null')
    return value ?? fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: it lasts until reload.
  }
}

/** Starred spots, newest first. */
export function useFavourites() {
  const [ids, setIds] = useState<string[]>(() => {
    const saved = load<unknown>(FAVOURITES_KEY, [])
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : []
  })
  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
      save(FAVOURITES_KEY, next)
      return next
    })
  }, [])
  return { ids, has: (id: string) => ids.includes(id), toggle }
}

/** Venue keys this device holds, by venue id. */
export function useVenueKeys() {
  const [keys, setKeys] = useState<Record<string, string>>(() => load(VENUE_KEYS_KEY, {}))
  const add = useCallback((venueId: string, key: string) => {
    setKeys((prev) => {
      const next = { ...prev, [venueId]: key }
      save(VENUE_KEYS_KEY, next)
      return next
    })
  }, [])
  const remove = useCallback((venueId: string) => {
    setKeys((prev) => {
      const { [venueId]: _, ...next } = prev
      save(VENUE_KEYS_KEY, next)
      return next
    })
  }, [])
  return { keys, add, remove }
}

const HEADS_UP_KEY = 'happyhr:heads-up'

/** Venues already given a heads-up today, so each gets at most one a day. */
export function headsUpGiven(day: string): string[] {
  const saved = load<{ day?: string; ids?: string[] }>(HEADS_UP_KEY, {})
  return saved.day === day ? (saved.ids ?? []) : []
}

export function rememberHeadsUp(day: string, id: string) {
  save(HEADS_UP_KEY, { day, ids: [...headsUpGiven(day), id] })
}
