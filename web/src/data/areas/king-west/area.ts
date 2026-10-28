import type { Area } from '../../../lib/types'

// King West, Toronto: King St W from Spadina Ave to Tecumseth St, with a block either side
// (Adelaide St W to Wellington St W), so Portland, Bathurst and the side streets count.
// Map: https://www.google.com/maps/@43.6445,-79.4,16z
// Corners from Google Places (October 2026).
export const KING_WEST: Area = {
  id: 'king-west',
  name: 'King West',
  city: 'Toronto',
  center: { lat: 43.64445, lng: -79.40006 },
  origin: { lat: 43.64445, lng: -79.40006, label: 'King & Portland' },
  // King St W, Tecumseth to Spadina.
  spine: [
    { lat: 43.64339, lng: -79.40526 },
    { lat: 43.64548, lng: -79.39491 },
  ],
  bearing: -16.7,
  bounds: { south: 43.6418, west: -79.4062, north: 43.6472, east: -79.394 },
  // Spadina & Wellington, Spadina & Adelaide, Tecumseth & Adelaide, Tecumseth & Wellington.
  region: [
    { lat: 43.64401, lng: -79.39454 },
    { lat: 43.64677, lng: -79.39545 },
    { lat: 43.64468, lng: -79.40578 },
    { lat: 43.64212, lng: -79.40475 },
  ],
  covers: 'King West, from Spadina to Tecumseth and Adelaide to Wellington',
}
