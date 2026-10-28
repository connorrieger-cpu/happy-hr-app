# Researching an area's deals

How each area's spots and deals are found, so every area is done the same way. The
Ossington report (`reports/Ossington happy hour specials.md`) is the model.

## 1. The candidates

`node scripts/places-sweep.mjs <area>` (from `web/`) writes `candidates.json` in the area's
folder: every operating restaurant and bar Google Places knows inside the area's region,
nearest to the centre first, with Google's hours, website, phone, alcohol service and
amenities. It already leaves out cafés, bakeries, fast food, takeout and delivery spots, places with no dine-in, and
places Google says don't serve alcohol (`excluded` lists them with reasons), and tags chains.

## 2. The listing rules

- **Only places that serve alcohol.** Google's `serves` flags help; a menu with no drinks
  list, or "BYOB", means no.
- **Chains are fine** (since October 28, 2026): Kelseys, Boston Pizza, Jack Astor's and
  local groups alike. Research their deals like any other spot (chains often publish
  happy hours on their own sites; check the location's page). `candidates.json` tags them
  with `chain`; add new ones to `src/data/chains.ts`.
- **No fast food or takeout:** sit-down places people go out to, eat or drink in person. Not
  fast-food counters, takeout or delivery spots, food courts, saunas, salad shops, caterers
  or ghost kitchens.

## 3. Checking deals

For each spot, in order, until you find its deals or run out of places to look:

1. Its own website: the happy hour page, menus (HTML, PDF or images), specials, events.
2. Its booking page (OpenTable, Resy, Tock): specials listed by the venue.
3. Local guides and news: blogTO, Narcity, Toronto Life, Streets of Toronto, Now
   Toronto, Destination Toronto; GuelphToday, Guelph Mercury, Explore Guelph; Burlington
   Today, InsideHalton, Burlington Post, Tourism Burlington; Yelp lists. Note the date.
4. A web search: `"<name>" <city> happy hour`, and `… daily specials`, `… wing night`.

Instagram and Facebook usually can't be read; say so rather than guessing.

**Happy hours** are time-boxed (Mon–Fri 3–6 PM). **Daily specials** are tied to days of
the week (Taco Tuesday, half-price wine bottles on Wednesdays, wing night); they never take
over the happy-hour timers.

## 4. Grading

- `deals: "venue"`: the venue's own site, menu or booking page, current (2025–2026).
- `deals: "reported"`: a third-party guide, an undated or old post, or a single review. Keep
  it only if it's from 2024 or later and specific (days, times, prices); otherwise leave it
  out and note it in the report.
- Never invent a price, time or day. If a happy hour has times but no prices, keep it with
  `"specials": []` and a note ("Prices not published"). If a venue looks closed (Google says
  so, its site is gone, news says it shut), leave it out and say so.

## 5. Choosing the list

An area lists **50 to 100 spots**: every spot with deals, then the best of the rest (for a
city, favour downtown and well-loved local places: high rating with many reviews, a real
bar or kitchen people go out to). Fewer is fine for a small neighbourhood.

## 6. What to write (in the area's folder)

- `research.md`: the report. A summary first (how many checked, how many have deals, the
  standouts), the method and date, then tables like the Ossington report's: A) deals to
  load, B) weak or undated claims held back, C) checked with no deals, D) left out (chains,
  no alcohol, closed) with reasons. Every claim links its source.
- `deals.json`: the spots with deals, in the app's `Venue` shape (`src/lib/types.ts`):

  ```json
  {
    "placeId": "ChIJ…",                 // from candidates.json, so hours and links come from Google
    "id": "the-woolwich-arrow",          // kebab-case of the name, unique in the area
    "name": "The Woolwich Arrow",
    "category": "Gastropub",            // short, sentence case
    "vibe": "bar",                      // bar | brewery | wine | cocktails | restaurant | casual
    "food": ["pub"],                    // optional; see FoodType in src/lib/types.ts
    "tags": ["Ontario craft beer", "Patio"],   // 0–3 short, true, useful tags
    "happyHours": [
      { "days": [1, 2, 3, 4, 5], "start": 900, "end": 1080,
        "specials": [{ "kind": "drink", "item": "pints", "price": 6 }, { "kind": "food", "item": "half-price wings" }],
        "note": "Bar area only" }
    ],
    "dailySpecials": [
      { "days": [2], "title": "Taco Tuesday", "specials": [{ "kind": "food", "item": "tacos", "price": 3 }] }
    ],
    "deals": "venue",
    "sources": [{ "label": "Woolwich Arrow happy hour page", "url": "https://…", "date": "2026-10" }],
    "checked": "2026-10-28",
    "menuUrl": "https://…"               // optional
  }
  ```

  Days: 0 = Sunday … 6 = Saturday. Times: minutes after midnight, Toronto time (3 PM = 900;
  a window past midnight keeps counting: 1 AM = 1500). Prices are CAD numbers. Items are
  lowercase nouns or short phrases ("pints", "house wine", "$1 off draft" goes in the item
  with no price). `kind` is `drink` or `food`.
- `directory.json`: the other listed spots, best first: `{ "placeId", "id", "name",
  "category", "vibe", "food" }`. The app fills in address, hours, phone, website, map link
  and amenities from `candidates.json`.
- Spots not in `candidates.json` (Google missed them) can go in either file with
  `"address"`, `"lat"`, `"lng"` and `"website"` instead of a `placeId`.
