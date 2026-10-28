import { AdvancedMarker, APIProvider, ColorScheme, Map, RenderingType, useMap } from '@vis.gl/react-google-maps'
import { useEffect, useRef, useState } from 'react'
import { centerFor, googleWorldSize } from '../lib/mapMath'
import type { LatLng } from '../lib/types'
import type { Insets, MapViewProps } from './MapView'
import { usePinLabels } from './usePinLabels'
import { UserDot, VenuePin } from './VenuePin'

// DEMO_MAP_ID enables Advanced Markers without any Cloud Console setup.
// Create your own Map ID to customise the base map style.
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'
const MIN_FOCUS_ZOOM = 17.2

export default function GoogleMapView({ apiKey, ...props }: MapViewProps & { apiKey: string }) {
  return (
    <APIProvider apiKey={apiKey} region="CA" language="en">
      <GoogleMapInner {...props} />
    </APIProvider>
  )
}

function GoogleMapInner({ area, items, selectedId, onSelect, user, dark, insets, recenterOn, now, daily }: MapViewProps) {
  const [zoom, setZoom] = useState(16.5)
  // Markers wait for the first tiles: with a rejected key Google never draws any,
  // and creating markers on a failed map throws inside Google's own code.
  const [ready, setReady] = useState(false)
  const [heading, setHeading] = useState(area.bearing)
  const pins = usePinLabels(area, items, selectedId, googleWorldSize(zoom), heading, now, daily)

  return (
    <Map
      // Google only reads colorScheme when a map is created, so a theme change makes a new map.
      key={dark ? 'dark' : 'light'}
      mapId={MAP_ID}
      colorScheme={dark ? ColorScheme.DARK : ColorScheme.LIGHT}
      // Vector rendering is what allows rotating the map along Ossington.
      renderingType={RenderingType.VECTOR}
      defaultBounds={{ ...area.bounds, padding: insets }}
      defaultHeading={(area.bearing + 360) % 360}
      disableDefaultUI
      clickableIcons={false}
      gestureHandling="greedy"
      onZoomChanged={(e) => setZoom(e.detail.zoom)}
      onHeadingChanged={(e) => setHeading(e.detail.heading)}
      onTilesLoaded={() => setReady(true)}
      style={{ position: 'absolute', inset: 0 }}
    >
      {ready &&
        pins.map((pin) => (
          <AdvancedMarker
            key={pin.rv.venue.id}
            position={{ lat: pin.rv.venue.lat, lng: pin.rv.venue.lng }}
            zIndex={pin.zIndex}
            // Registers the marker as clickable with Google (keyboard focus, pointer cursor).
            onClick={() => onSelect(pin.rv.venue.id)}
          >
            <VenuePin pin={pin} selected={pin.rv.venue.id === selectedId} onSelect={onSelect} />
          </AdvancedMarker>
        ))}
      {ready && user && (
        <AdvancedMarker position={user} zIndex={50}>
          <UserDot />
        </AdvancedMarker>
      )}
      <CameraFollow
        area={area}
        target={items.find((rv) => rv.venue.id === selectedId)?.venue}
        recenterOn={recenterOn}
        insets={insets}
      />
    </Map>
  )
}

interface CameraFollowProps {
  area: MapViewProps['area']
  target?: LatLng
  recenterOn?: MapViewProps['recenterOn']
  insets: Insets
}

/** Pans so the target sits in the middle of the uncovered part of the map. */
function CameraFollow({ area, target, recenterOn, insets }: CameraFollowProps) {
  const map = useMap()
  const insetsRef = useRef(insets)
  insetsRef.current = insets
  const userMoved = useRef(false)

  useEffect(() => {
    if (!map) return
    const listener = map.addListener('dragstart', () => (userMoved.current = true))
    return () => listener.remove()
  }, [map])

  // Re-frame the strip when the sheet changes how much map is visible.
  const { top, right, bottom, left } = insets
  useEffect(() => {
    if (map && !target && !userMoved.current) map.fitBounds(area.bounds, { top, right, bottom, left })
  }, [map, area.bounds, target, top, right, bottom, left])

  const panTo = (point: LatLng, minZoom?: number) => {
    if (!map) return
    if (minZoom && (map.getZoom() ?? 0) < minZoom) map.setZoom(minZoom)
    const { top, bottom, left, right } = insetsRef.current
    const zoom = map.getZoom() ?? 16
    map.panTo(centerFor(point, (left - right) / 2, (top - bottom) / 2, googleWorldSize(zoom), map.getHeading() ?? 0))
  }

  useEffect(() => {
    if (target) panTo(target, MIN_FOCUS_ZOOM)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the selection changes
  }, [map, target?.lat, target?.lng])

  useEffect(() => {
    if (recenterOn) panTo(recenterOn.point)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, recenterOn])

  return null
}
