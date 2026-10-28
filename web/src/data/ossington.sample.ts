import type { Venue, Weekday } from '../lib/types'

// Demo data: the original beta set. Real Ossington venues with made-up specials,
// used only when "Demo data" is switched on, to show the app at its busiest.
// Two of these venues have since closed (La Cubana, Superpoint).

/** Hours (and optional minutes) → minutes after midnight. 25 = 1 AM the next day. */
const t = (h: number, m = 0) => h * 60 + m

const DAILY: Weekday[] = [0, 1, 2, 3, 4, 5, 6]
const MON_FRI: Weekday[] = [1, 2, 3, 4, 5]
const TUE_FRI: Weekday[] = [2, 3, 4, 5]
const MON_THU: Weekday[] = [1, 2, 3, 4]
const TUE_THU: Weekday[] = [2, 3, 4]
const WED_SAT: Weekday[] = [3, 4, 5, 6]
const THU_SAT: Weekday[] = [4, 5, 6]
const FRI_SAT: Weekday[] = [5, 6]
const SUN_THU: Weekday[] = [0, 1, 2, 3, 4]
const SUN_WED: Weekday[] = [0, 1, 2, 3]
const WEEKEND: Weekday[] = [0, 6]

export const SAMPLE_VENUES: Venue[] = [
  {
    id: 'sweaty-bettys',
    name: "Sweaty Betty's",
    category: 'Dive bar',
    vibe: 'bar',
    address: '13 Ossington Ave',
    lat: 43.6445976,
    lng: -79.4187776,
    tags: ['Patio', 'LGBTQ+', 'Late night'],
    deals: 'sample',
    happyHours: [
      {
        days: MON_FRI,
        start: t(15),
        end: t(19),
        specials: [
          { kind: 'drink', item: 'pints of lager', price: 5 },
          { kind: 'drink', item: 'rail highballs', price: 6 },
        ],
      },
      {
        days: SUN_THU,
        start: t(23),
        end: t(26),
        specials: [
          { kind: 'drink', item: 'shots', price: 5 },
          { kind: 'drink', item: 'tallboys', price: 6 },
        ],
      },
    ],
  },
  {
    id: 'pho-tien-thanh',
    name: 'Pho Tien Thanh',
    category: 'Vietnamese',
    vibe: 'casual',
    address: '57 Ossington Ave',
    lat: 43.6454805,
    lng: -79.4191548,
    tags: ['Cheap eats'],
    deals: 'sample',
    happyHours: [
      {
        days: MON_FRI,
        start: t(15),
        end: t(17, 30),
        specials: [
          { kind: 'food', item: 'small pho', price: 9 },
          { kind: 'food', item: 'spring rolls', price: 5 },
          { kind: 'drink', item: 'Saigon beers', price: 6 },
        ],
      },
    ],
  },
  {
    id: 'dont-tell',
    name: "Don't Tell",
    category: 'French-Asian lounge',
    vibe: 'cocktails',
    address: '59 Ossington Ave',
    lat: 43.64556,
    lng: -79.41914,
    tags: ['New', 'Live music', 'Late night'],
    deals: 'sample',
    happyHours: [
      {
        days: WED_SAT,
        start: t(17),
        end: t(19),
        specials: [
          { kind: 'drink', item: 'classic cocktails', price: 12 },
          { kind: 'food', item: 'foie gras takoyaki', price: 14 },
        ],
      },
      {
        days: THU_SAT,
        start: t(22, 30),
        end: t(24, 30),
        specials: [{ kind: 'drink', item: 'house cocktails', price: 10 }],
      },
    ],
  },
  {
    id: 'union',
    name: 'Union',
    category: 'Bistro',
    vibe: 'restaurant',
    address: '72 Ossington Ave',
    lat: 43.6458348,
    lng: -79.4195977,
    tags: ['Patio', 'Oysters'],
    deals: 'sample',
    happyHours: [
      {
        days: TUE_FRI,
        start: t(16),
        end: t(18),
        specials: [
          { kind: 'food', item: 'oysters', price: 2.5 },
          { kind: 'drink', item: 'house wine', price: 9 },
          { kind: 'drink', item: 'draught', price: 7 },
        ],
      },
    ],
  },
  {
    id: 'mamakas',
    name: 'Mamakas Taverna',
    category: 'Greek taverna',
    vibe: 'restaurant',
    address: '80 Ossington Ave',
    lat: 43.6460022,
    lng: -79.419643,
    tags: ['Patio'],
    deals: 'sample',
    happyHours: [
      {
        days: MON_THU,
        start: t(16, 30),
        end: t(18),
        specials: [
          { kind: 'drink', item: 'Mythos lager', price: 7 },
          { kind: 'drink', item: 'Greek wine', price: 9 },
          { kind: 'food', item: 'spreads & pita', price: 12 },
        ],
      },
    ],
  },
  {
    id: 'bar-koukla',
    name: 'Bar Koukla',
    category: 'Greek snack bar',
    vibe: 'wine',
    address: '88 Ossington Ave',
    lat: 43.646141,
    lng: -79.4196866,
    tags: ['Oysters', 'Raw bar'],
    deals: 'sample',
    happyHours: [
      {
        days: DAILY,
        start: t(16),
        end: t(18),
        specials: [
          { kind: 'food', item: 'oysters', price: 2 },
          { kind: 'drink', item: 'spritzes', price: 10 },
          { kind: 'food', item: 'Half-price meze' },
        ],
      },
      {
        days: FRI_SAT,
        start: t(22),
        end: t(24),
        specials: [{ kind: 'food', item: 'oysters', price: 3 }],
      },
    ],
  },
  {
    id: 'oddseoul',
    name: 'Oddseoul',
    category: 'Korean bar',
    vibe: 'bar',
    address: '90 Ossington Ave',
    lat: 43.6461793,
    lng: -79.4196986,
    tags: ['Late night'],
    deals: 'sample',
    happyHours: [
      {
        days: SUN_THU,
        start: t(17),
        end: t(19),
        specials: [
          { kind: 'drink', item: 'Korean lagers', price: 6 },
          { kind: 'drink', item: 'soju cocktails', price: 9 },
          { kind: 'food', item: 'fried chicken bites', price: 10 },
        ],
      },
      {
        days: SUN_THU,
        start: t(23),
        end: t(25),
        specials: [{ kind: 'drink', item: 'soju shots', price: 5 }],
      },
    ],
  },
  {
    id: 'la-cubana',
    name: 'La Cubana',
    category: 'Cuban',
    vibe: 'restaurant',
    address: '92 Ossington Ave',
    lat: 43.64621,
    lng: -79.41979,
    tags: ['Patio'],
    deals: 'sample',
    happyHours: [
      {
        days: MON_FRI,
        start: t(15),
        end: t(18),
        specials: [
          { kind: 'drink', item: 'mojitos', price: 9 },
          { kind: 'food', item: 'croquetas', price: 6 },
          { kind: 'food', item: 'half Cubanos', price: 10 },
        ],
      },
    ],
  },
  {
    id: 'bar-habana',
    name: 'Bar Habana',
    category: 'Rum speakeasy',
    vibe: 'cocktails',
    address: '92 Ossington Ave (behind La Cubana)',
    lat: 43.64619,
    lng: -79.41992,
    tags: ['Hidden', 'Late night'],
    deals: 'sample',
    happyHours: [
      {
        days: WED_SAT,
        start: t(21, 30),
        end: t(23, 30),
        specials: [
          { kind: 'drink', item: 'daiquiris', price: 10 },
          { kind: 'drink', item: 'rum flights', price: 12 },
        ],
      },
    ],
  },
  {
    id: 'soos',
    name: 'Soos',
    category: 'Malaysian',
    vibe: 'restaurant',
    address: '94 Ossington Ave',
    lat: 43.64626,
    lng: -79.41979,
    tags: ['Vegan options'],
    deals: 'sample',
    happyHours: [
      {
        days: TUE_FRI,
        start: t(17),
        end: t(18, 30),
        specials: [
          { kind: 'drink', item: 'Tiger beers', price: 7 },
          { kind: 'food', item: 'roti canai', price: 8 },
          { kind: 'drink', item: 'cocktails', price: 11 },
        ],
      },
    ],
  },
  {
    id: 'azhar',
    name: 'Azhar Kitchen + Bar',
    category: 'Middle Eastern',
    vibe: 'restaurant',
    address: '96 Ossington Ave',
    lat: 43.6463,
    lng: -79.41981,
    tags: ['Wood-fired'],
    deals: 'sample',
    happyHours: [
      {
        days: MON_FRI,
        start: t(15),
        end: t(18),
        specials: [
          { kind: 'drink', item: 'glasses of wine', price: 8 },
          { kind: 'drink', item: 'cocktails', price: 10 },
          { kind: 'food', item: 'hummus & bread', price: 12 },
        ],
      },
    ],
  },
  {
    id: 'central',
    name: 'Central',
    category: 'Bar & kitchen',
    vibe: 'bar',
    address: '114 Ossington Ave',
    lat: 43.64675,
    lng: -79.41999,
    tags: ['Local craft beer', 'Late night'],
    deals: 'sample',
    happyHours: [
      {
        days: DAILY,
        start: t(14),
        end: t(17),
        specials: [
          { kind: 'drink', item: 'highballs', price: 5 },
          { kind: 'drink', item: 'Shaft on Draft', price: 6 },
          { kind: 'food', item: 'bites', price: 4 },
        ],
      },
      {
        days: SUN_WED,
        start: t(22),
        end: t(25),
        specials: [
          { kind: 'drink', item: 'highballs', price: 5 },
          { kind: 'drink', item: 'local craft pints', price: 6 },
        ],
      },
    ],
  },
  {
    id: 'bellwoods',
    name: 'Bellwoods Brewery',
    category: 'Brewpub',
    vibe: 'brewery',
    address: '124 Ossington Ave',
    lat: 43.6470327,
    lng: -79.4201764,
    tags: ['Patio', 'Closed Mondays'],
    deals: 'sample',
    happyHours: [
      {
        days: TUE_FRI,
        start: t(15),
        end: t(17),
        specials: [
          { kind: 'drink', item: 'house pints', price: 7 },
          { kind: 'drink', item: 'half pints', price: 5 },
          { kind: 'food', item: 'frites', price: 8 },
        ],
      },
      {
        days: WEEKEND,
        start: t(14),
        end: t(16),
        specials: [{ kind: 'drink', item: 'tasting flights', price: 12 }],
      },
    ],
  },
  {
    id: 'golden-turtle',
    name: 'Golden Turtle',
    category: 'Vietnamese',
    vibe: 'casual',
    address: '125 Ossington Ave',
    lat: 43.6468111,
    lng: -79.4196232,
    tags: ['Cheap eats'],
    deals: 'sample',
    happyHours: [
      {
        days: MON_FRI,
        start: t(14),
        end: t(17),
        specials: [
          { kind: 'food', item: 'pho + spring roll combo', price: 13 },
          { kind: 'drink', item: 'bottled beer', price: 6 },
        ],
      },
    ],
  },
  {
    id: 'cote-de-boeuf',
    name: 'Côte de Boeuf',
    category: 'Steakhouse & butcher',
    vibe: 'restaurant',
    address: '130 Ossington Ave',
    lat: 43.647174,
    lng: -79.420054,
    tags: ['Oysters'],
    deals: 'sample',
    happyHours: [
      {
        days: TUE_FRI,
        start: t(16),
        end: t(18),
        specials: [
          { kind: 'food', item: 'oysters', price: 3 },
          { kind: 'drink', item: 'martinis', price: 11 },
          { kind: 'food', item: 'steak frites', price: 19 },
        ],
      },
    ],
  },
  {
    id: 'reposado',
    name: 'Reposado',
    category: 'Tequila bar',
    vibe: 'cocktails',
    address: '136 Ossington Ave',
    lat: 43.6472839,
    lng: -79.4200939,
    tags: ['Patio', 'Late night'],
    deals: 'sample',
    happyHours: [
      {
        days: DAILY,
        start: t(17),
        end: t(19),
        specials: [
          { kind: 'drink', item: 'margaritas', price: 8 },
          { kind: 'food', item: 'tacos', price: 4 },
          { kind: 'drink', item: 'Mexican lagers', price: 7 },
        ],
      },
      {
        days: THU_SAT,
        start: t(23),
        end: t(25),
        specials: [{ kind: 'drink', item: 'mezcal pours', price: 6 }],
      },
    ],
  },
  {
    id: 'favorites',
    name: 'Favorites Thai BBQ',
    category: 'Thai',
    vibe: 'restaurant',
    address: '141 Ossington Ave',
    lat: 43.6474152,
    lng: -79.4198423,
    tags: ['Hidden'],
    deals: 'sample',
    happyHours: [
      {
        days: TUE_FRI,
        start: t(16),
        end: t(18),
        specials: [
          { kind: 'drink', item: 'Singha', price: 7 },
          { kind: 'food', item: 'grilled skewers', price: 8 },
          { kind: 'drink', item: 'Thai iced tea highballs', price: 10 },
        ],
      },
    ],
  },
  {
    id: 'paris-paris',
    name: 'Paris Paris',
    category: 'Wine bar',
    vibe: 'wine',
    address: '146 Ossington Ave',
    lat: 43.6474058,
    lng: -79.4201985,
    tags: ['Natural wine', 'Patio'],
    deals: 'sample',
    happyHours: [
      {
        days: MON_FRI,
        start: t(17),
        end: t(18, 30),
        specials: [
          { kind: 'drink', item: 'vin du moment', price: 10 },
          { kind: 'food', item: 'cheese & charcuterie', price: 14 },
        ],
      },
      {
        days: [0],
        start: t(15),
        end: t(21),
        specials: [{ kind: 'drink', item: 'Half-price bottles' }],
      },
    ],
  },
  {
    id: 'bobbie-sues',
    name: "Bobbie Sue's",
    category: 'Mac & cheese',
    vibe: 'casual',
    address: '162 Ossington Ave',
    lat: 43.6478667,
    lng: -79.4204274,
    tags: ['Takeout', 'Cheap eats'],
    deals: 'sample',
    happyHours: [
      {
        days: MON_FRI,
        start: t(15),
        end: t(17),
        specials: [
          { kind: 'food', item: 'small macs', price: 8 },
          { kind: 'food', item: '$3 off large macs' },
        ],
      },
    ],
  },
  {
    id: 'linnys',
    name: "Linny's",
    category: 'Deli steakhouse',
    vibe: 'restaurant',
    address: '176 Ossington Ave',
    lat: 43.6481976,
    lng: -79.4204996,
    tags: ['Martinis'],
    deals: 'sample',
    happyHours: [
      {
        days: MON_THU,
        start: t(17),
        end: t(18, 30),
        specials: [
          { kind: 'drink', item: 'house martinis', price: 11 },
          { kind: 'food', item: 'pastrami sliders', price: 9 },
        ],
      },
    ],
  },
  {
    id: 'superpoint',
    name: 'Superpoint',
    category: 'Pizza',
    vibe: 'casual',
    address: '184 Ossington Ave',
    lat: 43.6483817,
    lng: -79.4207041,
    tags: ['Slices', 'Late night'],
    deals: 'sample',
    happyHours: [
      {
        days: MON_FRI,
        start: t(15),
        end: t(18),
        specials: [
          { kind: 'food', item: 'slices', price: 4 },
          { kind: 'drink', item: 'tallboys', price: 6 },
        ],
      },
      {
        days: FRI_SAT,
        start: t(23),
        end: t(26),
        specials: [{ kind: 'food', item: 'slices', price: 4 }],
      },
    ],
  },
  {
    id: 'foxley',
    name: 'Foxley',
    category: 'Small plates',
    vibe: 'restaurant',
    address: '207 Ossington Ave',
    lat: 43.6486121,
    lng: -79.4202992,
    tags: ['Patio'],
    deals: 'sample',
    happyHours: [
      {
        days: TUE_THU,
        start: t(17, 30),
        end: t(19),
        specials: [
          { kind: 'drink', item: 'glasses of wine', price: 9 },
          { kind: 'food', item: 'half ceviche', price: 8 },
          { kind: 'drink', item: 'sake', price: 10 },
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
    lat: 43.6489218,
    lng: -79.420792,
    tags: ['All day'],
    deals: 'sample',
    happyHours: [
      {
        days: MON_FRI,
        start: t(15),
        end: t(18),
        specials: [
          { kind: 'drink', item: 'spritzes', price: 8 },
          { kind: 'drink', item: 'wine on tap', price: 7 },
          { kind: 'food', item: 'snack plates', price: 6 },
        ],
      },
    ],
  },
  {
    id: 'bar-libretto',
    name: 'Bar Libretto',
    category: 'Late-night pizza',
    vibe: 'casual',
    address: '221 Ossington Ave',
    lat: 43.6489623,
    lng: -79.42028,
    tags: ['Late night', 'Wed–Sat'],
    deals: 'sample',
    happyHours: [
      {
        days: WED_SAT,
        start: t(22),
        end: t(24),
        specials: [
          { kind: 'food', item: 'margheritas', price: 10 },
          { kind: 'drink', item: 'house red', price: 8 },
          { kind: 'drink', item: 'negronis', price: 12 },
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
    lat: 43.6492274,
    lng: -79.4209264,
    tags: ['Falafel'],
    deals: 'sample',
    happyHours: [
      {
        days: MON_FRI,
        start: t(16),
        end: t(18),
        specials: [
          { kind: 'food', item: 'falafel', price: 5 },
          { kind: 'drink', item: 'Goldstar', price: 7 },
          { kind: 'drink', item: 'arak lemonade', price: 9 },
        ],
      },
    ],
  },
  {
    id: 'salt',
    name: 'Salt Wine Bar',
    category: 'Iberian tapas',
    vibe: 'wine',
    address: '225 Ossington Ave',
    lat: 43.649006,
    lng: -79.4202975,
    tags: ['Patio'],
    deals: 'sample',
    happyHours: [
      {
        days: DAILY,
        start: t(17),
        end: t(18, 30),
        specials: [
          { kind: 'drink', item: 'cava', price: 8 },
          { kind: 'drink', item: 'sangria', price: 9 },
          { kind: 'food', item: 'pintxos trio', price: 12 },
        ],
      },
    ],
  },
  {
    id: 'la-banane',
    name: 'La Banane',
    category: 'French seafood',
    vibe: 'restaurant',
    address: '227 Ossington Ave',
    lat: 43.6490578,
    lng: -79.4203172,
    tags: ['Oysters', 'Cocktail bar upstairs'],
    deals: 'sample',
    happyHours: [
      {
        days: TUE_THU,
        start: t(17),
        end: t(18),
        specials: [
          { kind: 'food', item: 'oysters', price: 3 },
          { kind: 'drink', item: 'champagne', price: 14 },
        ],
      },
      {
        days: THU_SAT,
        start: t(22),
        end: t(24),
        specials: [{ kind: 'drink', item: 'upstairs cocktails', price: 12 }],
      },
    ],
  },
  {
    id: 'mickey-limbos',
    name: 'Mickey Limbos',
    category: 'Bar',
    vibe: 'bar',
    address: '249 Ossington Ave',
    lat: 43.6497275,
    lng: -79.4206992,
    tags: ['New', 'Former Dakota Tavern'],
    deals: 'sample',
    happyHours: [
      {
        days: MON_FRI,
        start: t(16),
        end: t(19),
        specials: [
          { kind: 'drink', item: 'pints', price: 6 },
          { kind: 'drink', item: 'well drinks', price: 5 },
          { kind: 'food', item: 'wings', price: 7 },
        ],
      },
      {
        days: WEEKEND,
        start: t(14),
        end: t(17),
        specials: [{ kind: 'drink', item: 'Caesars', price: 6 }],
      },
    ],
  },
  {
    id: 'communists-daughter',
    name: "Communist's Daughter",
    category: 'Dive bar',
    vibe: 'bar',
    address: '1149 Dundas St W',
    lat: 43.6492386,
    lng: -79.421082,
    tags: ['Live music'],
    deals: 'sample',
    happyHours: [
      {
        days: DAILY,
        start: t(16),
        end: t(19),
        specials: [
          { kind: 'drink', item: 'pints', price: 6 },
          { kind: 'drink', item: 'rye & gingers', price: 5 },
        ],
      },
    ],
  },
]
