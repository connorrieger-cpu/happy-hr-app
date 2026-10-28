import { setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useEffect, useRef, useState } from 'react'
import Map, { AttributionControl, Marker, type MapRef } from 'react-map-gl/maplibre'
import { maplibreWorldSize } from '../lib/mapMath'
import type { MapViewProps } from './MapView'
import { usePinLabels } from './usePinLabels'
import { UserDot, VenuePin } from './VenuePin'

// No-key fallback: MapLibre with OpenFreeMap vector tiles (free, OSM data).
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark'
const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron'
const MIN_FOCUS_ZOOM = 16.2

// MapLibre finds its worker relative to its own module, which Vite's dependency
// pre-bundling moves. Point it at the real file instead.
setWorkerUrl(workerUrl)

export default function FallbackMap({ area, items, selectedId, onSelect, user, dark, insets, recenterOn, now, daily }: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const [zoom, setZoom] = useState(15.5)
  const pins = usePinLabels(area, items, selectedId, maplibreWorldSize(zoom), area.bearing, now, daily)
  const insetsRef = useRef(insets)
  insetsRef.current = insets
  /** Set once the user pans or zooms by hand; after that we stop re-framing for them. */
  const userMoved = useRef(false)

  const frameStrip = (duration = 0) => {
    const { south, west, north, east } = area.bounds
    mapRef.current?.fitBounds(
      [
        [west, south],
        [east, north],
      ],
      { padding: insetsRef.current, bearing: area.bearing, duration },
    )
  }

  // Keep the selected venue in the visible part of the map.
  useEffect(() => {
    const map = mapRef.current
    const venue = items.find((rv) => rv.venue.id === selectedId)?.venue
    if (!map || !venue) return
    map.easeTo({
      center: [venue.lng, venue.lat],
      zoom: Math.max(map.getZoom(), MIN_FOCUS_ZOOM),
      padding: insetsRef.current,
      duration: 650,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the selection changes
  }, [selectedId])

  // Re-frame the strip when the sheet or detail panel changes how much map is visible.
  const { top, right, bottom, left } = insets
  useEffect(() => {
    if (!selectedId && !userMoved.current) frameStrip(450)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- frameStrip reads the latest insets from a ref
  }, [top, right, bottom, left, selectedId])

  useEffect(() => {
    if (!recenterOn) return
    mapRef.current?.easeTo({ center: [recenterOn.point.lng, recenterOn.point.lat], padding: insetsRef.current, duration: 650 })
  }, [recenterOn])

  return (
    <Map
      ref={mapRef}
      mapStyle={dark ? STYLE_DARK : STYLE_LIGHT}
      initialViewState={{ longitude: area.center.lng, latitude: area.center.lat, zoom: 15.5, bearing: area.bearing }}
      onLoad={(e) => {
        frameStrip()
        // MapLibre opens the compact credit on load; start it as just the (i) button.
        const credit = e.target.getContainer().querySelector('.maplibregl-ctrl-attrib')
        credit?.removeAttribute('open')
        credit?.classList.remove('maplibregl-compact-show')
      }}
      onZoom={(e) => setZoom(e.viewState.zoom)}
      onMoveStart={(e) => {
        if (e.originalEvent) userMoved.current = true
      }}
      attributionControl={false}
      dragRotate={false}
      pitchWithRotate={false}
      touchPitch={false}
      maxZoom={19}
      minZoom={12}
      style={{ position: 'absolute', inset: 0 }}
    >
      <AttributionControl position="bottom-left" compact />
      {pins.map((pin) => (
        <Marker
          key={pin.rv.venue.id}
          longitude={pin.rv.venue.lng}
          latitude={pin.rv.venue.lat}
          anchor="center"
          style={{ zIndex: pin.zIndex }}
        >
          <VenuePin pin={pin} selected={pin.rv.venue.id === selectedId} onSelect={onSelect} />
        </Marker>
      ))}
      {user && (
        <Marker longitude={user.lng} latitude={user.lat} anchor="center" style={{ zIndex: 50 }}>
          <UserDot />
        </Marker>
      )}
    </Map>
  )
}
