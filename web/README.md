# Happy HR (web beta)

Happy hours happening **right now**, near you. The beta covers Ossington Ave in Toronto (Queen St W to Dundas St W).

Open it and you get a map of the strip, the deals that are live this minute sorted by walking distance, then what's starting soon and later today. Tap any venue for its specials, weekly schedule and walking directions.

Two quieter extras sit behind that:

- **Search** (the magnifier in the top bar) finds any spot by name, food or deal, with filters for the kind of deal (on now, happy hours, daily specials, drinks, food) and the kind of food (pizza, tacos, oysters…). Typing "burger" also finds places with a burger deal.
- **Daily specials** are deals on certain days of the week, like a Tuesday burger. They never take over the happy-hour timers: a card gets a small "Today · …" pill, the **Daily specials** chip lists them by day, and each venue page has a Daily specials section.
- **Your spots:** star a venue (top right of its page) and it shows in a small strip at the top of the list, with what's on there now. You get a heads-up when one's happy hour is about to start, and **Remind me** adds a weekly calendar alert.
- **On each venue page:** whether it's open now (tap for the week's hours), a photo from Google, its patio, live music or sports, a menu link, and how fresh the deal is ("Checked Oct 26", "✓ Confirmed yesterday", or "May be out of date").
- **Share** a spot, or suggest a time to meet ("Meet at Manita at 5:30?"). Shared links preview with the venue's name and deal.
- **Cheapest:** in search, compare prices for a beer, a glass of wine, a cocktail, a shot, oysters or wings, cheapest first. Vibe chips (Open now, Patio, Live music, Sports, Trivia, Open late, Groups, Dogs) sit with the food chips.
- **Venue owners** can claim their page ("Run this place?" at the bottom of it). Once you approve them on the owner page, they get a link that lets them post deals marked **From the venue**.

## Run it

