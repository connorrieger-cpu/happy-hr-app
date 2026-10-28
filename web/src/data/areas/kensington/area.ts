import type { Area } from '../../../lib/types'

// Kensington Market, Toronto: Bathurst St to Spadina Ave, Dundas St W to College St.
// Map: https://www.google.com/maps/@43.6553,-79.4029,16z
// Corners from Google Places (October 2026).
export const KENSINGTON: Area = {
  id: 'kensington',
  name: 'Kensington',
  city: 'Toronto',
  center: { lat: 43.6551, lng: -79.4026 },
  origin: { lat: 43.6545, lng: -79.4006, label: 'Kensington Ave & Baldwin' },
  // Augusta Ave, Dundas to College.
  spine: [
    { lat: 43.6527, lng: -79.4019 },
    { lat: 43.6572, lng: -79.4037 },
  ],
  bearing: -16.7,
  bounds: { south: 43.6519, west: -79.4085, north: 43.6584, east: -79.3975 },
  // Bathurst & Dundas, Bathurst & College, Spadina & College, Spadina & Dundas.
  region: [
    { lat: 43.6523, lng: -79.40601 },
    { lat: 43.65645, lng: -79.40769 },
    { lat: 43.65795, lng: -79.40015 },
    { lat: 43.65291, lng: -79.39815 },
  ],
  covers: 'Kensington Market, from Bathurst to Spadina and College to Dundas',
}
