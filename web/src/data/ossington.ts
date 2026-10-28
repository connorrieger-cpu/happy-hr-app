import type { Area, DealSource, Special, Venue, Weekday } from '../lib/types'
import { DIRECTORY } from './ossington.directory'
import { PLACE_DETAILS } from './ossington.places'

// Real deals in the Ossington area: Ossington Ave from Queen to Dundas, plus
// Queen St W and Dundas St W from Dovercourt to Shaw. Ossington was researched
// 2026-10-26 (see reports/Ossington happy hour specials.md); the Queen and Dundas
// strips and the daily specials were added the same day from the venues' own
// sites, their OpenTable listings and local guides. Every other restaurant and
// bar in the area is in ossington.directory.ts.
//
// Two kinds of deal:
//   happyHours     time-boxed happy hours (the app counts these down)
//   dailySpecials  deals on certain days of the week (a Tuesday burger)
//
// The app lists places that serve alcohol, and leaves out national and
// out-of-town chains (Toronto-local groups stay). The one exception is Central
// (also in Calgary and Vancouver), kept for its happy hour.
//
// `deals` says where each venue's details come from:
//   'venue'    its own website, menu or OpenTable listing (current as of the check)
//   'reported' a third-party guide or an undated post, so it's unconfirmed
//
// Checked, no deals found (so in the directory): Pho Tien Thanh, Union, Mamakas
// Taverna, Oddseoul, Soos, Bellwoods Brewery, Golden Turtle, Côte de Boeuf,
// Reposado, Paris Paris, Foxley, Salt Wine Bar, La Banane, Small Talk, plus every
// other site and OpenTable page that could be read. Taberna LX mentions a happy
// hour but gives no times. Favorites Thai's "Wine Wednesday" post is no longer on
// its site, so it was dropped. Neon Tiger's "buck-a-shuck Wednesdays" came from a
// review, and Google says it's closed Wednesdays.
// Closed: La Cubana (June 2026), Bar Habana (inside La Cubana), Superpoint (August 2025),
// Bambú (180 Ossington, per Google). Temporarily closed per Google (October 2026):
// Out of Character (996 Queen St W), Uh Bar, Frank's Jerk, The Cocktail Shop.
//
// Phone numbers, websites and Google Maps links come from Google Places (October 2026).
// Booking links are each venue's OpenTable or Resy page; 'google' means Google lists
// the venue as reservable, so the link is its Google Maps page with "Reserve a table".
//
// Coordinates are from OpenStreetMap or Google.

export const OSSINGTON: Area = {
  id: 'ossington',
  name: 'Ossington',
  city: 'Toronto',
  center: { lat: 43.6466, lng: -79.4206 },
  origin: { lat: 43.6496, lng: -79.4209, label: 'Ossington & Dundas' },
  spine: [
    { lat: 43.6444, lng: -79.41894 },
    { lat: 43.6498, lng: -79.42086 },
  ],
  bearing: -14.4,
  // Dovercourt to Shaw, Queen to Dundas.
  bounds: { south: 43.6428, west: -79.4252, north: 43.6503, east: -79.416 },
  region: [
    { lat: 43.6428, lng: -79.4252 },
    { lat: 43.6503, lng: -79.4252 },
    { lat: 43.6503, lng: -79.416 },
    { lat: 43.6428, lng: -79.416 },
  ],
  covers: 'Ossington, plus Queen and Dundas from Dovercourt to Shaw',
}

/** Hours (and optional minutes) → minutes after midnight. 25 = 1 AM the next day. */
const t = (h: number, m = 0) => h * 60 + m

const DAILY: Weekday[] = [0, 1, 2, 3, 4, 5, 6]
const MON_FRI: Weekday[] = [1, 2, 3, 4, 5]
const MON_THU: Weekday[] = [1, 2, 3, 4]
const TUE_FRI: Weekday[] = [2, 3, 4, 5]
const WED_SAT: Weekday[] = [3, 4, 5, 6]
const THU_SUN: Weekday[] = [4, 5, 6, 0]
const SUN_THU: Weekday[] = [0, 1, 2, 3, 4]
const SUN_FRI: Weekday[] = [0, 1, 2, 3, 4, 5]
const WEEKEND: Weekday[] = [0, 6]

