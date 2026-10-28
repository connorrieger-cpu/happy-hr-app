// Chains, so the research can tag them. They're listed like any other spot (the owner
// decided on October 28, 2026 to drop the no-chains rule); the tag is there in case a
// "local only" filter comes later.
//
// The area sweep (web/scripts/places-sweep.mjs) sets `chain` on any Google place whose name
// starts with one of these, or contains one marked as "anywhere", ignoring case and
// punctuation. Add chains here as research turns them up.

/** Names matched at the start of a place's name ("Kelseys Original Roadhouse"). */
export const CHAINS = [
  'a&w', 'ajisen ramen', 'anejo', 'applebee', 'barburrito', 'bardo', 'baton rouge', 'bb q chicken', 'beertown',
  'bento sushi', 'bier markt', 'blaze pizza', 'booster juice', 'boston pizza', 'bridgette bar', 'browns socialhouse',
  'burger king', 'cactus club', 'canyon creek', 'chipotle', 'chuck e cheese', 'chucks roadhouse', 'cibo wine bar',
  'craft beer market', 'dairy queen', 'dave & busters', 'daves hot chicken', 'dennys', 'dominos', 'earls',
  'east side marios', 'eggsmart', 'elephant & castle', 'fat bastard burrito', 'fionn maccools', 'firehouse subs',
  'five guys', 'freshii', 'gametime social', 'greta', 'gyubee', 'gyu-kaku', 'halibut house', 'hard rock cafe', 'harveys',
  'hello nori', 'hibachi teppanyaki', 'hooters', 'industria', 'jack astors', 'jacksons landing', 'jinya', 'joey',
  'kelseys', 'kfc', 'king taps', 'kinton ramen', 'lavenue', 'local public eatery', 'lone star', 'lot 88', 'lulu bar',
  'mandarin', 'marys brown', 'mcdonalds', 'milestones', 'montanas', 'montfort', 'moxies', 'mr sub', 'mucho burrito',
  'oche', 'oeb breakfast', 'olive garden', 'original joes', 'osmows', 'outback', 'panago', 'p f changs', 'piatto',
  'pickle barrel', 'piper arms', 'pita pit', 'pizza hut', 'pizza nova', 'pizza pizza', 'pizzaville', 'playdium',
  'popeyes', 'pür & simple', 'quesada', 'red lobster', 'reds', 'rodneys oyster house', 'ruths chris', 'scaddabush',
  'shoeless joes', 'smittys', 'social 99', 'spin', 'starbucks', 'state & main', 'st louis bar', 'subway',
  'sunny morning', 'sunset grill', 'swiss chalet', 'symposium', 'taco bell', 'the cheesecake factory', 'the keg',
  'the mule', 'the parlour', 'the rec room', 'the works', 'tim hortons', 'topgolf', 'turtle jacks', 'wendys',
  'wild wing', 'wimpys diner', 'wingstop', 'wingsup',
]

/** Matched anywhere in the name: the Firkin pubs are all "<Something> & Firkin". */
export const CHAINS_ANYWHERE = ['firkin']

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9&]+/g, ' ')
    .trim()

/** The chain a place's name belongs to, if any. */
export function chainOf(name: string): string | undefined {
  const n = norm(name)
  return CHAINS.find((c) => n === norm(c) || n.startsWith(`${norm(c)} `)) ?? CHAINS_ANYWHERE.find((c) => n.includes(c))
}
