import type { Area } from '../../../lib/types'

// Burlington: the whole city, from Aldershot to Burloak and up to the escarpment, plus
// Oakville west of Third Line (Bronte, West Oak Trails, Palermo), with the map opening on
// downtown (Brant St and the waterfront). Map: https://www.google.com/maps/@43.3255,-79.799,15z
// The region is a box around Burlington whose east side follows Third Line (its corners are
// Google's intersections with Lakeshore, Rebecca, Speers, Upper Middle and Dundas, carried on
// north-west to the box). The sweep also keeps only places whose Google address is in
// Burlington or Oakville, so Waterdown (Hamilton) and Milton stay out.
export const BURLINGTON: Area = {
  id: 'burlington',
  name: 'Burlington',
  city: 'Burlington',
  center: { lat: 43.3255, lng: -79.799 },
  origin: { lat: 43.32446, lng: -79.79607, label: 'Brant St & Lakeshore' },
  // Brant St, Lakeshore Rd to Caroline St.
  spine: [
    { lat: 43.3245, lng: -79.7961 },
    { lat: 43.3302, lng: -79.8004 },
  ],
  bearing: 0,
  bounds: { south: 43.319, west: -79.808, north: 43.332, east: -79.788 },
  region: [
    { lat: 43.285, lng: -79.925 },
    { lat: 43.5, lng: -79.925 },
    // Third Line, from up past Dundas down to the lake.
    { lat: 43.5, lng: -79.8286 },
    { lat: 43.4503, lng: -79.7607 },
    { lat: 43.4375, lng: -79.7432 },
    { lat: 43.4187, lng: -79.7174 },
    { lat: 43.4105, lng: -79.7063 },
    { lat: 43.4048, lng: -79.6985 },
    { lat: 43.285, lng: -79.6985 },
  ],
  addressCity: 'Burlington',
  alsoCities: ['Oakville'],
  covers: 'Burlington and Oakville to Third Line, with downtown Burlington first',
}
