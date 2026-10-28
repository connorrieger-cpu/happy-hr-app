import type { Area } from '../../../lib/types'

// Liberty Village, Toronto: Dufferin St to Strachan Ave, King St W to the rail line
// (Lakeshore West GO). Map: https://www.google.com/maps/@43.6385,-79.4195,16z
// Corners from Google Places (October 2026).
export const LIBERTY_VILLAGE: Area = {
  id: 'liberty-village',
  name: 'Liberty Village',
  city: 'Toronto',
  center: { lat: 43.6386, lng: -79.4192 },
  origin: { lat: 43.6383, lng: -79.4196, label: 'Liberty St & Atlantic Ave' },
  // Hanna Ave, King to Liberty.
  spine: [
    { lat: 43.6372, lng: -79.4183 },
    { lat: 43.6403, lng: -79.4196 },
  ],
  bearing: -16.7,
  bounds: { south: 43.6348, west: -79.4285, north: 43.6428, east: -79.41 },
  // King & Dufferin, King & Strachan, Strachan at the tracks, Exhibition GO, Dufferin at the tracks.
  region: [
    { lat: 43.63895, lng: -79.42736 },
    { lat: 43.64205, lng: -79.41195 },
    { lat: 43.638, lng: -79.4102 },
    { lat: 43.6359, lng: -79.4188 },
    { lat: 43.6361, lng: -79.4268 },
  ],
  covers: 'Liberty Village, from Dufferin to Strachan and King to the tracks',
}
