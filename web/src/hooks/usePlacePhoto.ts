import { useEffect, useState } from 'react'

// A venue's photo from Google Places, for the venue page hero. Only when Google
// Maps is loaded (there's a key); otherwise the hero keeps its gradient. Google
// requires showing the photographer's name with the photo. The iOS app can do
// the same with the Places SDK, from the same place id.

export interface PlacePhoto {
  url: string
  author?: { name: string; url?: string }
}

/** Per page load: one Places lookup per venue at most. */
const cache = new Map<string, Promise<PlacePhoto | null>>()

async function fetchPhoto(placeId: string): Promise<PlacePhoto | null> {
  try {
    const { Place } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary
    const place = new Place({ id: placeId })
    await place.fetchFields({ fields: ['photos'] })
    const photo = place.photos?.[0]
    if (!photo) return null
    const author = photo.authorAttributions[0]
    return {
      url: photo.getURI({ maxWidth: 900, maxHeight: 600 }),
      author: author && { name: author.displayName, url: author.uri ?? undefined },
    }
  } catch {
    return null
  }
}

const googleReady = () => typeof google !== 'undefined' && Boolean(google.maps?.importLibrary)

export function usePlacePhoto(placeId: string | undefined): PlacePhoto | null {
  const [photo, setPhoto] = useState<PlacePhoto | null>(null)
  useEffect(() => {
    if (!placeId) return
    let current = true
    let tries = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const load = () => {
      if (!current) return
      // Opened straight from a shared link, the venue page can beat Google Maps
      // loading: wait for it a little, then give up (no key means no photos).
      if (!googleReady()) {
        if (++tries < 40) timer = setTimeout(load, 250)
        return
      }
      if (!cache.has(placeId)) cache.set(placeId, fetchPhoto(placeId))
      void cache.get(placeId)!.then((p) => current && setPhoto(p))
    }
    load()
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [placeId])
  return photo
}
