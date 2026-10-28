import type { Area } from '../../../lib/types'

// Guelph: the whole city, with the map opening on downtown (around St. George's Square).
// Map: https://www.google.com/maps/@43.5446,-80.2482,15z
// The region is a box around the city limits; the sweep also keeps only places whose
// Google address is in Guelph, so Puslinch and Guelph/Eramosa stay out.
export const GUELPH: Area = {
  id: 'guelph',
  name: 'Guelph',
  city: 'Guelph',
  center: { lat: 43.5446, lng: -80.2482 },
  origin: { lat: 43.54584, lng: -80.24938, label: 'St. George’s Square' },
  // Wyndham St N, Carden St to Woolwich St.
  spine: [
    { lat: 43.5435, lng: -80.2466 },
    { lat: 43.5476, lng: -80.2505 },
  ],
  bearing: 0,
  bounds: { south: 43.539, west: -80.26, north: 43.552, east: -80.238 },
  region: [
    { lat: 43.483, lng: -80.335 },
    { lat: 43.6, lng: -80.335 },
    { lat: 43.6, lng: -80.145 },
    { lat: 43.483, lng: -80.145 },
  ],
  addressCity: 'Guelph',
  covers: 'Guelph, with downtown first',
}