const CENTRAL_SPECIALS: Special[] = [
  { kind: 'drink', item: 'highballs (1 oz)', price: 5 },
  { kind: 'drink', item: 'OG Shaft on Draft', price: 5 },
  { kind: 'drink', item: 'house beer', price: 5.5 },
  { kind: 'drink', item: 'house wine (7 oz)', price: 7 },
  { kind: 'drink', item: 'mules (1 oz)', price: 8 },
  { kind: 'drink', item: 'espresso martinis (2 oz)', price: 9 },
  { kind: 'drink', item: 'classic margaritas (2 oz)', price: 10 },
  { kind: 'food', item: 'cheeseburger sliders (min 2)', price: 4 },
  { kind: 'food', item: 'cheddar perogies', price: 5 },
  { kind: 'food', item: 'spicy California roll', price: 5 },
  { kind: 'food', item: 'crispy chili salmon roll', price: 6 },
  { kind: 'food', item: 'truffle fries', price: 11 },
]

const AZHAR_SPECIALS: Special[] = [
  { kind: 'drink', item: 'Burdock beer cans', price: 5 },
  { kind: 'drink', item: 'spritzes', price: 10 },
  { kind: 'drink', item: 'Half-price wine bottles' },
  { kind: 'food', item: "za'atar fries, pickles & olives or falafel", price: 10 },
  { kind: 'food', item: 'dips: hummus, muhammara, babaganoush, labneh', price: 15 },
  { kind: 'food', item: 'salmon crudo or lamb kebab', price: 15 },
]

const LA_CHINGADA_HH: Special[] = [
  { kind: 'drink', item: 'signature margaritas', price: 10 },
  { kind: 'food', item: 'happy hour food (12 dishes)', price: 6 },
]

const RHAPSODY_HH: Special[] = [
  { kind: 'drink', item: 'Estrella Damm', price: 7 },
  { kind: 'drink', item: 'classic margaritas', price: 10 },
  { kind: 'drink', item: '8 oz house red or white', price: 10 },
  { kind: 'drink', item: 'Hypnotic or Cool Relax cocktails', price: 11 },
]

const LIBRETTO_HH: Special[] = [
  { kind: 'drink', item: 'Half-price bar rail' },
  { kind: 'drink', item: 'feature beers', price: 6 },
]

const FRINGINTO: DealSource = {
  label: 'Fringe in Toronto happy hour list',
  url: 'https://www.fringinto.com/best-happy-hours-toronto/',
  date: '2025-06',
}

const GOODNIGHTMERE: DealSource = {
  label: 'Goodnightmere happy hour guide',
  url: 'https://goodnightmere.substack.com/p/best-happy-hour-toronto',
  date: 'undated',
}

