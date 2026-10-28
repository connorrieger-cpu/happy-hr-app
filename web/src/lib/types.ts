// Shared domain types. Kept free of React/DOM so the iOS app can reuse them.

/** 0 = Sunday … 6 = Saturday (matches Date#getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface Special {
  kind: 'drink' | 'food'
  /** Lowercase noun when priced ("pints" → "$6 pints"), full phrase otherwise. */
  item: string
  price?: number
}

export interface HappyHourWindow {
  days: Weekday[]
  /** Minutes after midnight, Toronto time. */
  start: number
  /** Minutes after midnight of the start day; may exceed 1440 for past-midnight windows. */
  end: number
  specials: Special[]
  /** Caveat shown with the window, e.g. where it's listed or a known conflict. */
  note?: string
  /** Set when someone in the community (or the venue itself) added this window. */
  community?: CommunityRef
}

export interface CommunityRef {
  id: string
  createdAt: string
  /** Posted by the venue's own staff (with a venue key), not a member of the public. */
  byVenue?: boolean
}

/**
 * A deal tied to a day of the week rather than a happy-hour window, e.g. a
 * Tuesday burger. Shown alongside happy hours, never in place of their timers.
 */
export interface DailySpecial {
  days: Weekday[]
  /** Short name, e.g. "Taco Tuesday". */
  title?: string
  specials: Special[]
  /** Hours in minutes after midnight; omitted when it runs whenever the venue is open. */
  start?: number
  end?: number
  note?: string
  community?: CommunityRef
}

/** One stretch a venue is open: the day it opens, and minutes after midnight (a close past 1440 runs into the next day). */
export interface OpenSpan {
  day: Weekday
  open: number
  close: number
}

/** Amenities, for the vibe filters. "Open late", "Open now" and "Trivia" are worked out from hours and specials instead. */
export type Amenity = 'patio' | 'live-music' | 'sports' | 'groups' | 'dogs'

/** What a place is known for eating, for search. */
export type FoodType =
  | 'pizza'
  | 'pasta'
  | 'tacos'
  | 'burgers'
  | 'wings'
  | 'oysters'
  | 'sushi'
  | 'korean'
  | 'vietnamese'
  | 'thai'
  | 'asian'
  | 'middle-eastern'
  | 'greek'
  | 'french'
  | 'spanish'
  | 'steak'
  | 'pub'
  | 'vegan'
  | 'diner'
  | 'snacks'

export type Vibe = 'bar' | 'brewery' | 'wine' | 'cocktails' | 'restaurant' | 'casual'

export interface Venue {
  id: string
  name: string
  category: string
  vibe: Vibe
  address: string
  lat: number
  lng: number
  tags: string[]
  /** Other names people search for ("Black Swan" for Blk Swan). Search only; never shown. */
  aka?: string[]
  /** Empty when no happy hour is known; the venue is still listed, without deals. */
  happyHours: HappyHourWindow[]
  /** Deals on certain days of the week (a Tuesday burger, Wine Wednesday). */
  dailySpecials?: DailySpecial[]
  /** What it serves, for search by food. */
  food?: FoodType[]
  /** Opening hours; absent when unknown. */
  hours?: OpenSpan[]
  amenities?: Amenity[]
  /** Google Places id (for photos on the web; kept, as Google allows). */
  placeId?: string
  menuUrl?: string
  /** When the deals were last checked by us, e.g. "2026-10-26". */
  checked?: string
  /** Where the deal details (happy hours and daily specials) come from. */
  deals: DealProvenance
  sources?: DealSource[]
  /** Display format, e.g. "(416) 532-8000". */
  phone?: string
  website?: string
  /** The venue's exact Google Maps place page. */
  googleMapsUrl?: string
  booking?: { provider: 'opentable' | 'resy' | 'google'; url: string }
}

/**
 * venue: the venue's own website or menu.
 * reported: a published article, listing or booking page.
 * community: added by people using the app, unchecked.
 * sample: placeholder data for the beta.
 * none: no deals known yet (the venue is listed so people can add one).
 */
export type DealProvenance = 'venue' | 'reported' | 'community' | 'sample' | 'none'

export interface DealSource {
  label: string
  url: string
  /** When the source was published or last updated, e.g. "2026-09" or "2025-10-14". */
  date: string
}

export interface LatLng {
  lat: number
  lng: number
}

export interface Area {
  id: string
  name: string
  city: string
  center: LatLng
  /** Default distance origin when the user's location is unknown or far away. */
  origin: LatLng & { label: string }
  /** Two points along the main street, south to north, for label placement. */
  spine: [LatLng, LatLng]
  /** Map rotation (degrees) that makes the main street run straight up the screen. */
  bearing: number
  /** South-west and north-east corners the map frames when the area opens (downtown, for a city). */
  bounds: { south: number; west: number; north: number; east: number }
  /** The area's outline: which spots belong to it, and which area someone standing somewhere is in. */
  region: LatLng[]
  /** For a whole city: only places whose Google address is in this city count (the region is a rough box). */
  addressCity?: string
  /** More cities whose addresses count, where the region runs past `addressCity` (Burlington into Oakville). */
  alsoCities?: string[]
  /** What the list covers, after "in": "Kensington Market, from Bathurst to Spadina and College to Dundas". */
  covers?: string
}
