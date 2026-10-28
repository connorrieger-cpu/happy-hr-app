# Happy HR for iOS

The native iPhone app: SwiftUI, iOS 26, Apple's Liquid Glass and Apple Maps. It shares its data, API and deal logic with the web app.

## What's here

| Folder | What it is | State |
| --- | --- | --- |
| [`HappyHRCore/`](HappyHRCore) | Swift package: the data model, happy-hour and daily-special logic, ranking, search, community validation, the API client and an offline cache. No UI. | **Built and tested.** 13 tests check it against the web app's own answers (`shared/fixtures`), plus 4 live tests against the real API. |
| [`HappyHR/`](HappyHR) | The SwiftUI app: map with glass pins, the deals sheet, venue pages, search, daily specials, check-ins, add-a-deal, splash. | **Builds and runs** in the simulator (Xcode 27). `./sim.sh` builds, relaunches and screenshots it in one go. |
| [`project.yml`](project.yml) | XcodeGen spec that generates `HappyHR.xcodeproj`. | Ready. |

## Tonight, step by step

1. **Install Xcode 26** from the Mac App Store, open it once, and let it install the iOS 26 simulator. Install [Homebrew](https://brew.sh) if you don't have it.
2. **Get the code onto your Mac:** unzip `happy-hr.zip`, and leave `happy-hr-secrets.zip` in Downloads.
3. **Run the setup** in Terminal, in the `happy-hr` folder: `bash setup-mac.sh`. It installs XcodeGen and Node, puts the secrets in place, installs the web packages, generates `ios/HappyHR.xcodeproj`, runs the Swift tests and makes the first git commit.
4. **Open the project:** `open ios/HappyHR.xcodeproj`. Later, if you push the folder to a private GitHub repo, the secrets stay out of it: they're git-ignored.
5. **Signing:** HappyHR target → Signing & Capabilities → choose your team. A free Apple ID runs it on your own iPhone; TestFlight and the App Store need the Apple Developer Program. Change the bundle id (`com.happyhr.app` in `project.yml`) to one you own.
6. **Run it** on an iPhone simulator (⌘R). Fix whatever the compiler flags. It'll mostly be small API-signature details in `HappyHR/`, since the logic underneath is already tested.
7. **Run the core tests** any time: `cd ios/HappyHRCore && swift test`, or ⌘U on the HappyHRCore scheme.

No Google Maps key is needed: the iOS app uses Apple Maps.

## How it fits together

```
web/src/data/*.ts ──► GET /api/venues ──► VenueCache (on device) ──┐
  (the one source of truth;   (ETag: only downloads                │
   deploy = new data for      when something changed)              ├─► mergeCommunity ─► rankVenues / dailyBoard / searchVenues ─► SwiftUI
   web and iOS, no app                                             │       (HappyHRCore, same results as the web app)
   update needed)            GET /api/community ───────────────────┘
                             POST /api/submissions, /api/votes ◄── add-a-deal form, 👍/👎
```

- **First launch / offline:** the app bundles `shared/fixtures/venues.json`, so it shows deals before (or without) any network. After that it uses its cache and refreshes in the background.
- **Device id:** a random UUID kept in the Keychain (`DeviceID.swift`). No accounts. The API uses it for one check-in per venue per day and for rate limits.
- **Location** stays on the phone. It's only used to sort by walking distance, and it falls back to Ossington & Dundas when you're more than 3 km away.
- **Time:** everything runs on Toronto time, whatever the phone's time zone (`Clock(Date())`). It's tested across both 2026 daylight-saving changes.

## The API

Base URL `https://happy-hr-beta.pages.dev` (one constant: `HappyHRClient.production`). Full contract: [`shared/api/openapi.yaml`](../shared/api/openapi.yaml).

| Endpoint | What |
| --- | --- |
| `GET /api/health` | Up? Which data version? Does the database answer? |
| `GET /api/venues` | All venues, the area and the food types. Send `If-None-Match` for a cheap 304. |
| `GET /api/community` | Community-added deals and 30-day check-in tallies. |
| `POST /api/submissions` | Add a happy hour or daily special (10/day per device, 40 per network). |
| `POST /api/votes` | "Did the deal work?" (one per device, venue and day). |
| `POST /api/claims` | Venue staff ask to manage a page (the owner approves on the web). |
| `POST /api/venue-key` | Check a venue key from a `?venuekey=` link; then send it as `venueKey` with submissions to post as the venue. |
| `POST /api/auth/code`, `/api/auth/verify` | Sign in with a 6-digit emailed code; returns a token (kept in the Keychain, `SessionStore`). |
| `GET`/`DELETE /api/me`, `POST /api/auth/sign-out` | Who's signed in; delete the account; sign this phone out. |
| `GET`/`PUT /api/favourites` | Starred venues, so they follow the account to any phone. |

Errors come back as `{ "error": "message for people" }`. `APIError.rejected` carries that message, so show it as is.

## Keeping web and iOS in step

- **Deal data changes** (`web/src/data/`): deploy the web app. The iOS app picks up the new version by itself. Before an App Store build, run `npm run shared` in `web/` so the bundled fallback is fresh.
- **Logic changes** (`web/src/lib/`): run `npm test`, then `npm run shared` to rewrite the fixtures, then `swift test` here. Any failure shows exactly what to port.
- **Breaking changes to the venue payload:** bump `SCHEMA_VERSION` in `web/server/venues.ts` *and* `VenuesPayload.supportedSchemaVersion`. Older apps then keep their cache and ask people to update, instead of crashing.

## Liquid Glass

The look follows Apple's iOS 26 guidance: **glass is for the layer that floats over content, never the content itself, and never glass on glass.** All of it goes through [`Design/Glass.swift`](HappyHR/Design/Glass.swift), so the look can be tuned in one place.

| Web app | iOS |
| --- | --- |
| Glass top bar (logo, search, area chip) | `GlassEffectContainer` with `.glassEffect` capsules and circles |
| Bottom sheet with snap points | A real sheet: `.presentationDetents([.height(190), .fraction(0.45), .large])` with background interaction, which iOS 26 draws as glass |
| Honey pills and selected chips | `.buttonStyle(.glassProminent).tint(.honey)` |
| Plain chips | `.buttonStyle(.glass)` |
| Live pin labels | `.glassEffect(.regular.tint(.honey))` capsules on Apple Maps |
| Cards inside the sheet | Quiet fills (`cardBackground`), not glass |
| Fredoka wordmark | SF Pro Rounded (`Font.display`) |

Colours, radii and component specs are in [`shared/design/tokens.json`](../shared/design/tokens.json) and `HappyHR/Design/Theme.swift`. The app icon is generated from the web logo (`npm run icons` in `web/`).

## Not done yet (good next steps)

- **First compile and polish** in Xcode, then try it on your iPhone around Ossington.
- **iOS 26 layered icon:** open Icon Composer (comes with Xcode 26), build the icon from `Assets.xcassets/LogoMark.imageset/LogoMark.svg` in layers (face, glasses, sparks), so iOS can render it in glass, tinted and dark styles. The flat 1024 px icon works until then.
- **Splash:** the web version clinks the two glasses. Here the logo just springs in; animating the glasses needs the logo split into layers.
- **From the web app:** "Preview a different time" (the clock button over the map), Demo data and favourites (with account sync) are ported. The v2 features are ported too (see **[PORTING-V2.md](PORTING-V2.md)**); the owner page stays web-only (`?owner`).
- **Venue photos:** the venue page shows the venue's Google Places photo (Places API (New), `App/PlacePhotos.swift`) when `ios/Secrets.xcconfig` has `GOOGLE_PLACES_KEY = …`. It must be its own key, restricted to iOS apps with bundle id `com.happyhr.app` and to Places API (New); the web key only works from the website. Without a key the hero keeps its gradient. Each photo is two billed Places requests, once per venue per launch.
- **Venue cache:** `VenueCache` keeps `GET /api/venues` exactly as the server sent it (`venues-cache-2.json`). The first cache re-encoded the payload, so a copy saved before the v2 fields existed lost hours, amenities, menus and dates, and the unchanged ETag kept it; the new cache deletes that file.
- **Later ideas:** a Live Activity or widget ("Happy hour at Manita ends in 20 min").
- **Before the App Store:**
  - Change the owner password from `admin` (`bash web/scripts/set-owner-secret.sh`).
  - Consider a custom API domain.
  - Add a privacy policy and support URL.
  - Answer the age-rating questions honestly; frequent alcohol references usually mean the highest age band.
  - The privacy manifest (`PrivacyInfo.xcprivacy`) already declares the device id and community posts.
