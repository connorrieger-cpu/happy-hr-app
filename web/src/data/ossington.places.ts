import type { Amenity, OpenSpan, Weekday } from '../lib/types'

// Opening hours, amenities, Google place ids and menu links for every venue,
// keyed by venue id. Hours and most amenities come from Google Places
// (October 2026); live music, sports and patios add what the deal research
// found. Generated: edit by hand only to correct something.
//
// Hours are [day, open, close]: day 0 = Sunday, minutes after midnight, and a
// close past 1440 runs into the next day (1560 = 2 AM).

export interface PlaceDetails {
  placeId: string
  hours?: OpenSpan[]
  amenities?: Amenity[]
  menuUrl?: string
}

const h = (spans: [number, number, number][]): OpenSpan[] =>
  spans.map(([day, open, close]) => ({ day: day as Weekday, open, close }))

export const PLACE_DETAILS: Record<string, PlaceDetails> = {
  '222-bar': { placeId: 'ChIJ1VpQ0OE1K4gR8GisHObFuB0', hours: h([[0,1020,1560],[1,1020,1560],[2,1020,1560],[3,1020,1560],[4,1020,1560],[5,1020,1560],[6,1020,1560]]), amenities: ['patio', 'groups'], menuUrl: 'https://www.the222bar.com/menu' },
  'aleria': { placeId: 'ChIJ66nGjXI1K4gR8GgYDCY9EgE', hours: h([[0,1020,1440],[1,1020,1440],[2,1020,1440],[3,1020,1440],[4,1020,1440],[5,1020,1560],[6,1020,1560]]), amenities: ['patio', 'groups'], menuUrl: 'https://www.aleria.ca/menu' },
  'and-ore': { placeId: 'ChIJMXCbgWo1K4gR3mUQ5toU9lo', hours: h([[2,1020,1440],[3,1020,1440],[4,1020,1440],[5,1020,1440],[6,1020,1440]]), amenities: ['groups'], menuUrl: 'https://andorerestaurant.com/above-ground-menu' },
  'apt-200': { placeId: 'ChIJWdfSDf40K4gRv5k9rYxW-BY', hours: h([[0,1320,1560],[1,1260,1560],[4,1320,1560],[5,1320,1560],[6,1320,1560]]), amenities: ['live-music', 'groups'] },
  'azhar': { placeId: 'ChIJV90RSKA1K4gRcPb8RsdYG24', hours: h([[0,720,1320],[1,1020,1320],[2,1020,1320],[3,1020,1320],[4,1020,1320],[5,1020,1350],[6,720,1350]]), amenities: ['patio', 'groups'], menuUrl: 'https://azhartoronto.com/menus-azhar-soulful-mediterranean' },
  'badlands': { placeId: 'ChIJFWKOXAA1K4gRe8vVNH26WGc', hours: h([[0,840,1260],[3,1020,1560],[4,1020,1560],[5,1020,1560],[6,840,1560]]), amenities: ['groups'] },
  'bambis': { placeId: 'ChIJz9O3gkA1K4gRjRHFEhD-2Tk', hours: h([[4,1260,1590],[5,1260,1590],[6,1260,1590]]), amenities: ['live-music', 'groups'] },
  'bar-banane': { placeId: 'ChIJa4hAy1A1K4gRy9SZXULPkdc', hours: h([[3,1080,1440],[4,1080,1440],[5,1080,1560],[6,1080,1560]]), amenities: ['groups'] },
  'bar-bowie': { placeId: 'ChIJ315Nc581K4gRLuORDzbn3iY', hours: h([[0,1080,1560],[1,1080,1560],[2,1080,1560],[3,1080,1560],[4,1080,1560],[5,1080,1560],[6,1080,1560]]), amenities: ['groups'] },
  'bar-koukla': { placeId: 'ChIJHYSdxpw1K4gRVCD9qYWZsH0', amenities: ['patio', 'groups'] },
  'bar-libretto': { placeId: 'ChIJ0Y5QQ_k0K4gRJsmKWz1Zg4s', hours: h([[0,780,1380],[3,960,1500],[4,960,1500],[5,960,1500],[6,960,1500]]), amenities: ['live-music', 'groups'], menuUrl: 'https://www.pizzerialibretto.com/menus/' },
  'bar-piquette': { placeId: 'ChIJJ6VJAc01K4gRUwqRHh0c57c', hours: h([[0,780,1320],[1,1020,1320],[2,1020,1320],[3,1020,1320],[4,1020,1320],[5,1020,1440],[6,780,1440]]), amenities: ['patio'], menuUrl: 'https://www.barpiquette.com/menu' },
  'bar-poet': { placeId: 'ChIJfbK9F4k1K4gRylOd4lRUXc8', hours: h([[0,720,1560],[1,720,1560],[2,720,1560],[3,720,1560],[4,720,1560],[5,720,1560],[6,720,1560]]), amenities: ['patio', 'groups'], menuUrl: 'https://www.barpoet.com/menu' },
  'bar-roma': { placeId: 'ChIJwzUsunw1K4gRJQYJFLPgXz0', hours: h([[2,1020,1380],[3,1020,1440],[4,1020,1440],[5,1020,1560],[6,1020,1560]]), amenities: ['patio', 'sports', 'groups'] },
  'bar-shozan': { placeId: 'ChIJj3SSHXs1K4gRmVNPpwuiD8I', hours: h([[0,720,900],[0,1050,1320],[3,1050,1320],[4,1050,1320],[5,1050,1410],[6,720,900],[6,1050,1410]]), amenities: ['patio', 'groups'], menuUrl: 'https://www.barshozan.com/menu' },
  'bellwoods-brewery': { placeId: 'ChIJfZ_ToP40K4gRdv1rlP_LNk0', hours: h([[0,720,1380],[1,1020,1440],[2,1020,1440],[3,1020,1440],[4,1020,1440],[5,720,1500],[6,720,1500]]), amenities: ['patio', 'dogs'] },
  'casablanca-lounge': { placeId: 'ChIJZ8TO4kc1K4gRL6bmU2C2gsI', hours: h([[5,1260,1560],[6,1260,1560]]), amenities: ['live-music', 'sports', 'groups'] },
  'ceniza': { placeId: 'ChIJSzVKAzI1K4gRAWCpur_vJ8E', hours: h([[0,1020,1380],[2,1020,1380],[3,1020,1380],[4,1020,1380],[5,1020,1500],[6,1020,1560]]), menuUrl: 'https://ceniza.ca/menu/' },
  'central': { placeId: 'ChIJQSxaStI1K4gRNlIjJdc10-M', hours: h([[0,600,1560],[1,690,1500],[2,690,1500],[3,690,1500],[4,690,1560],[5,690,1560],[6,600,1560]]), amenities: ['patio', 'sports', 'groups'], menuUrl: 'https://centralrestaurants.ca/toronto-ossington/menu' },
  'churchill': { placeId: 'ChIJAxRr5_g0K4gRDhdqb5sFn_Y', hours: h([[0,1020,1560],[1,1020,1560],[2,1020,1560],[3,1020,1560],[4,1020,1560],[5,1020,1560],[6,1020,1560]]), amenities: ['patio', 'groups'] },
  'clandestina': { placeId: 'ChIJzT1jBv00K4gRFW-C-wT4ZmE' },
  'club-paris': { placeId: 'ChIJ4eNPDmM1K4gRa0Vup5JcPxQ', hours: h([[0,720,1320],[2,720,1320],[3,720,1320],[4,720,1380],[5,720,1440],[6,720,1440]]), amenities: ['patio', 'groups'] },
  'co-te-de-boeuf': { placeId: 'ChIJWaKhqP40K4gR-IAHS0mGZvk', hours: h([[0,720,1260],[1,720,1320],[2,720,1320],[3,720,1320],[4,720,1380],[5,720,1380],[6,720,1380]]), amenities: ['patio'] },
  'dont-tell': { placeId: 'ChIJT9oPYpQ1K4gRDE4Fqg_ImHM', hours: h([[2,1020,1380],[3,1020,1380],[4,1020,1380],[5,1020,1500],[6,1020,1500]]), amenities: ['live-music'] },
  'downtown-winery': { placeId: 'ChIJnf542v00K4gR5w8EeJOHRws', hours: h([[0,720,1200],[2,720,1200],[3,720,1200],[4,720,1380],[5,720,1380],[6,720,1380]]), amenities: ['patio', 'live-music', 'groups'], menuUrl: 'https://downtownwineryto.com/flights-menu/' },
  'fallen-feather': { placeId: 'ChIJoxEbiAY1K4gRrus6Fr0pLOY', hours: h([[0,960,1380],[1,960,1380],[2,960,1380],[3,960,1380],[4,960,1380],[5,960,1440],[6,960,1440]]), amenities: ['groups'] },
  'fat-choi': { placeId: 'ChIJASCo-jM1K4gRot-ElT8gbnM', hours: h([[0,1020,1320],[3,1020,1320],[4,1020,1320],[5,1020,1320],[6,1020,1320]]), amenities: ['patio'], menuUrl: 'https://www.fatchoito.com/menu-1' },
  'favorites-thai': { placeId: 'ChIJRfiGK-U1K4gRErX7GfDcirM', hours: h([[2,1080,1320],[3,1080,1320],[4,1080,1350],[5,1080,1350],[6,1080,1350]]), amenities: ['patio', 'groups'], menuUrl: 'https://www.myfavethai.com/menu' },
  'foxley': { placeId: 'ChIJpxKXWvk0K4gRt-SFq15tmTg', hours: h([[1,540,1350],[2,1020,1350],[3,1020,1350],[4,1020,1350],[5,1020,1380],[6,1020,1380]]), amenities: ['patio'], menuUrl: 'https://www.foxleybistro.ca/menu' },
  'frankies-diner': { placeId: 'ChIJ2xFnwP00K4gR_88NWMzyiyY', hours: h([[0,510,990],[1,540,1140],[2,540,1140],[3,540,1140],[4,540,1140],[5,540,1200],[6,510,1200]]), amenities: ['groups'], menuUrl: 'https://www.frankiesdiner.ca/menu' },
  'get-well': { placeId: 'ChIJRQRrr040K4gR1f5HPBH80w8', hours: h([[0,1020,1560],[1,1020,1560],[2,1020,1560],[3,1020,1560],[4,1020,1560],[5,1020,1560],[6,1020,1560]]), amenities: ['patio', 'groups'], menuUrl: 'http://www.getwellbar.com/barmenu' },
  'gia-restaurant': { placeId: 'ChIJV6jKeuU1K4gRGQ-Uw_CHJ2A', hours: h([[0,690,870],[0,900,1230],[1,1020,1320],[2,1020,1320],[3,1020,1320],[4,1020,1320],[5,1020,1320],[6,690,1320]]), amenities: ['patio', 'groups'] },
  'gift-shop': { placeId: 'ChIJNVMDJfw0K4gRHzWd7vWX2zY', hours: h([[2,1170,1560],[3,1170,1560],[4,1170,1560],[5,1170,1560],[6,1170,1560]]) },
  'gloria': { placeId: 'ChIJ-xHp9nk1K4gRyVBL67AKuo4', hours: h([[0,600,1440],[1,1020,1440],[2,1020,1440],[3,1020,1440],[4,1020,1560],[5,1020,1560],[6,600,1560]]), amenities: ['patio', 'groups'], menuUrl: 'https://www.gloriagreathall.com/menu' },
  'golden-turtle': { placeId: 'ChIJ3efFH_w0K4gR-k7OiRLX9X0', hours: h([[0,660,1260],[1,660,1260],[3,660,1260],[4,660,1260],[5,660,1260],[6,660,1260]]), amenities: ['patio', 'live-music', 'groups'] },
  'gracies-pizza': { placeId: 'ChIJNYh0RAA1K4gRH64vSH02a2I', hours: h([[0,1020,1560],[1,1020,1560],[2,1020,1560],[3,1020,1560],[4,1020,1560],[5,1020,1560],[6,1020,1560]]), menuUrl: 'https://graciespizza.bycalibre.ca/menu' },
  'grape-witches': { placeId: 'ChIJ2cM2tV81K4gRHnLeDen4o5M', hours: h([[0,720,1320],[1,720,1320],[2,720,1320],[3,720,1320],[4,720,1380],[5,720,1380],[6,720,1380]]) },
  'haifa-room': { placeId: 'ChIJ_UAE2gs1K4gRmqJy5E0xFF8', hours: h([[0,660,1320],[1,660,1320],[2,660,1320],[3,660,1320],[4,660,1380],[5,660,1560],[6,660,1560]]), amenities: ['live-music'], menuUrl: 'https://www.thehaifaroom.com/menu' },
  'hanmoto': { placeId: 'ChIJ13mH4Pg0K4gRbFV5NP92uHQ', hours: h([[1,1020,1440],[2,1020,1440],[3,1020,1440],[4,1020,1440],[5,1080,1560],[6,1080,1560]]) },
  'i-deal-coffee-and-wine': { placeId: 'ChIJ1XseUvk0K4gRXITxS2nG9GU', hours: h([[0,450,1200],[1,450,1200],[2,450,1200],[3,450,1200],[4,450,1200],[5,450,1380],[6,450,1380]]), amenities: ['patio'] },
  'idk-social': { placeId: 'ChIJIwoL4jg1K4gRcTYBCG-z-ps', hours: h([[0,870,1110],[1,660,1140],[2,660,1140],[3,1200,1440],[4,1200,1560],[5,1260,1560],[6,660,1560]]), amenities: ['live-music', 'sports', 'groups', 'dogs'] },
  'jamils': { placeId: 'ChIJHzNfiIM1K4gRyVRQiUSRqOY', hours: h([[0,1020,1320],[3,1020,1320],[4,1020,1320],[5,1020,1380],[6,1020,1380]]), amenities: ['patio', 'groups'], menuUrl: 'https://www.jamils.ca/menu' },
  'kensei-bar': { placeId: 'ChIJ94OxP7I1K4gRuUhV-cYpELU', hours: h([[0,1080,1500],[2,1080,1500],[3,1080,1500],[4,1080,1500],[5,1080,1560],[6,1080,1560]]), amenities: ['groups'], menuUrl: 'https://www.kenseibar.ca/menu' },
  'la-banane': { placeId: 'ChIJGSARXfk0K4gRt12CwCluU08', hours: h([[0,1050,1320],[3,1050,1320],[4,1050,1320],[5,1050,1380],[6,1050,1380]]), amenities: ['groups'] },
  'la-chingada': { placeId: 'ChIJO9JUdps1K4gRD_DhCM6V5rc', hours: h([[0,720,1260],[1,960,1320],[2,960,1320],[3,960,1320],[4,720,1380],[5,720,1380],[6,720,1380]]), amenities: ['patio', 'groups'] },
  'linnys': { placeId: 'ChIJzTREIyw1K4gRezdZfkMZ6bQ', hours: h([[0,1020,1320],[1,1020,1320],[2,1020,1320],[3,1020,1320],[4,1020,1350],[5,1020,1350],[6,1020,1350]]), amenities: ['groups'], menuUrl: 'https://linnysrestaurant.com/menu/' },
  'mamakas-taverna': { placeId: 'ChIJmVryKPw0K4gRm7YkQoNTBWE', hours: h([[0,690,900],[0,1020,1320],[1,1050,1320],[2,1050,1320],[3,1050,1320],[4,1050,1320],[5,1020,1320],[6,690,900],[6,1020,1320]]), amenities: ['patio', 'groups'] },
  'man-of-kent': { placeId: 'ChIJAQBsRvk0K4gRgrYiVxSHioQ', hours: h([[0,720,1560],[1,720,1560],[2,720,1560],[3,720,1560],[4,720,1560],[5,720,1560],[6,720,1560]]), amenities: ['patio', 'sports', 'groups'], menuUrl: 'https://www.mokossington.com/food-menu' },
  'manita': { placeId: 'ChIJj1oa9Cs1K4gRbIwz-MoKkUY', hours: h([[0,600,1320],[1,600,1320],[2,600,1320],[3,600,1320],[4,600,1320],[5,600,1320],[6,600,1320]]), amenities: ['patio', 'groups'], menuUrl: 'https://www.manita.ca/s/OSS-MENUS-2026.pdf' },
  'mild-afro-lounge': { placeId: 'ChIJ0a5GZPk0K4gRyU1W0ku7OtM', hours: h([[0,840,1380],[4,1020,1440],[5,1020,1440],[6,840,1440]]), amenities: ['patio'], menuUrl: 'https://mildafrolounge.com/mild-afro-food-menu/' },
  'nabe-hana': { placeId: 'ChIJkU_5nKQ1K4gRDY7elCp1I4c', hours: h([[0,720,1320],[3,1020,1320],[4,1020,1320],[5,1020,1320],[6,720,1320]]), menuUrl: 'https://www.nabehana.ca/menu' },
  'nazare-snack-bar': { placeId: 'ChIJDb2javk0K4gRk8_z5boB5K8', hours: h([[0,1020,1560],[1,1020,1560],[2,1020,1560],[3,1020,1560],[4,1020,1560],[5,1020,1560],[6,1020,1560]]), amenities: ['live-music', 'groups'] },
  'neon-tiger': { placeId: 'ChIJt5j3nv40K4gRBugUugWM1RM', hours: h([[0,900,1500],[4,960,1440],[5,960,1440],[6,900,1500]]), amenities: ['sports', 'groups'], menuUrl: 'https://www.neontiger.ca/menu' },
  'no-vacancy': { placeId: 'ChIJBaDLG0w1K4gR1H7x6wL4Rmk', hours: h([[0,1080,1500],[2,1080,1500],[3,1080,1500],[4,1080,1560],[5,1080,1560],[6,1080,1560]]), amenities: ['groups'], menuUrl: 'https://www.novacancybar.ca/menu' },
  'oddseoul': { placeId: 'ChIJ8SrvJ_w0K4gRZsS34uL48Fk', hours: h([[0,1080,1500],[1,1080,1500],[3,1080,1500],[4,1080,1500],[5,1020,1560],[6,1020,1560]]), amenities: ['patio', 'groups'] },
  'painted-lady': { placeId: 'ChIJm6h4Tvk0K4gREZbXp10Oouk', hours: h([[0,840,1560],[1,1080,1560],[2,1080,1560],[3,1080,1560],[4,1080,1560],[5,1080,1560],[6,840,1560]]), amenities: ['patio', 'live-music', 'groups'], menuUrl: 'https://www.thepaintedlady.ca/menu' },
  'papi-and-rosita': { placeId: 'ChIJUV0__Zo1K4gRTrLXUGtgw4s', hours: h([[0,1020,1440],[1,1020,1440],[2,1020,1440],[3,1020,1440],[4,1020,1560],[5,1020,1560],[6,1020,1560]]), amenities: ['groups'], menuUrl: 'https://www.papiandrosita.com/menu' },
  'papi-chulos': { placeId: 'ChIJZVNGdgQ1K4gRO2g8IbkjLp8', hours: h([[0,720,1440],[1,720,1440],[2,720,1440],[3,720,1440],[4,720,1440],[5,720,1560],[6,720,1560]]), amenities: ['patio', 'groups'] },
  'paris-paris': { placeId: 'ChIJoUMDPvk0K4gRJXjgz7RaYH0', hours: h([[0,660,1380],[1,1020,1380],[2,1020,1380],[3,720,1380],[4,720,1440],[5,720,1560],[6,660,1560]]), amenities: ['patio', 'groups'], menuUrl: 'https://www.parisparis.ca/menu' },
  'pho-tien-thanh': { placeId: 'ChIJoQ5K0_00K4gRwB-hrQmxqrY', hours: h([[0,660,1320],[1,660,1320],[2,660,1320],[3,660,1320],[4,660,1320],[5,660,1320],[6,660,1320]]), amenities: ['patio', 'groups'], menuUrl: 'https://photienthanh.com/menu/' },
  'pies-by-squires': { placeId: 'ChIJ917k64c1K4gR15SgPbmvyZQ', hours: h([[0,720,1380],[1,840,1380],[2,840,1380],[3,840,1380],[4,840,1380],[5,840,1380],[6,720,1380]]), amenities: ['live-music', 'sports'], menuUrl: 'https://piesbysquires.com/menu' },
  'poetry-jazz-cafe': { placeId: 'ChIJ-z5EAcI0K4gRWvzgvGtqh88', hours: h([[2,1050,1560],[3,1020,1560],[4,1050,1560],[5,1050,1560],[6,1050,1560]]), amenities: ['patio', 'live-music'], menuUrl: 'https://www.poetryjazzcafe.com/drinkmenu' },
  'prequel-and-co-apothecary': { placeId: 'ChIJh_CLcTI1K4gRYGzUbWLYsm0', hours: h([[0,1080,1500],[1,1080,1500],[2,1080,1500],[3,1080,1500],[4,1020,1560],[5,960,1560],[6,960,1560]]), amenities: ['groups'] },
  'prime-seafood-palace': { placeId: 'ChIJ2bF-jSk1K4gRPH-V1br2Qk8', hours: h([[0,1020,1320],[1,1050,1320],[2,1050,1320],[3,1050,1320],[4,1050,1320],[5,1050,1350],[6,1020,1350]]), amenities: ['patio', 'groups'], menuUrl: 'https://www.primeseafoodpalace.ca/menu' },
  'reposado': { placeId: 'ChIJMbYipv40K4gR9AED85vYDHo', hours: h([[0,900,1440],[2,1080,1530],[3,1080,1530],[4,1080,1530],[5,1080,1530],[6,780,1560]]), amenities: ['patio', 'live-music', 'groups'] },
  'rhapsody': { placeId: 'ChIJkwv1QZ41K4gRKoKdcpQehwg', hours: h([[0,1200,1560],[4,1200,1560],[5,1200,1560],[6,1200,1560]]), amenities: ['groups'], menuUrl: 'https://rhapsodytoronto.com/drinks-menu/' },
  'roxton-public-house': { placeId: 'ChIJLfBGbJY1K4gREJTT2yVE3uM', hours: h([[0,720,1560],[1,840,1560],[2,840,1560],[3,840,1560],[4,840,1560],[5,840,1560],[6,720,1560]]), amenities: ['sports', 'groups'], menuUrl: 'https://www.roxtonpub.com/to-eat' },
  'salt-wine-bar': { placeId: 'ChIJ0bmgQ_k0K4gRZSuyGOzN9KE', hours: h([[0,1050,1320],[2,1050,1320],[3,1050,1320],[4,1050,1320],[5,1050,1380],[6,1050,1380]]), amenities: ['patio', 'groups'], menuUrl: 'https://saltrestaurant.ca/menu/' },
  'season-six': { placeId: 'ChIJqbDbPAA1K4gRQ4OxSsAqoJQ', hours: h([[0,720,1260],[1,720,1320],[2,720,1320],[3,720,1320],[4,720,1440],[5,720,1560],[6,720,1560]]), amenities: ['patio', 'groups'], menuUrl: 'https://www.seasonsix.ca/dine-in-menu' },
  'small-talk': { placeId: 'ChIJbxWsn_40K4gRJab3_Arl4c4', hours: h([[0,660,1560],[1,1020,1560],[4,1020,1560],[5,1020,1560],[6,900,1560]]), amenities: ['patio', 'live-music', 'groups'], menuUrl: 'https://www.smalltalkjazz.com/menus' },
  'soos': { placeId: 'ChIJGUKDJ_w0K4gRzdCz-tHQAZ8', hours: h([[0,1020,1260],[3,1020,1290],[4,1020,1290],[5,1020,1320],[6,1020,1320]]), amenities: ['patio', 'groups'] },
  'stefanos-diner': { placeId: 'ChIJU9GW4uk1K4gR1cb05sXvE68', hours: h([[0,600,1230],[1,990,1320],[2,990,1320],[4,990,1320],[5,720,1410],[6,600,1410]]), amenities: ['groups'] },
  'sweaty-bettys': { placeId: 'ChIJOywZw_00K4gRim_v79nd_ww', hours: h([[0,780,1560],[1,900,1560],[2,900,1560],[3,900,1560],[4,900,1560],[5,900,1560],[6,780,1560]]), amenities: ['patio', 'groups', 'dogs'] },
  'taberna-lx': { placeId: 'ChIJU8BFEAY1K4gR-m6T4wlWDi0', hours: h([[0,1020,1320],[3,1020,1320],[4,1020,1380],[5,1020,1440],[6,1020,1440]]), amenities: ['patio', 'live-music', 'sports', 'groups'] },
  'taco-bar': { placeId: 'ChIJxx8w4Xk1K4gRqj3gTHJD-84', amenities: ['groups'] },
  'the-fountain': { placeId: 'ChIJcbouvPg0K4gROI3m0uMLJ_o', hours: h([[0,1140,1560],[1,1140,1560],[2,1140,1560],[3,1140,1560],[4,1140,1560],[5,1140,1560],[6,1140,1560]]), amenities: ['patio', 'groups'] },
  'the-garrison': { placeId: 'ChIJHyYW3vg0K4gRHdtmcA7tK-I', hours: h([[0,1080,1605],[1,1080,1605],[2,1080,1605],[3,1080,1365],[4,1080,1605],[5,1080,1605],[6,1080,1605]]), amenities: ['live-music'] },
  'the-gemini': { placeId: 'ChIJhxuo8Fc1K4gRIy3Yj7clD6M', hours: h([[0,1020,1320],[1,1020,1320],[4,1020,1320],[5,1020,1320],[6,1020,1320]]) },
  'the-jean-darlene': { placeId: 'ChIJPwCavhk1K4gRmtZEcsQCznM', hours: h([[4,1200,1560],[5,1200,1560],[6,1200,1560]]), amenities: ['live-music', 'groups'] },
  'the-lakeview-diner': { placeId: 'ChIJOWjDZfk0K4gRWXgticNi7OY', hours: h([[0,0,1440],[1,0,1440],[2,0,1440],[3,0,1440],[4,0,1440],[5,0,1440],[6,0,1440]]), amenities: ['groups'], menuUrl: 'http://www.thelakeviewrestaurant.ca/menu-1' },
  'the-lunch-lady': { placeId: 'ChIJY62OJvw0K4gR-j35TDeWJrE', hours: h([[0,660,900],[0,1020,1320],[1,1020,1320],[2,1020,1320],[3,720,900],[3,1020,1320],[4,720,900],[4,1020,1320],[5,720,900],[5,1020,1320],[6,660,900],[6,1020,1320]]), amenities: ['patio', 'groups'], menuUrl: 'https://thelunchlady.com/menu-toronto' },
  'union': { placeId: 'ChIJYXmaWVPL1IkRx5XGgZYWKso', hours: h([[0,600,900],[0,1020,1320],[1,690,1320],[2,690,1320],[3,690,1320],[4,690,1320],[5,690,1320],[6,600,900],[6,1020,1320]]), amenities: ['patio', 'groups'], menuUrl: 'https://union72.ca/menus-2/' },
  'vie-strada': { placeId: 'ChIJu0qUeKw1K4gRnsJwPzHSkhA', hours: h([[0,1020,1320],[3,1020,1320],[4,1020,1380],[5,1020,1440],[6,1020,1440]]), amenities: ['patio', 'live-music', 'groups'] },
  'wasted-youth': { placeId: 'ChIJA2U-y4o0K4gRO9iaNJrNsKU', hours: h([[0,840,1560],[1,1080,1560],[2,1080,1560],[3,1080,1560],[4,1080,1560],[5,840,1560],[6,840,1560]]), amenities: ['patio', 'groups', 'dogs'] },
}