Node.js 24 is installed through [nvm](https://github.com/nvm-sh/nvm). In a new terminal it's loaded automatically; in an old one, run `source ~/.nvm/nvm.sh` first.

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173.

### On your phone

```bash
npm run dev -- --host
```

Vite prints a `Network:` address such as `http://192.168.1.20:5173`. Open it on a phone that's on the same Wi-Fi. In Safari, use **Share → Add to Home Screen** to get the app icon and full-screen mode.

Over plain `http://` on a phone, browsers won't share your location, so walking times are measured from Ossington & Dundas. Location works on `localhost` and on any HTTPS deployment.

## Google Maps

Without a key, the app uses a free OpenStreetMap-based map (MapLibre + OpenFreeMap), so it works out of the box. To switch to Google Maps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/), create a project and add billing. The Maps free tier covers a beta easily.
2. **APIs & Services → Library**: enable **Maps JavaScript API**.
3. **APIs & Services → Credentials → Create credentials → API key**.
4. Restrict the key: under **Application restrictions** pick **Websites** and add `http://localhost:5173/*` (and your phone's `http://<your-ip>:5173/*` if you test there). Under **API restrictions** pick Maps JavaScript API.
5. Optional: **Google Maps Platform → Map management → Create map ID** (JavaScript, Vector). This lets you restyle the base map in the console.
6. Copy `.env.example` to `.env.local` and paste your values:

   ```
   VITE_GOOGLE_MAPS_API_KEY=your-key
   VITE_GOOGLE_MAPS_MAP_ID=your-map-id
   ```

7. Restart `npm run dev`.

`.env.local` is git-ignored, so keep the key there and nowhere else. If Google rejects the key, the app falls back to the free map rather than breaking, and logs a warning in the browser console.

### This project's Google setup

The Google Cloud project is **Happy Hour**. In it:

- **API key "Happy Hour Maps key":** limited to the Maps JavaScript, Geocoding and Places APIs, and to the websites `http://localhost:5173/*` and `http://192.168.40.6:5173/*`. Add your real domain under **Website restrictions** when the site goes live. If your computer's Wi-Fi address changes, update that entry too.
- **Map ID "Happy HR web":** vector rendering, with rotation turned on.
- **Map styles:** **Happy HR** for light mode and **Happy HR (dark)** for dark mode. Both hide Google's business and place labels so the deal pins stand out.

To restyle the map, edit those two styles under **Google Maps Platform → Map Styles** and click **Publish**; no code changes are needed. Changes can take a few minutes to show up. The app adds its own warm tint on top of the style, in `src/styles/app.css` (`.gm-style canvas`).

## Venue data

The area is Ossington Ave from Queen to Dundas, plus Queen St W and Dundas St W from Dovercourt to Shaw. The app lists every restaurant and bar in it that serves alcohol, leaving out national and out-of-town chains (Toronto-local groups stay). Central is the one exception, kept for its happy hour.

- [`src/data/ossington.ts`](src/data/ossington.ts): venues with a researched happy hour or daily special, each with its sources. `deals` says where the details come from: `'venue'` (the venue's own site, menu or OpenTable listing) or `'reported'` (a third-party guide, unconfirmed).
- [`src/data/ossington.directory.ts`](src/data/ossington.directory.ts): every other restaurant and bar, with no happy hour known yet (`deals: 'none'`). These came from Google Places in October 2026, keeping places Google says serve alcohol (or whose own site shows a drinks list). Anything Google lists as closed is left out. In the app they show as faint dots on the map and under **More spots** in the list, so people can find them and add a happy hour.
- [`src/data/ossington.sample.ts`](src/data/ossington.sample.ts): the sample deals behind the **Demo data** switch.

Every venue can have `food` tags (`'pizza'`, `'tacos'`, `'oysters'`…, listed in [`src/lib/food.ts`](src/lib/food.ts)) for search.

To add a confirmed deal, move the venue from the directory into `ossington.ts`, then fill in its `happyHours` or `dailySpecials`, `deals` and `sources`. A happy hour:

```ts
{
  days: [1, 2, 3, 4, 5],        // 0 = Sunday … 6 = Saturday
  start: t(16),                  // 4 PM
  end: t(18, 30),                // 6:30 PM; use t(25) for 1 AM the next day
  specials: [
    { kind: 'drink', item: 'pints', price: 6 },
    { kind: 'food', item: 'Half-price wings' },  // no price = shown as written
  ],
},
```

A daily special (leave out `start` and `end` when it runs all day):

```ts
dailySpecials: [
  { days: [2], title: 'Taco Tuesday', specials: [{ kind: 'food', item: 'any 3 tacos', price: 20 }] },
  { days: [1], start: t(14), end: t(22), specials: [{ kind: 'food', item: 'wings (per lb)', price: 14 }] },
],
```

The first special listed is the one the app leads with when there's no `title`.

## Hosting and community updates

The beta is hosted on Cloudflare Pages at https://happy-hr-beta.pages.dev. It's not listed in search engines (noindex). `npm run deploy` rebuilds and publishes it.

People can add a happy hour or a daily special from **Community → Add a happy hour or special** in the top-right menu, or **Suggest an update** on any venue. When someone is at a venue during its happy hour, a small pill asks whether the deal worked; the same 👍/👎 sits in each venue's details.

- **Where it's stored:** the site's API lives in `functions/api/` (Cloudflare Pages Functions), backed by a D1 database called `happy-hr-community`. The schema is in `migrations/`. Validation rules are shared with the app in `src/lib/community.ts`.
- **What goes live:** submissions show right away, marked **Community**. They're added next to the researched deals and never replace them.
- **Limits:** 10 submissions and 60 check-ins per day per network, and one check-in per device, venue and day (a second one replaces the first).
- **Owner page:** open the site with `?owner` on the end of the address (for example https://happy-hr-beta.pages.dev/?owner) and enter the owner password, which is the `OWNER_TOKEN` value in `.env.local`. From there you can hide or restore any submission or check-in.

To change the password, edit `OWNER_TOKEN` in `.env.local`, then run this to save it as a Cloudflare secret and redeploy:

```bash
bash scripts/set-owner-secret.sh
```

To test the API locally, run `npx wrangler d1 migrations apply happy-hr-community --local`, then `npm run build` and `npx wrangler pages dev dist --port 5173`. Locally, the owner token comes from `.dev.vars`.

## API for the iOS app

Besides the community endpoints, the site serves the venue data to native apps. The full contract is [`../shared/api/openapi.yaml`](../shared/api/openapi.yaml).

- `GET /api/venues`: every venue with its deals and food tags, the area, and the food types. It's built from `src/data/` (`server/venues.ts`) and versioned by a content hash sent as the ETag. If you change its shape in a way old apps can't read, bump `SCHEMA_VERSION`.
- `GET /api/health`: whether the API is up, the data version, and whether the database answers.
- Device ids are case-insensitive and stored lowercased. Daily limits apply per device and per network (`LIMITS_PER_DAY` in `server/shared.ts`).

`npm run shared` writes golden test cases to `../shared/fixtures/` from this app's logic. The iOS port is tested against them, and `npm test` fails if they go stale.

## Trying different times

Happy hour depends on the time of day, so the clock button (under the location button) lets you preview any day and time, for example "Fri after work" or "Sat late night". A yellow banner shows while you're previewing; tap **Back to now** to return.

Tap the logo to replay the intro animation.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Unit tests for the deal logic, plus a check that `../shared/fixtures` is up to date |
| `npm run shared` | Rewrite the shared fixtures for the iOS port after a logic or data change |
| `npm run lint` | Lint with oxlint |
| `npm run icons` | Regenerate the favicon, web app icons and the iOS app icon from the logo component |

## How it's built

React 19 + TypeScript + Vite, with [Motion](https://motion.dev) for animation.

```
src/
  data/       venues and areas (plain TypeScript, no React)
  lib/        time zones, happy-hour status, distance, ranking, label placement (no React)
  hooks/      clock, location, media queries
  map/        Google Maps and MapLibre views sharing one pin component
  brand/      logo and startup animation
  components/ top bar, deal sheet, cards, venue detail, time preview
  styles/     design tokens, liquid-glass material, layout
```

Notes:

- **Time zone.** Everything runs on Toronto time, whatever the device's time zone.
- **Reuse for iOS.** `data/` and `lib/` have no React or browser code, so the logic can be ported to the iOS app later.
- **Light and dark.** Choose System, Light or Dark under **Appearance** in the menu behind the area chip (top right). System follows the device and defaults to dark; the choice is saved per device.
- **Liquid glass.** Glass panels use `backdrop-filter`. Chromium browsers also get a subtle SVG refraction on small controls.
