import { Component, lazy, Suspense, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { RankedVenue } from '../lib/deals'
import type { Clock } from '../lib/time'
import type { Area, LatLng } from '../lib/types'

export interface Insets {
  top: number
  right: number
  bottom: number
  left: number
}

export interface MapViewProps {
  area: Area
  items: RankedVenue[]
  selectedId: string | null
  onSelect: (id: string) => void
  user?: LatLng
  dark: boolean
  /** Screen space covered by the top bar and sheet, kept clear when framing and panning. */
  insets: Insets
  /** How far the sheet or sidebar covers the map's bottom and left edges, for placing map credits. */
  covered: { bottom: number; left: number }
  /** Bumped to re-centre on the user's location. */
  recenterOn?: { point: LatLng; nonce: number }
  /** The time shown in the app, for daily specials. */
  now: Clock
  /** The Daily specials view: pins show today's specials instead of happy hours. */
  daily: boolean
}

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const GoogleMapView = lazy(() => import('./GoogleMap'))
const FallbackMapView = lazy(() => import('./FallbackMap'))

declare global {
  interface Window {
    /** Called by the Google Maps script when the API key is rejected. */
    gm_authFailure?: () => void
  }
}

/** Google Maps when an API key is configured, otherwise (or if Google fails) a free MapLibre map. */
export function MapView(props: MapViewProps) {
  const [googleFailed, setGoogleFailed] = useState(false)

  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn('Google Maps rejected the API key. Using the fallback map instead.')
      setGoogleFailed(true)
    }
    return () => {
      delete window.gm_authFailure
    }
  }, [])

  const fallback = <FallbackMapView {...props} />
  const onError = () => setGoogleFailed(true)
  const coverVars = {
    '--map-cover-bottom': `${props.covered.bottom}px`,
    '--map-cover-left': `${props.covered.left}px`,
  } as CSSProperties
  return (
    <div className="map" style={coverVars}>
      <Suspense fallback={null}>
        {GOOGLE_KEY && !googleFailed ? (
          // Two layers: Google can throw again while the failed map is being torn down.
          <MapErrorBoundary fallback={fallback} onError={onError}>
            <MapErrorBoundary fallback={null} onError={onError}>
              <GoogleMapView apiKey={GOOGLE_KEY} {...props} />
            </MapErrorBoundary>
          </MapErrorBoundary>
        ) : (
          fallback
        )}
      </Suspense>
    </div>
  )
}

/** Keeps a map failure from taking the rest of the app down with it. */
class MapErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('Google Maps failed. Using the fallback map instead.', error)
    this.props.onError()
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