const WITH_DEALS: Venue[] = [
  // ---------- From the venues' own websites, menus and OpenTable listings ----------
  {
    id: 'central',
    name: 'Central',
    category: 'Bar & kitchen',
    vibe: 'bar',
    address: '114 Ossington Ave',
    phone: '(647) 925-6337',
    website: 'https://centralrestaurants.ca/locations/toronto-ossington',
    googleMapsUrl: 'https://maps.google.com/?cid=16416524264852902454',
    booking: { provider: 'opentable', url: 'https://www.opentable.ca/r/central-restaurants-toronto-ossington-toronto' },
    lat: 43.64675,
    lng: -79.41999,
    tags: ['Local craft beer', 'Late night'],
    food: ['burgers', 'wings', 'tacos', 'sushi', 'snacks'],
    deals: 'venue',
    sources: [
      { label: 'Central Toronto Ossington menu', url: 'https://centralrestaurants.ca/toronto-ossington/menu', date: '2026-10' },
      { label: 'blogTO happy hours roundup', url: 'https://www.blogto.com/eat_drink/2025/09/happy-hours-toronto-september/', date: '2025-09' },
    ],
    happyHours: [
      { days: DAILY, start: t(14), end: t(17), specials: CENTRAL_SPECIALS },
      {
        days: SUN_THU,
        start: t(21),
        end: t(24),
        specials: CENTRAL_SPECIALS,
        note: 'Late night runs Sun–Thu from 9 PM to close per Central’s menu; other listings give slightly different days.',
      },
    ],
    dailySpecials: [
      { days: [1], title: 'Wine Not Monday', specials: [{ kind: 'drink', item: 'house wine', price: 7 }] },
      { days: [2], title: 'Half Off Tuesday', specials: [{ kind: 'drink', item: 'Half-price wine bottles' }] },
      {
        days: [3],
        title: 'Good in the Hood Wednesday',
        specials: [
          { kind: 'drink', item: 'Dad Beer', price: 6 },
          { kind: 'food', item: 'wings (1 lb)', price: 12 },
        ],
      },
      {
        days: [4],
        title: 'Viva la Thursday',
        specials: [
          { kind: 'drink', item: 'margaritas', price: 10 },
          { kind: 'food', item: 'carnitas tacos', price: 4 },
        ],
      },
      {
        days: [0],
        title: 'Almost Famous Sunday',
        specials: [
          { kind: 'drink', item: 'mimosas', price: 5 },
          { kind: 'drink', item: 'bottles of Veuve', price: 89 },
        ],
      },
      { days: WEEKEND, title: 'Weekend Warriors', start: t(11), end: t(15), specials: [{ kind: 'drink', item: 'Caesars', price: 7 }] },
      { days: DAILY, title: 'Shot of the Day', specials: [{ kind: 'drink', item: 'shot of the day', price: 5 }] },
    ],
  },
  {
    id: 'azhar',
    name: 'Azhar Kitchen + Bar',
    category: 'Middle Eastern',
    vibe: 'restaurant',
    address: '96 Ossington Ave',
    phone: '(647) 503-1098',
    website: 'https://azhartoronto.com/',
    googleMapsUrl: 'https://maps.google.com/?cid=7934032781455980144',
    booking: { provider: 'opentable', url: 'https://www.opentable.ca/r/azhar-kitchen-and-bar-toronto-1' },
    lat: 43.6463,
    lng: -79.41981,
    tags: ['Wood-fired'],
    food: ['middle-eastern'],
    deals: 'venue',
    sources: [
      { label: 'Azhar happy hour menu', url: 'https://azhartoronto.com/menu/happy-hour-menu', date: '2026-10' },
      { label: 'Azhar on OpenTable', url: 'https://www.opentable.ca/r/azhar-kitchen-and-bar-toronto-1', date: '2026-10' },
    ],
    happyHours: [
      { days: MON_FRI, start: t(16), end: t(18), specials: AZHAR_SPECIALS },
      { days: WEEKEND, start: t(15), end: t(17), specials: AZHAR_SPECIALS },
      {
        days: [5, 6],
        start: t(22),
        end: t(23),
        specials: [
          { kind: 'drink', item: 'Burdock beer cans', price: 5 },
          { kind: 'drink', item: 'cocktails', price: 10 },
          { kind: 'drink', item: 'Half-price select wine bottles' },
        ],
        note: 'Drinks-only late session, listed on OpenTable but not on Azhar’s own site.',
      },
    ],
    dailySpecials: [
      {
        days: [1],
        title: 'Martini Mondays',
        start: t(16),
        end: t(22),
        specials: [
          { kind: 'drink', item: 'martinis (classic, Vesper, espresso…)', price: 10 },
          { kind: 'food', item: "za'atar fries with a martini", price: 8 },
        ],
      },
    ],
  },
  {
    id: 'manita',
    name: 'Manita',
    category: 'Café & bar',
    vibe: 'wine',
    address: '210 Ossington Ave',
    phone: '(416) 551-2230',
    website: 'https://manita.ca/ossington',
    googleMapsUrl: 'https://maps.google.com/?cid=5084857321141800044',
    booking: { provider: 'resy', url: 'https://resy.com/cities/toronto-on/venues/manita' },
    lat: 43.6489218,
    lng: -79.420792,
    tags: ['All day', 'Oysters'],
    food: ['oysters', 'burgers'],
    deals: 'venue',
    sources: [{ label: 'Manita Ossington menu (PDF)', url: 'https://www.manita.ca/s/OSS-MENUS-2026.pdf', date: '2026-09' }],
    happyHours: [
      {
        days: MON_THU,
        start: t(15),
        end: t(18),
        specials: [
          { kind: 'food', item: 'oysters (min 6)', price: 2.5 },
          { kind: 'drink', item: 'draft beer', price: 7 },
          { kind: 'drink', item: '5 oz Terre dei Penati bianco or rosso', price: 15 },
          { kind: 'food', item: 'Manita burger & fries (reg. $31)', price: 19 },
          { kind: 'food', item: 'veggie burger & fries', price: 19 },
        ],
        note: 'Not on holidays.',
      },
    ],
  },
  {
    id: 'bar-libretto',
    name: 'Bar Libretto',
    category: 'Late-night pizza bar',
    vibe: 'casual',
    address: '221 Ossington Ave',
    phone: '(416) 532-8000',
    website: 'https://www.pizzerialibretto.com/bar-libretto/',
    googleMapsUrl: 'https://maps.google.com/?cid=10052976913284778278',
    booking: { provider: 'google', url: 'https://maps.google.com/?cid=10052976913284778278' },
    lat: 43.6489623,
    lng: -79.42028,
    tags: ['Late night', 'DJs Fri & Sat'],
    food: ['pizza', 'snacks'],
    deals: 'venue',
    sources: [
      { label: 'Pizzeria Libretto menus and specials', url: 'https://www.pizzerialibretto.com/menus/', date: '2026-10' },
      { label: 'Bar Libretto', url: 'https://www.pizzerialibretto.com/bar-libretto/', date: '2026-10' },
    ],
    happyHours: [
      { days: WED_SAT, start: t(16), end: t(18), specials: LIBRETTO_HH },
      {
        days: WED_SAT,
        start: t(21),
        end: t(23),
        specials: LIBRETTO_HH,
        note: 'The venue says 9 PM to “late”; February 2026 press says until 11 PM.',
      },
    ],
    dailySpecials: [
      { days: [2, 3], title: 'Wine Night', specials: [{ kind: 'drink', item: 'Half-price wine bottles' }] },
      {
        days: [0],
        title: 'Family-style Sunday',
        specials: [
          { kind: 'food', item: 'Set-price family-style meal for 4–5' },
          { kind: 'drink', item: 'Half-price wine bottles' },
        ],
      },
    ],
  },
  {
    id: 'haifa-room',
    name: 'The Haifa Room',
    category: 'Israeli',
    vibe: 'restaurant',
    address: '224 Ossington Ave',
    website: 'https://www.thehaifaroom.com/',
    googleMapsUrl: 'https://maps.google.com/?cid=6851155143752327834',
    booking: { provider: 'opentable', url: 'https://www.opentable.ca/r/the-haifa-room-toronto' },
    lat: 43.6492274,
    lng: -79.4209264,
    tags: ['Falafel'],
    food: ['middle-eastern'],
    deals: 'venue',
    sources: [{ label: 'The Haifa Room menus', url: 'https://thehaifaroom.com/', date: '2026-07' }],
    // No time-boxed happy hour: these run whenever the restaurant is open.
    happyHours: [],
    dailySpecials: [
      { days: DAILY, specials: [{ kind: 'drink', item: 'arak', price: 6 }] },
      { days: [2], title: 'Wine Tuesday', specials: [{ kind: 'drink', item: 'Half-price wine bottles' }] },
    ],
  },
  {
    id: 'rhapsody',
    name: 'Rhapsody',
    category: 'Cocktail bar',
    vibe: 'cocktails',
    address: '214 Ossington Ave',
    phone: '(647) 980-0214',
    website: 'https://rhapsodytoronto.com/',
    googleMapsUrl: 'https://maps.google.com/?cid=614493497086280234',
    booking: { provider: 'google', url: 'https://maps.google.com/?cid=614493497086280234' },
    lat: 43.6489864,
    lng: -79.4209134,
    tags: ['Late night', 'No cover'],
    food: ['snacks'],
    deals: 'venue',
    sources: [{ label: 'Rhapsody happy hour menu', url: 'https://rhapsodytoronto.com/happy-hour-menu/', date: '2026-10' }],
    happyHours: [
      {
        days: THU_SUN,
        start: t(20),
        end: t(22),
        specials: RHAPSODY_HH,
        note: 'Times from Rhapsody’s happy hour page; the printed “Escape Menu” says 2–6 PM and 9 PM to close.',
      },
      {
        days: THU_SUN,
        start: t(25),
        end: t(26),
        specials: RHAPSODY_HH,
        note: 'Last-hour happy hour, 1–2 AM after Thursday to Sunday nights.',
      },
    ],
  },
  {
    id: 'la-chingada',
    name: 'La Chingada',
    category: 'Mexican',
    vibe: 'casual',
    address: '1242 Dundas St W',
    phone: '(416) 535-2242',
    website: 'https://www.lachingada.ca/',
    googleMapsUrl: 'https://maps.google.com/?cid=13251443665729089551',
    booking: { provider: 'google', url: 'https://maps.google.com/?cid=13251443665729089551' },
    lat: 43.6496241,
    lng: -79.4240902,
    tags: ['Margaritas', 'Dundas West', 'Back patio'],
    food: ['tacos'],
    deals: 'venue',
    sources: [{ label: 'La Chingada website', url: 'https://www.lachingada.ca/', date: '2026-10' }],
    happyHours: [
      { days: [0, 1, 2, 4, 5, 6], start: t(16), end: t(19), specials: LA_CHINGADA_HH, note: 'Dine-in only.' },
      { days: [3], start: t(16), end: t(22), specials: LA_CHINGADA_HH, note: 'Happy hour all day on Wednesdays. Dine-in only.' },
    ],
    dailySpecials: [
      { days: [1], title: 'Margarita Monday', specials: [{ kind: 'drink', item: 'margaritas', price: 10 }] },
      { days: [2], title: 'Taco Tuesday', specials: [{ kind: 'food', item: 'any 3 tacos', price: 20 }] },
      { days: [4], title: 'AYCE Thursday', specials: [{ kind: 'food', item: 'all-you-can-eat tacos (1 hour)', price: 29.95 }] },
      { days: [5], specials: [{ kind: 'drink', item: 'bar rail', price: 6 }] },
    ],
  },
  {
    id: 'gloria',
    name: 'Gloria',
    category: 'French-American & cocktails',
    vibe: 'cocktails',
    address: '1087 Queen St W',
    phone: '(416) 538-9090',
    website: 'https://www.gloriagreathall.com/',
    googleMapsUrl: 'https://maps.google.com/?cid=10284544454032052425',
    booking: { provider: 'google', url: 'https://maps.google.com/?cid=10284544454032052425' },
    lat: 43.6432589,
    lng: -79.4220707,
    tags: ['Martinis', 'Queen West'],
    food: ['french'],
    deals: 'venue',
    sources: [
      { label: 'Gloria in the Great Hall', url: 'https://www.gloriagreathall.com/', date: '2026-10' },
      GOODNIGHTMERE,
    ],
    happyHours: [
      {
        days: DAILY,
        start: t(17),
        end: t(19),
        specials: [{ kind: 'drink', item: 'martinis', price: 10 }],
        note: 'Gloria’s site says “Martini Happy Hour 5–7pm daily”; the $10 price comes from a local guide.',
      },
    ],
  },
  {
    id: 'poetry-jazz-cafe',
    name: 'Poetry Jazz Cafe',
    category: 'Jazz bar',
    vibe: 'bar',
    address: '1078 Queen St W',
    phone: '(416) 533-6695',
    website: 'http://www.poetryjazzcafe.com/',
    googleMapsUrl: 'https://maps.google.com/?cid=14954038098669927514',
    lat: 43.6437563,
    lng: -79.4217503,
    tags: ['Live jazz', 'Back patio'],
    food: ['snacks'],
    deals: 'venue',
    sources: [{ label: 'Poetry Jazz Cafe drink menu', url: 'https://www.poetryjazzcafe.com/drinkmenu', date: '2026-10' }],
    happyHours: [
      {
        days: [2, 3, 4, 5, 6],
        start: t(18),
        end: t(21),
        specials: [
          { kind: 'drink', item: 'Aperitivo specials: spritzes, mimosas, rum punch, craft beer' },
          { kind: 'food', item: 'Free bites' },
        ],
        note: 'Its fall 2026 “evening chill”. No prices or days are listed; days follow its opening hours.',
      },
    ],
  },
  {
    id: 'bar-piquette',
    name: 'Bar Piquette',
    category: 'Wine bar',
    vibe: 'wine',
    address: '1084 Queen St W',
    phone: '(416) 533-7745',
    website: 'http://www.barpiquette.com/',
    googleMapsUrl: 'https://maps.google.com/?cid=13251591339953424979',
    booking: { provider: 'opentable', url: 'https://www.opentable.ca/r/bar-piquette-toronto' },
    lat: 43.6436898,
    lng: -79.421971,
    tags: ['Natural wine', 'Queen West'],
    food: ['snacks', 'french'],
    deals: 'venue',
    sources: [{ label: 'Bar Piquette weekly rituals', url: 'https://www.barpiquette.com/weekly-rituals', date: '2026-10' }],
    happyHours: [
      {
        days: SUN_FRI,
        start: t(17),
        end: t(19),
        specials: [
          { kind: 'drink', item: 'Selected wines by the glass (prices not published)' },
          { kind: 'food', item: 'A few snacks at special prices' },
        ],
        note: 'Its “Cinq à Sept”.',
      },
    ],
    dailySpecials: [
      { days: [1], title: 'Half-Price Mondays', specials: [{ kind: 'drink', item: 'Half-price wine bottles (whole list)' }], note: 'Dine-in only.' },
    ],
  },
  {
    id: 'aleria',
    name: 'Aleria',
    category: 'Mediterranean',
    vibe: 'restaurant',
    address: '1070 Queen St W',
    phone: '(416) 519-1109',
    website: 'http://aleria.ca/',
    googleMapsUrl: 'https://maps.google.com/?cid=77191377239697648',
    booking: { provider: 'opentable', url: 'https://www.opentable.ca/r/aleria-toronto' },
    lat: 43.64383,
    lng: -79.42147,
    tags: ['Queen West'],
    food: ['middle-eastern'],
    deals: 'venue',
    sources: [{ label: 'Aleria on OpenTable', url: 'https://www.opentable.ca/r/aleria-toronto', date: '2026-10' }],
    happyHours: [
      {
        days: MON_THU,
        start: t(17),
        end: t(19),
        specials: [
          { kind: 'drink', item: 'bar rail', price: 7 },
          { kind: 'food', item: 'Select bites (prices not published)' },
        ],
      },
      {
        days: [4, 5, 6],
        start: t(22),
        end: t(26),
        specials: [
          { kind: 'drink', item: 'bar rail', price: 7 },
          { kind: 'food', item: 'Select bites (prices not published)' },
        ],
        note: 'Aleria says 10 PM “until late”; OpenTable lists it to 2 AM on Friday and Saturday.',
      },
    ],
  },
  {
    id: 'roxton-public-house',
    name: 'Roxton Public House',
    category: 'Pub',
    vibe: 'bar',
    address: '1112 Dundas St W',
    phone: '(647) 449-4211',
    website: 'http://roxtonpub.com/',
    googleMapsUrl: 'https://maps.google.com/?cid=16419636220831962128',
    booking: { provider: 'opentable', url: 'https://www.opentable.ca/r/roxton-toronto' },
    lat: 43.6496857,
    lng: -79.4201234,
    tags: ['Sports on TV', 'Trivia Wednesdays'],
    food: ['pub', 'burgers', 'wings'],
    deals: 'venue',
    sources: [{ label: 'Roxton offers on OpenTable', url: 'https://www.opentable.ca/r/roxton-toronto', date: '2026-10' }],
    happyHours: [],
    dailySpecials: [
      {
        days: [1],
        title: 'Monday Night Football',
        start: t(14),
        end: t(22),
        specials: [
          { kind: 'food', item: 'wings (per lb)', price: 14 },
          { kind: 'drink', item: 'Budweiser or Michelob Ultra pitchers', price: 20 },
          { kind: 'drink', item: 'rail shots', price: 5 },
        ],
      },
      {
        days: [2],
        start: t(14),
        end: t(22),
        specials: [
          { kind: 'food', item: 'cheeseburger', price: 12 },
          { kind: 'drink', item: 'Budweiser pints', price: 8 },
          { kind: 'drink', item: 'signature cocktails', price: 13 },
        ],
      },
      {
        days: [3],
        title: 'Trivia Wednesday',
        start: t(14),
        end: t(22),
        specials: [
          { kind: 'food', item: 'fish & chips', price: 15 },
          { kind: 'drink', item: 'Burdock Ducks IPA', price: 8 },
          { kind: 'drink', item: 'Jameson shots', price: 6 },
        ],
        note: 'Trivia starts at 6:45 PM ($5 a person).',
      },
      { days: [4], start: t(14), end: t(22), specials: [{ kind: 'drink', item: 'Half-price wine, by the glass or bottle' }] },
    ],
  },
  {
    id: 'dont-tell',
    name: "Don't Tell",
    category: 'Asian fusion',
    vibe: 'restaurant',
    address: '59 Ossington Ave',
    phone: '(416) 537-5555',
    website: 'https://www.donttell.ca/',
    googleMapsUrl: 'https://maps.google.com/?cid=8329627480424271372',
    booking: { provider: 'opentable', url: 'https://www.opentable.ca/r/dont-tell-toronto' },
    lat: 43.645549,
    lng: -79.41919,
    tags: ['Hidden'],
    food: ['asian'],
    deals: 'venue',
    sources: [{ label: 'Don’t Tell on OpenTable', url: 'https://www.opentable.ca/r/dont-tell-toronto', date: '2026-10' }],
    happyHours: [],
    dailySpecials: [
      { days: [2], title: 'Grill Tuesdays', specials: [{ kind: 'food', item: 'Off-menu grill special, new each week' }] },
      { days: [3], title: 'Caviar Night', specials: [{ kind: 'food', item: 'caviar flight (3 bites)', price: 35 }] },
      { days: [4], specials: [{ kind: 'food', item: 'six-course dinner (per person)', price: 45 }] },
    ],
  },
  {
    id: 'linnys',
    name: "Linny's",
    category: 'Steakhouse',
    vibe: 'restaurant',
    address: '176 Ossington Ave',
    phone: '(647) 390-1836',
    website: 'https://linnysrestaurant.com/',
    googleMapsUrl: 'https://maps.google.com/?cid=13035978374073890683',
    booking: { provider: 'opentable', url: 'https://www.opentable.ca/r/new-big-hug-hospitality-location-toronto' },
    lat: 43.6480864,
    lng: -79.4205616,
    tags: [],
    food: ['steak'],
    deals: 'venue',
    sources: [{ label: 'Linny’s on OpenTable', url: 'https://www.opentable.ca/r/new-big-hug-hospitality-location-toronto', date: '2026-10' }],
    happyHours: [],
    dailySpecials: [
      { days: [0], title: 'Prime Rib Sundays', specials: [{ kind: 'food', item: 'Smoked prime rib (pre-order)' }], note: 'Pre-order when you book.' },
    ],
  },
  {
    id: 'painted-lady',
    name: 'The Painted Lady',
    category: 'Saloon & live music',
    vibe: 'bar',
    address: '218 Ossington Ave',
    website: 'https://www.thepaintedlady.ca/',
    googleMapsUrl: 'https://maps.google.com/?cid=16835034152475006481',
    lat: 43.6490944,
    lng: -79.4208389,
    tags: ['Live music', 'Late night'],
    food: ['snacks'],
    deals: 'venue',
    sources: [
      { label: 'The Painted Lady events', url: 'https://www.thepaintedlady.ca/shows-1/happy-hour-winesday-5jnc5', date: '2026-10' },
      { label: 'The Painted Lady menu', url: 'https://www.thepaintedlady.ca/menu', date: '2026-10' },
    ],
    happyHours: [
      {
        days: [3],
        start: t(18),
        end: t(21),
        specials: [{ kind: 'drink', item: 'glasses of wine', price: 5 }],
        note: 'Its Wednesday “Happy Hour Winesday”, with live jazz.',
      },
    ],
    dailySpecials: [
      {
        days: [6],
        title: 'Saturday Special',
        start: t(15),
        end: t(20),
        specials: [
          { kind: 'food', item: 'super-loaded nachos & a margarita', price: 28 },
          { kind: 'food', item: 'double nachos & 2 margaritas', price: 48 },
        ],
      },
    ],
  },

  // ---------- Reported: third-party guides or undated posts, unconfirmed ----------
  {
    id: 'sweaty-bettys',
    name: "Sweaty Betty's",
    category: 'Dive bar',
    vibe: 'bar',
    address: '13 Ossington Ave',
    phone: '(416) 535-6861',
    website: 'http://www.sweatybettysbar.com/',
    googleMapsUrl: 'https://maps.google.com/?cid=936711175619440522',
    lat: 43.6445976,
    lng: -79.4187776,
    tags: ['Patio', 'LGBTQ+'],
    deals: 'reported',
    sources: [
      {
        label: 'Yellow Pages patio guide',
        url: 'https://www.yellowpages.ca/pl/the-top-patios-in-toronto-west-end-edition-P3866',
        date: 'undated',
      },
    ],
    happyHours: [
      {
        days: MON_FRI,
        start: t(17),
        end: t(19),
        specials: [
          { kind: 'drink', item: '$1 off highballs' },
          { kind: 'drink', item: '$1 off pints' },
        ],
        note: 'From an undated article; may be out of date.',
      },
    ],
  },
  {
    id: 'bar-koukla',
    name: 'Bar Koukla',
    category: 'Greek',
    vibe: 'wine',
    address: '88 Ossington Ave',
    phone: '(416) 901-7899',
    googleMapsUrl: 'https://maps.google.com/?cid=9056907650003705940',
    booking: { provider: 'google', url: 'https://maps.google.com/?cid=9056907650003705940' },
    lat: 43.6461018,
    lng: -79.4197435,
    tags: ['Greek wine', 'Mezze'],
    food: ['greek'],
    deals: 'reported',
    sources: [GOODNIGHTMERE],
    happyHours: [
      { days: DAILY, start: t(17, 30), end: t(19, 30), specials: [{ kind: 'drink', item: 'Half-price Greek wine bottles' }] },
      {
        days: DAILY,
        start: t(21),
        end: t(24),
        specials: [{ kind: 'drink', item: 'classic martinis', price: 10 }],
        note: 'The guide says “after 9 pm”, with no end time.',
      },
    ],
  },
  {
    id: 'fallen-feather',
    name: 'Fallen Feather',
    category: 'Japanese',
    vibe: 'restaurant',
    address: '217 Ossington Ave',
    phone: '(647) 971-7258',
    website: 'https://www.instagram.com/fallenfeather217',
    googleMapsUrl: 'https://maps.google.com/?cid=16585677419797212078',
    booking: { provider: 'opentable', url: 'https://www.opentable.ca/r/fallen-feather-toronto' },
    lat: 43.6488321,
    lng: -79.4204173,
    tags: ['Oysters'],
    food: ['sushi', 'oysters', 'steak'],
    deals: 'reported',
    sources: [
      { label: 'blogTO buck-a-shuck guide', url: 'https://www.blogto.com/eat_drink/2025/11/buck-shuck-oyster-deals-toronto-day-week/', date: '2025-11' },
    ],
    happyHours: [],
    dailySpecials: [
      {
        days: [2, 3],
        title: 'Buck-a-shuck',
        specials: [
          { kind: 'food', item: 'oysters', price: 1 },
          { kind: 'drink', item: 'drinks', price: 10 },
        ],
      },
      { days: [0], specials: [{ kind: 'food', item: 'steak frites', price: 20 }] },
    ],
  },
  {
    id: 'bar-roma',
    name: 'Bar Roma',
    category: 'Cocktail bar',
    vibe: 'cocktails',
    address: '229 Ossington Ave',
    phone: '(416) 534-8828',
    website: 'https://barromatoronto.ca/',
    googleMapsUrl: 'https://maps.google.com/?cid=4422500418841019941',
    booking: { provider: 'opentable', url: 'https://www.opentable.ca/r/bar-roma-toronto' },
    lat: 43.6490985,
    lng: -79.4204244,
    tags: ['Cocktails'],
    food: ['pasta', 'snacks'],
    deals: 'reported',
    sources: [FRINGINTO],
    happyHours: [
      {
        days: TUE_FRI,
        start: t(17),
        end: t(19),
        specials: [{ kind: 'drink', item: 'Select cocktails & food (prices not published)' }],
        note: 'OpenTable lists a 6 PM opening on some nights, which conflicts with a 5 PM start.',
      },
    ],
  },
  {
    id: 'bar-poet',
    name: 'Bar Poet',
    category: 'Pizza & beer bar',
    vibe: 'casual',
    address: '1090 Queen St W',
    website: 'http://barpoet.com/',
    googleMapsUrl: 'https://maps.google.com/?cid=14942191862241121226',
    booking: { provider: 'google', url: 'https://maps.google.com/?cid=14942191862241121226' },
    lat: 43.6437297,
    lng: -79.4223001,
    tags: ['Queen West', 'Pizza'],
    food: ['pizza'],
    deals: 'reported',
    sources: [
      { label: 'UltimateHappyHours', url: 'https://ultimatehappyhours.com/location/toronto-on/', date: '2026-10' },
      FRINGINTO,
    ],
    happyHours: [
      {
        days: MON_FRI,
        start: t(12),
        end: t(17),
        specials: [
          { kind: 'drink', item: 'Poet Lager', price: 6 },
          { kind: 'drink', item: 'shots', price: 6 },
          { kind: 'drink', item: 'Poet IPA', price: 7 },
          { kind: 'drink', item: '$1/oz wine on tap' },
          { kind: 'food', item: 'pizza + salad combo', price: 28 },
        ],
      },
    ],
  },
  {
    id: 'grape-witches',
    name: 'Grape Witches',
    category: 'Natural wine bar',
    vibe: 'wine',
    address: '1247 Dundas St W',
    phone: '(416) 546-2151',
    website: 'http://grapewitches.com/',
    googleMapsUrl: 'https://maps.google.com/?cid=10638620424622993950',
    lat: 43.649278,
    lng: -79.4237253,
    tags: ['Natural wine', 'Dundas West'],
    food: ['snacks'],
    deals: 'reported',
    sources: [{ label: 'Tastet happy hour list', url: 'https://tastet.ca/en/lists/our-favourite-happy-hours-in-toronto/', date: '2026-10' }],
    happyHours: [
      {
        days: MON_FRI,
        start: t(15),
        end: t(18),
        specials: [
          { kind: 'drink', item: 'beer & cider', price: 6 },
          { kind: 'drink', item: 'wine by the glass', price: 12 },
          { kind: 'food', item: '20% off snacks' },
        ],
      },
    ],
  },
  {
    id: 'wasted-youth',
    name: 'Wasted Youth Bar',
    category: 'Dive bar',
    vibe: 'bar',
    address: '1185 Dundas St W',
    phone: '(647) 380-8555',
    googleMapsUrl: 'https://maps.google.com/?cid=11939268674350405691',
    lat: 43.6491699,
    lng: -79.4220471,
    tags: ['Dundas West', 'Late night'],
    deals: 'reported',
    sources: [{ label: 'Corner listing', url: 'https://www.corner.inc/place/pzxpD8ciPwsV', date: '2026-09' }],
    happyHours: [],
    // "$4 Jameson shots all day, every day".
    dailySpecials: [{ days: DAILY, specials: [{ kind: 'drink', item: 'Jameson shots', price: 4 }] }],
  },
]

/** When the deals above were last checked against their sources. */
const CHECKED = '2026-10-26'

/** Every restaurant and bar in the area: researched deals first, then the rest, with hours, amenities and menus added. */
export const VENUES: Venue[] = [...WITH_DEALS, ...DIRECTORY].map((venue) => ({
  ...venue,
  ...PLACE_DETAILS[venue.id],
  ...(venue.deals !== 'none' && { checked: venue.checked ?? CHECKED }),
}))
