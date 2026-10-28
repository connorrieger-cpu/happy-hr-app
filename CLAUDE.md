# Happy HR: notes for Claude

Hyper-local happy hours and daily specials for Toronto neighbourhoods (Ossington, Kensington, King West, Liberty Village) and the cities of Guelph and Burlington (with Oakville west of Third Line). A web app (live beta) and a native iPhone app, sharing one backend and one set of deal logic. This file is the handoff from the Linux machine where the web app and backend were built. The Mac picks up from here, mainly to compile and finish the iOS app.

## Layout

| Path | What |
| --- | --- |
| `web/` | React 19 + TypeScript + Vite 8 web app, and the API (Cloudflare Pages Functions in `web/functions/api/`, helpers in `web/server/`, D1 schema in `web/migrations/`). |
| `web/src/lib/` | **The source of truth for deal logic**: Toronto time and happy-hour status (`time.ts`), ranking and filters (`deals.ts`), daily specials (`daily.ts`), food types (`food.ts`), drink types (`drinks.ts`), search (`search.ts`: forgiving words, concepts like "beer" or "music", browse tiles, cheapest sort), community validation and merging (`community.ts`), accounts (`account.ts`), anonymous usage counts (`usage.ts`), plus the v2 features below (`hours.ts`, `vibes.ts`, `price.ts`, `freshness.ts`, `favourites.ts`, `reminders.ts`, `share.ts`). Pure TS, no React or DOM. |
| `web/src/data/` | **The source of truth for venues and deals**: `ossington.ts` (researched deals, with sources), `ossington.directory.ts` (every other alcohol-serving spot, no deals yet), `ossington.places.ts` (opening hours, amenities, menu links and Google place ids, from Google Places, Oct 2026), `ossington.sample.ts` (demo data). |
| `web/src/data/areas/` | **Every area the apps cover**, one folder each (outline, Google candidates, research, built `venues.json`) and the list in `index.ts`. [`README.md`](web/src/data/areas/README.md) says how to add or remove one; [`RESEARCH.md`](web/src/data/areas/RESEARCH.md) is the research method. Area logic is `web/src/lib/areas.ts` (Swift: `Areas.swift`). |
| `ios/HappyHRCore/` | Swift package: a port of `web/src/lib` plus models, the API client and an offline cache. Tested against `shared/fixtures`. |
| `ios/HappyHR/` | SwiftUI app (iOS 26, Liquid Glass, Apple Maps). Builds clean with Xcode 27 and runs in the simulator; not yet tried on a phone. |
| `ios/PORTING-V2.md` | How to port the v2 web features (hours, favourites, freshness, venue owners, cheapest, photos, sharing, vibes) to iOS. |
| `ios/project.yml` | XcodeGen spec; `cd ios && xcodegen` generates `HappyHR.xcodeproj` (git-ignored). |
| `shared/api/openapi.yaml` | The API contract. |
| `shared/fixtures/` | Golden test cases produced by the web logic (`npm run shared`). `venues.json` is also bundled into the iOS app as its offline fallback. |
| `shared/design/tokens.json` | Colours, radii, type and glass rules for both apps. |
| `reports/`, `research_notes/` | The deal research behind the data. |

## Commands

```bash
# Web (in web/). Vite 8 needs Node 20.19+: this Mac's /usr/local/bin/node is v18, so put
# Homebrew's first: export PATH="/opt/homebrew/bin:$PATH"
npm install
npm run dev            # Vite dev server, http://localhost:5173 (no /api: community features hide)
npm test               # Vitest: logic tests + "shared fixtures are up to date"
npm run shared         # rewrite ../shared/fixtures after a logic or data change
npm run sweep -- <id>  # Google Places candidates for an area (needs GOOGLE_PLACES_SERVER_KEY in .env.local)
npm run areas          # rebuild each area's venues.json from its research (npm test checks it's current)
npm run build          # tsc -b && vite build
npm run lint           # oxlint (8 set-state-in-effect / fast-refresh warnings are known and fine)
npm run icons          # favicon and web icons from the React logo. Careful: it also overwrites the iOS AppIcon with the old logo; the iOS icon now comes from ios/design/icon-concepts (export_icon.py 1d-wink-pint), and the old one is in ios/design/icon-archive/
npx wrangler d1 migrations apply happy-hr-community --local   # once, for the local API
npx wrangler pages dev dist --port 5173                       # web + /api locally (after npm run build)
npm run deploy         # build + deploy to Cloudflare Pages (needs `npx wrangler login` on this machine)

# iOS (in ios/)
./sim.sh                                                       # the fast loop: build, install, relaunch, screenshot to ios/screens/latest.png
SIM_LOCATION=43.5446,-80.2482 ./sim.sh                         # the same, standing somewhere else (here downtown Guelph; default Ossington & Dundas)
./sim.sh shot name                                             # screenshot only, to ios/screens/name.png
./sim.sh device                                                # build, install and launch on the iPhone (cable or same Wi-Fi; paid team, profile lasts a year)
./testflight.sh                                                # archive and upload to App Store Connect (Apple signs it in the cloud; build number bumps itself)
xcodegen                                                       # after adding/removing files
xcodebuild -project HappyHR.xcodeproj -scheme HappyHR \
  -destination 'platform=iOS Simulator,name=iPhone 17' build   # compile check without opening Xcode
cd HappyHRCore && swift test                                   # core tests (offline)
HAPPYHR_API=https://happy-hr-beta.pages.dev swift test         # + live API tests (read-only)
```

