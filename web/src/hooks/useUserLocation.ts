import { useCallback, useEffect, useRef, useState } from 'react'
import { metersToRegion, NEAR_METERS } from '../lib/areas'
import type { Area, LatLng } from '../lib/types'

export type LocationStatus = 'idle' | 'locating' | 'near' | 'far' | 'denied' | 'unavailable'

export interface Located {
  status: 'idle' | 'locating' | 'located' | 'denied' | 'unavailable'
  position?: LatLng
  request: () => void
}

export interface UserLocation {
  status: LocationStatus
  position?: LatLng
  /** Where walking distances are measured from. */
  origin: LatLng
  originLabel: string
  request: () => void
}

/** Where someone is, wherever that is. `relativeTo` then says whether it's near the area shown. */
export function useUserLocation(enabled: boolean): Located {
  const [status, setStatus] = useState<Located['status']>('idle')
  const [position, setPosition] = useState<LatLng>()
  const watchId = useRef<number | null>(null)

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      return
    }
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
    setStatus('locating')
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('located')
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 },
    )
  }, [])

  useEffect(() => {
    if (enabled) request()
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [enabled, request])

  return { status, position, request }
}

/** Distances are from the person when they're in or near the area, else from its default origin. */
export function relativeTo(located: Located, area: Area): UserLocation {
  const near = located.status === 'located' && located.position && metersToRegion(located.position, area.region) <= NEAR_METERS
  const status: LocationStatus = located.status === 'located' ? (near ? 'near' : 'far') : located.status
  return {
    status,
    position: located.position,
    origin: near && located.position ? located.position : area.origin,
    originLabel: near ? 'you' : area.origin.label,
    request: located.request,
  }
}