If `iPhone 17` isn't an installed simulator, list them with `xcrun simctl list devices available`.

## First job on the Mac

1. Run `bash setup-mac.sh` from the repo root: it installs XcodeGen and Node via Homebrew, runs `npm install`, generates the Xcode project, runs the Swift tests and makes the first git commit.
2. Get `ios/HappyHR` compiling: run the `xcodebuild … build` above and fix errors until it builds clean. Likely spots are the iOS 26 Liquid Glass calls (all in `HappyHR/Design/Glass.swift`, plus `.buttonStyle(.glass/.glassProminent)` and `GlassEffectContainer`), MapKit `Annotation` modifiers, and `CLServiceSession` / `CLLocationUpdate` in `LocationService.swift`. Keep fixes minimal, and keep logic in HappyHRCore.
3. Run it in the simulator and compare with the web app at https://happy-hr-beta.pages.dev.

## Conventions

- **Port, don't fork, the logic.** Change behaviour in `web/src/lib` first, run `npm test` and `npm run shared`, then update the Swift port until `swift test` passes. The fixtures are the contract between the two.
- **Time:** always Toronto time (`America/Toronto`), whatever the device's zone. Weekdays are 0 = Sunday … 6 = Saturday. Times are minutes after midnight; an end past 1440 runs into the next day.
- **Two kinds of deal:** `happyHours` are time-boxed and get the countdown ring. `dailySpecials` are tied to days of the week ("Taco Tuesday") and must never take over the timers: they show as a small "Today · …" pill, a Daily specials filter, and a section on the venue page.
- **Provenance:** `deals` is `'venue'` (the venue's own site, menu or OpenTable listing), `'reported'` (a third-party guide; label it unconfirmed), `'community'`, `'sample'` or `'none'`. Every venue with deals cites `sources`.
- **Listing rules:** only places that serve alcohol; sit-down places people go out to (no fast food, takeout, food courts or ghost kitchens). Chains are fine since October 28, 2026 (`web/src/data/chains.ts` only tags them).
- **Areas:** each area's spots are only shown in that area; both apps open the area from a shared link (`?a=<id>&v=<spot>`), else where the person is (once per visit), else the last one. Spot ids are unique across all areas. Demo data is Ossington's only.
- **Swift naming:** the core's time type is `Clock`, which clashes with Swift's standard `Clock` protocol in app code, so use `TorontoClock` there.
- **Liquid Glass:** glass only on the floating layer (top bar, map buttons, pins, the sheet), never on content, never glass on glass. Cards in the sheet use `cardBackground`. Honey (`#FFD60A`) is the brand colour; text on honey is `#2B1D00`.
- **Copy:** plain, short, friendly sentences; curly apostrophes in UI strings.
- **Name and mark (iOS, Oct 28):** the app is "Happy Hr" (wordmark: "Happy" plus "Hr" in honey) and its mark is the winking smiley with a pint (`ios/design/icon-concepts/1d-wink-pint.svg`; `export_icon.py` makes the app icon, `export_mark.py` the in-app LogoMark). The web app and App Store Connect still say "Happy HR" until we change them.

## v2 features: done on the web, to port to iOS

**Step-by-step porting guide: [`ios/PORTING-V2.md`](ios/PORTING-V2.md)** (models, each module's exact rules and fixture test, API calls, where every feature goes in the SwiftUI app, notifications and links). The summary below is the short version.

All the logic is in `web/src/lib` and has fixtures in `shared/fixtures` (`hours.json`, `vibes.json`, `price.json`, `freshness.json`, `share.json`, `favourites.json`, `reminders.json`, plus `claims` in `community.json`). The Swift core doesn't have these yet: port each module and add a fixture test, as for the others. New `Venue` fields (`hours`, `amenities`, `placeId`, `menuUrl`, `checked`) are optional, so older apps ignore them and `SCHEMA_VERSION` stays 1.

| Feature | Web | iOS plan |
| --- | --- | --- |
| Opening hours, "Open now" | `hours.ts`. A line under the venue name that expands to the week; "More spots" rows show it instead of the address. A span ending at 1440 joins the next day's span that opens at 0 (24-hour places). | Same line in the venue sheet. |
| Favourites + reminders | Star on the venue hero; "Your spots" strip at the top of the sheet only when there are some (`favourites.ts`); a toast when one starts within 15 min; "Remind me" hands over a weekly `.ics` (`reminders.ts`). Saved in localStorage. | Store ids in UserDefaults; schedule local notifications from `reminderPlan` (a start ≥ 1440 means early the next day). Widget or Live Activity later. |
| Freshness | `freshness.ts`: "Checked Oct 26", "✓ Confirmed by 3 people yesterday" (Toronto calendar days), stale after 120 days or with an old/undated "reported" source. Shown in the status block only when confirmed or stale, on the provenance box, and a small "May be out of date" tag on cards. The check-in names the deal ("Did you get the $6 pints?"). | Same. |
| Venue owners | Claim form → `POST /api/claims` → owner approves on `?owner` → a one-time link `/?venuekey=HHV-…` → `POST /api/venue-key` → this device posts as the venue (`venueKey` on `POST /api/submissions`, shown as "From the venue"). Keys are stored hashed; approving again replaces the old one. | Keychain for the key; universal link for `?venuekey`. The owner page stays web-only. |
| Search (Oct 28, deployed) | One screen on both apps: When chips (All, On now, Happy hours, Daily specials); with nothing typed, Drinks / Food / Places tiles with counts (only what the area has; food most common first, "More" for the rest); picked tiles become tokens in the search bar (drinks and food: any of; places: all of). Typing forgives accents, apostrophes, half-typed words and typos (never for words the area or app knows, so "wings" isn't "wines"), ignores filler ("cheap … near me"), and maps words like beer, music, patio to the tiles. `aka` on a venue adds search-only names ("Black Swan"). "Cheapest" sorts by `price.ts` `cheapestDeal` once a drink or food is picked or typed. | Same (`SearchView.swift`, native search tokens). |
| Photos and menus | `hooks/usePlacePhoto.ts` uses the Google Places JS API with `placeId` (photographer credit shown, as Google requires); falls back to the gradient. Menu chip in the links. | Places SDK for iOS with the same `placeId`, or keep the gradient. |
| Sharing and plans | Share sheet: send the spot or "Meet at 5:30?" (`?v=id&meet=1050`, `share.ts`); times follow opening hours. `functions/index.ts` rewrites the page title and OG tags so links preview nicely; `public/icons/og.png` is the card image. | `ShareLink`; the same URLs as universal links (needs an `apple-app-site-association` file on the domain). |
| Vibes | `vibes.ts`: Open now, Patio, Live music, Sports, Trivia, Open late, Groups, Dogs, as one quiet chip row with food in search, and as tags on the venue page. | Same chips. |

UI rule for all of it: nothing new on the main sheet unless it's useful right now (the favourites strip hides when empty, tags only where they matter).

## Backend and accounts

- Cloudflare Pages project `happy-hr-beta` (https://happy-hr-beta.pages.dev), D1 database `happy-hr-community` (binding `DB`, see `web/wrangler.toml`). On a new machine, run `npx wrangler login` before deploying.
- **Database migrations are applied by the person, not by Claude**: changing the live database was blocked by the permission system on Linux. Add a file to `web/migrations/`, apply it locally, then ask them to run `bash web/scripts/migrate-and-deploy.sh`, which migrates the live database first and then deploys. New API code must keep working before its migration runs (see `isMissingSchema` in `web/server/shared.ts`; D1 says "no such column" on reads but "has no column named" on inserts).
- Migration `0004_venue_owners.sql` adds `claims`, `venue_keys` and `submissions.source`. Until it's applied, claiming and venue posting answer 503 and everything else works.
- The owner page is `?owner`. Its password is the `OWNER_TOKEN` secret, also the iOS Usage screen's admin password (changed from the default on Oct 28; the value is in `web/.env.local`). To change it, edit `OWNER_TOKEN` in `.env.local` and `.dev.vars`, then the person runs `bash web/scripts/set-owner-secret.sh`, which sets the secret and redeploys.
- Secrets live in `web/.env.local` (`VITE_GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_MAPS_MAP_ID`, `OWNER_TOKEN`) and `web/.dev.vars` (`OWNER_TOKEN` for local `wrangler pages dev`). They're git-ignored, and were sent separately from the project zip. Never print them.
- The Google Maps key only works from `http://localhost:5173/*`, `http://192.168.40.6:5173/*` (the Linux machine's Wi-Fi address) and the pages.dev domains. To test the web app on a phone from the Mac, add the Mac's address in Google Cloud Console. The iOS app doesn't use Google Maps.
- `GET /api/venues` is versioned by a content hash sent as the ETag. Cloudflare weakens it to `W/"…"` when it compresses the response, so the server compares tags without the `W/`. Bump `SCHEMA_VERSION` (`web/server/venues.ts`) and `VenuesPayload.supportedSchemaVersion` together only for breaking payload changes.
- Limits: 10 submissions a day per device and 40 per network; 60 check-ins a day per device and 300 per network.
- **Usage counts (Oct 28, 2026):** anonymous, for the owner. Both apps `POST /api/usage` (rules in `web/src/lib/usage.ts`, Swift `Usage.swift`): the area opened, a rough square of the map it was opened in (about 550 m near our areas, 5.5 km elsewhere; the API refuses anything that isn't a square's centre), and named taps (`venue`, `tile:beer`, `area:guelph`, `directions`…). Daily totals only, plus a salted hash of the device id for 90 days to count phones; 400 reports a day per network. `GET /api/owner-usage?days=` (owner password) feeds the iOS Usage screen: a long press on the wordmark, or Usage in the area menu once the password is on the phone (`OwnerStore`, Keychain). iOS counts in `UsageTracker.swift` (sent on open and on going to the background); debug builds only count against a local API. Web counts in `hooks/useUsage.ts`. Tables in `web/migrations/0006_usage.sql`; until it's applied the API answers 503 and the apps keep their counts for later. The salt is `OWNER_TOKEN`, so changing the owner password starts the phone counts afresh.
- **Group chat (iOS only):** one room; anyone reads (`GET /api/chat`), signed-in people with a chat name who agreed to the rules post. Word filter, 3 s / 60 an hour limits, report (3 reports hide a message), block, delete your own. The owner page (`?owner`) shows reports, hides messages and removes people; App Review expects reports handled within a day. Rules in `web/src/lib/chat.ts` (fixture `chat.json`), endpoints in `web/functions/api/chat/`, tables in `web/migrations/0005_apple_and_chat.sql`.
- **Sign in with Apple (iOS):** `POST /api/auth/apple` checks Apple's identity token (`web/server/apple.ts`; audience must be in `APPLE_BUNDLE_IDS`, default `com.happyhr.app`). Needs the paid team in `ios/project.yml` (`DEVELOPMENT_TEAM`) and the entitlement in `HappyHR/HappyHR.entitlements`. Before App Store submission, add a Sign in with Apple key (`APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` secrets) so deleting an account revokes Apple access, as App Review requires.
- **Cloudflare account:** `happy-hr-beta` and its database live in the Cloudflare account signed up with Sign in with Apple (a privaterelay email), not the owner's Gmail one. `npx wrangler whoami` should show that one before deploying.
- **Accounts (iOS only so far):** sign in with a 6-digit code sent by email (`/api/auth/code`, `/api/auth/verify`), then `Authorization: Bearer <token>` for `/api/me` and `/api/favourites`. Rules are shared in `web/src/lib/account.ts`; tables in `web/migrations/0003_accounts.sql`; codes and tokens are stored hashed. Favourites work signed out (kept on the phone) and merge into the account on sign-in. Limits: 5 codes an hour per email, 30 a day per network; a code lasts 10 minutes and 5 tries.
- **Sign-in emails need setup by the person:** a free Resend (resend.com) account with a verified domain, `RESEND_API_KEY` and `EMAIL_FROM` in `web/.env.local`, then `bash web/scripts/set-email-secrets.sh`, then `bash web/scripts/migrate-and-deploy.sh` (adds the accounts tables to the live database). Until then the live API answers "Sign-in isn’t switched on yet."
- **Testing sign-in locally:** in `web/`, `npm run build`, then `npx wrangler pages dev dist --port 8788 --ip 127.0.0.1 --binding DEV_SHOW_CODE=1` (codes come back in the reply instead of by email; never set this in production). Point a debug iOS build at it with `./sim.sh -apiBase http://127.0.0.1:8788` (it fills the code in). Swift: `HAPPYHR_API=http://127.0.0.1:8788 HAPPYHR_TEST_ACCOUNTS=1 swift test --filter LiveAccount`.

## Still to do

- **Burlington to Third Line (Oct 28, 2026, deployed):** Burlington's outline now runs into Oakville to Third Line (`alsoCities: ['Oakville']`), with 21 more spots (12 with deals) and Halton Crown; see the end of `burlington/research.md`. Phones get it with the web deploy, no build needed.
- **Usage counts (Oct 28, 2026):** live on the web and API (migration 0006 applied, deployed); the iOS side is in TestFlight build 3. The privacy page, the location prompt and `PrivacyInfo.xcprivacy` say what's counted.
- **Areas (deployed Oct 28, 2026):** Kensington, King West, Liberty Village, Guelph and Burlington are live on the web and the API next to Ossington. The iOS app has area switching, but phones only get it with a new TestFlight build (held until the owner says). Ideas: check the spots with no website (listed in each area's `research.md`) and Instagram-only deals by hand.
- Compile and polish the iOS app; test on an iPhone around Ossington.
- iOS: animate the glasses clinking in the splash (needs the logo split into layers); make an Icon Composer layered icon for iOS 26.
- iOS v2 is ported (`ios/PORTING-V2.md` has the status). Venue photos need an iOS-restricted Places key in `ios/Secrets.xcconfig` (git-ignored; see `ios/README.md`). Left: universal links (needs the paid Apple Developer Program, then `applinks:` + `apple-app-site-association` on the web).
- The live site runs v2 *without* this Mac's accounts endpoints and title-case deals (it was deployed from another copy). iOS sign-in only works once the web is deployed from here; don't deploy without asking.
- Sign-in on the web app (the API is ready; iOS has it). Web favourites are kept in the browser only (`useSaved.ts`).
- Turn on sign-in emails (see Backend and accounts) and deploy.
- Before the App Store: change the owner password, add a privacy policy and support URL, consider a custom API domain, and answer the age rating honestly (alcohol).
- **Widget, Live Activity, alerts (iOS):** `HappyHRWidgets/` is the widget extension: "Happy hours near you" (small, medium, Lock Screen), worked out by HappyHRCore from the app group (`Shared/SharedStore.swift`: the raw venue cache, community deals, favourites, walking origin), every 5 minutes ahead; and the happy-hour Live Activity (`Shared/HappyHourActivity.swift`), started from a venue page, which counts to the start, goes stale then, and counts to the end, with no push server. Starring a spot schedules one alert a day before its first happy hour (or that day's special), off with the area menu's switch (`Reminders.syncFavourites`).
- **Shared links open the app:** `web/public/.well-known/apple-app-site-association` (+ its `_headers` rule) and `applinks:` in `ios/project.yml`; `.onOpenURL` gets `https://happy-hr-beta.pages.dev/?v=…`. Development builds also read it straight from the site (`?mode=developer`); others go through Apple's cache (up to an hour after a change).
- **TestFlight:** app "Happy HR" (id 6827858846) in App Store Connect, uploaded with `ios/testflight.sh`; internal testing only, group "Friends & Family" (testers must be App Store Connect team members: invite them in Users and Access with the Marketing role and access to Happy HR only, then add them to the group; no beta review needed). Test information saved; the beta review contact isn't (only external testing needs it). Each tester can be added to the group only after accepting the team invite; who's invited is in App Store Connect (this repo is public, so no names here). Build 2 (areas, new area menu, new search) uploaded Oct 28 5:23 AM; build 3 (usage counts, the owner's Usage screen, "app owner" wording) at 2:33 PM. The group takes new Xcode builds automatically. App Store Connect form fields ignore synthetic typing; set them with form_input. Privacy page: `web/public/privacy.html` (https://happy-hr-beta.pages.dev/privacy); keep it true when features change.
- Easter egg: ten quick taps on the logo rain drinks (`Views/Confetti.swift`; `./sim.sh -confetti` in debug builds). Simulator screenshots via simctl miss it (it's its own window); the iOS Simulator panel shows it.
