# Porting the v2 features to iOS

> **Status (2026-10-27): ported.** All of §3–§7 is in the app and checked in the simulator; the core
> matches every v2 fixture (`swift test`). Photos (§7.4) use Places API (New) with an iOS-restricted key in `ios/Secrets.xcconfig`, gradient without one. Not done:
> links opening the app from the web (§7.2: the paid team is in place; it needs an `apple-app-site-association` file on the web). Until then the
> app also answers `happyhr://?v=…&meet=…&venuekey=…`, e.g. `xcrun simctl openurl booted "happyhr://?v=manita&meet=1050"`.

The web app (https://happy-hr-beta.pages.dev) has eight features that the iPhone app doesn't have yet. This guide is everything needed to add them: the data, the logic with its exact rules, the tests that prove the Swift matches the web, where each feature goes in the SwiftUI app, and the new API calls.

The rule from [CLAUDE.md](../CLAUDE.md) still holds: **port, don't fork.** All the logic already exists in `web/src/lib/*.ts`, and its answers are recorded in `shared/fixtures/*.json`. Each new Swift file is done when its fixture test passes.

## Contents

1. [The eight features at a glance](#1-the-eight-features-at-a-glance)
2. [Order of work](#2-order-of-work)
3. [Data model changes](#3-data-model-changes)
4. [Logic modules](#4-logic-modules), one per web file, with its fixture test
5. [API changes](#5-api-changes)
6. [UI: where everything goes](#6-ui-where-everything-goes)
7. [Platform pieces: notifications, links, Keychain, photos](#7-platform-pieces)
8. [Porting gotchas](#8-porting-gotchas)
9. [Done checklist](#9-done-checklist)

---

## 1. The eight features at a glance

| # | Feature | What people see | Web logic | Fixture |
| --- | --- | --- | --- | --- |
| 1 | Opening hours, "Open now" | "Open · till 2 AM" under the venue name, tap for the week; "More spots" rows show it instead of the address | `hours.ts` | `hours.json` |
| 2 | Favourites + reminders | Star a venue; "Your spots" strip at the top of the list (only when there are some); a heads-up before a favourite's happy hour; "Remind me" weekly | `favourites.ts`, `reminders.ts` | `favourites.json`, `reminders.json` |
| 3 | Freshness | "Checked Oct 26", "✓ Confirmed by 3 people yesterday", "May be out of date"; the check-in names the deal | `freshness.ts` | `freshness.json` |
| 4 | Venue owners | "Run this place? Claim this page" → you approve on the web owner page → the venue posts its own deals, marked "From the venue" | `community.ts` | `community.json` (`claims`) |
| 5 | Cheapest near me | Search has Spots / Cheapest; compare beer, wine, cocktails, shots, oysters, wings | `price.ts` | `price.json` |
| 6 | Photos and menus | A photo on the venue hero (web: Google Places); a Menu link | `ossington.places.ts` data | `venues.json` |
| 7 | Sharing and plans | Share a spot, or "Meet at Manita at 5:30?" | `share.ts` | `share.json` |
| 8 | Vibes | Open now, Patio, Live music, Sports on TV, Trivia, Open late, Good for groups, Dog-friendly: chips in search, tags on the venue page | `vibes.ts` | `vibes.json` |

The deal data (hours, amenities, menu links, place ids) already comes down with `GET /api/venues`. The app just doesn't decode those fields yet. No schema bump was needed: every new field is optional.

## 2. Order of work

Each step leaves `swift test` green, so it's safe to stop between them.

1. **Models** (§3). Decode the new fields and check that `venues.json` still loads.
2. **Hours** (§4.1). Most other features read opening hours, so it goes first.
3. **Vibes** (§4.2), including the optional `vibe` on `SearchQuery`.
4. **Freshness** (§4.3).
5. **Price** (§4.4).
6. **Share** (§4.5).
7. **Favourites** (§4.6) and **Reminders** (§4.7).
8. **Community and API** (§4.8, §5): claims, venue keys, `byVenue`.
9. **UI** (§6), screen by screen, then the platform pieces (§7).

When the Swift core is done, ask Claude: "port the v2 UI from PORTING-V2.md §6". The core and its tests are the hard part; the views are thin.

## 3. Data model changes

All in `HappyHRCore/Sources/HappyHRCore/Models.swift`. Field names match the JSON exactly.

```swift
/// One stretch a venue is open. `close` past 1440 runs into the next day.
/// A span ending at exactly 1440 joins the next day's span that opens at 0 (24-hour places).
public struct OpenSpan: Codable, Hashable, Sendable {
    public var day: Weekday
    public var open: Int
    public var close: Int
}

public enum Amenity: String, Codable, CaseIterable, Hashable, Sendable {
    case patio
    case liveMusic = "live-music"
    case sports, groups, dogs
}

public struct CommunityRef {            // existing, add:
    /// Posted by the venue's own staff with a venue key.
    public var byVenue: Bool?
}

public struct Venue {                   // existing, add (all optional):
    public var hours: [OpenSpan]?       // absent when unknown (3 of 84 today)
    public var amenities: [Amenity]?
    public var placeId: String?         // Google Places id
    public var menuUrl: String?
    public var checked: String?         // "2026-10-26": when we last checked the deals
}
```

Also add `byVenue: Bool?` to `CommunitySubmission`, and `venueKey: String?` to `SubmissionInput` (§4.8). Add the new parameters to `Venue.init` with `nil` defaults so existing call sites keep compiling.

**Test:** extend `VenueData.decodes()`:

```swift
#expect(venues.filter { !($0.hours ?? []).isEmpty }.count == 81)
#expect(venue("roxton-public-house").amenities?.contains(.sports) == true)
#expect(venue("central").menuUrl != nil)
```

## 4. Logic modules

One new Swift file per web file, in `HappyHRCore/Sources/HappyHRCore/`. The signatures below follow the existing core's style (free functions, `at clock:` labels). Below each are the exact rules, then the fixture and how to test it.

All fixtures load through the `load(_:as:)` helper at the top of `FixtureTests.swift`. Add one `@Suite` per module, like the existing ones.

### 4.1 Hours.swift ← `web/src/lib/hours.ts`

```swift
public enum OpenState: Hashable, Sendable {
    case unknown
    case open(closesAt: Int, closesIn: Int)
    case closed(opensAt: Int?, opensDay: Weekday?, opensIn: Int?)
}
public let closingSoonMinutes = 60

public func openState(_ venue: Venue, at clock: Clock) -> OpenState
public func openLabel(_ state: OpenState, today: Weekday) -> String
public func mightBeOpen(_ venue: Venue, at clock: Clock) -> Bool
public func weekHours(_ venue: Venue, today: Weekday) -> [(day: Weekday, text: String)]
public func isOpenLate(_ venue: Venue) -> Bool
```

**Rules:**

- **No hours:** `openState` is `.unknown` when `hours` is nil or empty, and `openLabel` is `""`.
- **Upcoming spans:** for every span, take each occurrence from yesterday (offset −1) to 7 days ahead where `span.day == (clock.day + offset) mod 7`:
  - `startsIn = offset·1440 + open − clock.minutes`
  - `endsIn = startsIn + close − open`
- **Open now:** among occurrences with `startsIn <= 0 && endsIn > 0`, take the one with the largest `endsIn`. Then:
  - `closesAt = runsUntil(span)`: start at `close`; while `close == offset·1440` (offset 1, 2, … 7), look for a span on `(span.day + offset) mod 7` with `open == 0`. If there is one, `close = offset·1440 + next.close`; otherwise stop.
  - `closesIn = endsIn + closesAt − span.close`
  - Result: `.open(closesAt, closesIn)`.
- **Closed:** otherwise take the occurrence with the smallest positive `startsIn` and return `.closed(opensAt: span.open, opensDay: its day, opensIn: startsIn)`. If there's none, return `.closed(nil, nil, nil)`.
- **`openLabel`:**
  - Open, `closesIn >= 1440` → `"Open 24 hours"`
  - Open, `closesIn <= 60` → `"Closes soon · {formatTime(closesAt, compact)}"`
  - Open otherwise → `"Open · till {formatTime(closesAt, compact)}"`
  - Closed with no next opening → `"Closed"`
  - Closed otherwise → `"Closed · opens {day }{formatTime(opensAt, compact)}"`. The day prefix (short day name and a space, e.g. `"Tue "`) is left out only when `opensDay == today && opensIn < 1440`.
- **`mightBeOpen`:** `openState(...) != closed`. Unknown counts as open.
- **`weekHours`:** seven rows starting today. Each row is that day's spans sorted by `open`, each written `"{open}–{close}"` (compact times), joined with `", "`. A span of 1440 minutes or more is `"Open 24 hours"`, and a day with no spans is `"Closed"`.
- **`isOpenLate`:** any span where `runsUntil(span) >= 1440 + 60`.

**Fixture `hours.json`:**

```jsonc
{
  "openLate": { "<venueId>": true },
  "week": [{ "venue": "central", "today": 2, "rows": [{ "day": 2, "text": "11:30 AM–1 AM" }] }],
  "states": [{ "label": "Mon 4:30 PM", "clock": { "day": 1, "minutes": 990 },
               "venues": { "<venueId>": { "kind": "open", "closesAt": 1500, "closesIn": 510, "label": "Open · till 1 AM" } } }]
}
```

`states.venues` only lists venues with hours. A `closed` entry has `opensAt`, `opensDay` and `opensIn`, or just `kind` when nothing is coming up. Compare every field and the label.

### 4.2 Vibes.swift ← `web/src/lib/vibes.ts`

```swift
public enum VibeFilter: String, Codable, CaseIterable, Hashable, Sendable {
    case openNow = "open-now", patio, liveMusic = "live-music", sports, trivia
    case openLate = "open-late", groups, dogs
    public var label: String   // Open now, Patio, Live music, Sports on TV, Trivia, Open late, Good for groups, Dog-friendly
    public var emoji: String   // 🟢 ☀️ 🎶 📺 🧠 🌙 👥 🐕
}
public func hasVibe(_ venue: Venue, _ vibe: VibeFilter, at clock: Clock) -> Bool
public func venueVibes(_ venue: Venue, at clock: Clock) -> [VibeFilter]
```

Keep the cases in exactly the order above: it's the display order, and the fixture's `ids` list checks it.

**Rules:**

- `openNow` → `openState` is `.open`.
- `openLate` → `isOpenLate`.
- `trivia` → `/trivia|quiz/i` matches any of the venue's `tags`, daily-special `title`s or daily-special `note`s.
- Anything else → `amenities` contains it.
- `venueVibes` → every case except `openNow` that `hasVibe`, in case order. These are the tags on the venue page; "Open now" has its own line there.

**Search:** add `public var vibe: VibeFilter?` to `SearchQuery` (default nil, decodes when missing) and one line in `searchVenues`, after the food check:

```swift
if let vibe = query.vibe, !hasVibe(venue, vibe, at: clock) { continue }
```

`isEmpty` also requires `vibe == nil`.

**Fixture `vibes.json`:**

- `{ label, clock, ids, venues: { "<venueId>": ["patio", …] }, search: [{ query, results: ["<venueId>", …] }] }`
- `ids` is the case order.
- `venues` is `venueVibes` at the clock.
- `search` runs `searchVenues` with one vibe each, over `rankVenues(venues, at: clock, from: origin).all`. Compare the result ids in order.

### 4.3 Freshness.swift ← `web/src/lib/freshness.ts`

```swift
public struct Freshness: Codable, Hashable, Sendable {
    public var label: String
    public var confirmed: Bool
    public var stale: Bool
}
public func freshness(_ venue: Venue, tally: VoteTally?, now: Date = Date()) -> Freshness?
```

**Rules, in order:**

1. **No answer:** `nil` when the venue has no happy hours and no daily specials, or `deals == .sample`.
2. **Confirmed:** applies when `tally.lastYes` was at most **14** days ago.
   - Label `"✓ Confirmed{ by N people} {ago}"`. The " by N people" part is included only when `yes > 1`.
   - `confirmed: true`, `stale: false`.
3. **Community only:** applies when `venue.checked == nil` and some deals have a `community` ref.
   - Take the newest `createdAt`; label `"Added {ago}"`.
   - Stale when that's more than **120** days ago.
4. **Otherwise:**
   - Label `"Checked {Mon} {d}"` from `checked` (e.g. "Checked Oct 26"), or `"Not checked yet"` when there's no `checked`.
   - **Stale when either is true:**
     - `checked` is missing or more than **120** days ago.
     - `deals == .reported` and the newest `sources[].date` is missing or more than **365** days ago.

**Day counting:** whole **calendar days in Toronto**, not 24-hour periods. A check-in last night at 10 PM is "yesterday" at 4 PM today.

- `daysSince(date, now) = round(dayNumber(now) − dayNumber(date))`.
- `dayNumber(d)` is `torontoDate(d)` (the existing `"yyyy-MM-dd"` helper), read back as UTC midnight and divided by 86,400 s.
- Dates written `"2026-10-26"` or `"2026-10"` (day 1) parse to noon UTC on that date. `"undated"` doesn't parse.

**`ago(days)`:**

| Days | Text |
| --- | --- |
| 0 or less | `today` |
| 1 | `yesterday` |
| under 30 | `N days ago` |
| 30 or more | `months = round(days / 30)`: `a month ago` when that's 1, else `N months ago` |

Month names: Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec, from the parsed date's UTC month and day.

**Fixture `freshness.json`:** `{ cases: [{ name, venue, tally (or null), now: ISO-8601, result (or null) }] }`. Parse `now` with `ISO8601DateFormatter`.

### 4.4 Price.swift ← `web/src/lib/price.ts`

```swift
public enum PriceKind: String, Codable, CaseIterable, Hashable, Sendable {
    case beer, wine, cocktail, shot, oysters, wings
    public var label: String   // Beer, Glass of wine, Cocktail, Shot, Oysters, Wings
    public var emoji: String   // 🍺 🍷 🍸 🥃 🦪 🍗
}
public struct PriceDeal: Hashable, Sendable {
    public var ranked: RankedVenue
    public var special: Special
    public var price: Double
    public var on: Bool
    public var when: String
}
public func priceKind(_ special: Special) -> PriceKind?
public func cheapest(_ items: [RankedVenue], _ kind: PriceKind, at clock: Clock, onlyNow: Bool = false) -> [PriceDeal]
public func priceKinds(in items: [RankedVenue], at clock: Clock) -> [PriceKind]
```

**`priceKind`:**

1. `nil` when `price` is nil.
2. `nil` when the item matches the not-a-single-item pattern (case-insensitive):
   `\b(bottles?|pitchers?|flights?|any \d|set|per person|tower)\b|half-price|% off|\$\d+ off`
3. Otherwise try the kinds in this order: **oysters, wings, shot, wine, cocktail, beer**. Return the first whose words match.
   - Food specials can only be oysters or wings; drinks can't be either.
   - Skip `wine` when the cocktail words match and `\bglass|wine\b` doesn't (so "aperol spritz" is a cocktail).
   - Copy the six word patterns verbatim from `price.ts` (`WORDS`). They're case-insensitive with `\b` word boundaries; `NSRegularExpression` handles them as written.

**When each deal is on:**

| Deal | Situation | `on` | `when` |
| --- | --- | --- | --- |
| Happy hour | It's the live window | yes | `"On now · till {endsAt}"` |
| Happy hour | It's today's upcoming window (`soon`/`later` status), or it runs today and hasn't started | no | `"Today {range}"` |
| Happy hour | Anything else | no | `"{formatDays(days)} {range}"` |
| Daily special | Running now | yes | `"On now · till {end}"`, or `"On today"` when it has no hours |
| Daily special | Runs today, starts later | no | `"Today {range}"` |
| Daily special | Anything else | no | `"{Every day or formatDays} {range}"` (no range when it has no hours) |
| Daily special | Shows as on, but `mightBeOpen` is false | no | `"On today"` becomes `"Today"`; other text stays |

**`cheapest`:**

- Walk happy-hour windows, then daily specials, venue by venue.
- Keep one deal per `"{venueId}|{formatSpecial(special)}"`. A later deal only replaces an earlier one when it's on and the earlier isn't, and it **keeps the earlier one's position** (see §8).
- `onlyNow` drops deals that aren't on.
- Sort by price ascending, then on-now first, then nearest; ties keep the order they were added in.

**`priceKinds(in:)`:** the kinds with at least one deal (with `onlyNow` off), in case order.

**Fixture `price.json`:**

- `kinds`: id, label and emoji for each kind.
- `classify`: `[{ special, kind or null }]`, every distinct special in the data.
- `cheapest`: `[{ label, clock, kind, onlyNow, deals: [{ venue, item, price, on, when }] }]`, over `rankVenues(venues, at: clock, from: origin).all`.

### 4.5 Share.swift ← `web/src/lib/share.ts`

```swift
public struct SharedLink: Hashable, Sendable {
    public var venueId: String?
    public var meet: Int?
    public var venueKey: String?
}
public func parseLink(query: String) -> SharedLink            // "?v=manita&meet=1050"
public func venueLink(base: URL, venueId: String, meet: Int? = nil) -> URL
public func dealLine(_ rv: RankedVenue, at clock: Clock) -> String?
public func shareMessage(_ rv: RankedVenue, at clock: Clock, meet: Int? = nil) -> String
public func meetOptions(_ rv: RankedVenue, at clock: Clock) -> [Int]
public func previewText(_ venue: Venue) -> String             // optional: only the server uses it
```

**`parseLink`:** anything malformed reads as absent.

| Parameter | Kept when |
| --- | --- |
| `v` | It matches `^[a-z0-9-]{1,80}$` |
| `meet` | It's a whole number with `0 < meet < 1440` |
| `venuekey` | It matches `^[A-Z0-9-]{8,40}$`, case-insensitive |

**`venueLink`:** the base URL with its query and fragment removed, then `?v={id}`, then `&meet={m}` when there's a meeting time. For example, `https://happy-hr-beta.pages.dev/?v=manita&meet=1050`. Use `HappyHRClient.production` as the base, so friends without the app get the web page.

**`dealLine`:** uses `lead = headlineSpecial(focusWindow(status))`.

| Situation | Text |
| --- | --- |
| Happy hour live, with a lead | `"{formatSpecial(lead)} till {endsAt}"` |
| Soon or later today, with a lead | `"{formatSpecial(lead)}, {formatRange(window)} today"` |
| A daily special today (`dailyToday`) | `"{dailyLabel} today"` |
| Otherwise | `nil` |

**`shareMessage`:**

| Kind | Text |
| --- | --- |
| With a meeting time | `"Meet at {name} at {formatTime(meet, compact)}?"`, then `" {dealLine}."` when there is one |
| Without | `"{name} on {address}"`, then `": {dealLine}"` when there is one |

**`meetOptions`:**

1. `soonest = ceil((now + 15) / 30) · 30`.
2. If the venue is closed now but opens later **today**, start from `max(soonest, ceil(opensAt / 30) · 30)` instead.
3. Offer that and the next three half-hours, keeping only times before 1440 that aren't closed by the hours (unknown counts as open).
4. Add the happy hour's `startsAt` when the status is `soon` or `later` and it's before 1440.
5. Sort ascending and keep the first 5.

**`previewText`:**

- With a happy hour: `"Happy hour {formatDays} {formatRange}: {first two specials, ", "}. {address}."`
- Otherwise, with a daily special: `"{formatDays(days)}: {dailyLabel}. {address}."`
- Otherwise: `"{address}."`

**Fixture `share.json`:**

- `parse`: `[{ search, link }]`. Fields absent from `link` are nil.
- `links`: `[{ base, venueId, meet?, url }]`.
- `venues`: per venue at the fixture clock, `{ venue, dealLine, message, meetMessage, meetOptions, preview }`. `meetMessage` uses meet = 1110 (6:30 PM).

### 4.6 Favourites.swift ← `web/src/lib/favourites.ts`

```swift
public enum FavouriteTone: String, Hashable, Sendable { case live, soon, today, quiet }
public struct FavouriteLine: Hashable, Sendable {
    public var ranked: RankedVenue
    public var label: String
    public var tone: FavouriteTone
}
public func favouriteLines(_ items: [RankedVenue], ids: [String], at clock: Clock) -> [FavouriteLine]
public let headsUpMinutes = 15
public func startingSoon(_ items: [RankedVenue], ids: [String]) -> [RankedVenue]
```

**Line for each favourite** (taken from `items` in their order):

| Situation | Tone | Label |
| --- | --- | --- |
| Happy hour live | `live` | `"On · till {endsAt}"` |
| Happy hour soon or later today | `soon` | `"Starts {startsAt}"` |
| A daily special today | `today` | `"{dailyLabel} today"` |
| Status `none` with a next happy hour | `quiet` | `"{short day} {startsAt}"` |
| Otherwise | `quiet` | `openLabel(openState)`, or the venue's `category` when that's empty |

Sort by tone (live, soon, today, quiet), then nearest; ties keep their order.

**`startingSoon`:** favourites with status `soon` and `startsIn <= 15`.

**Fixture `favourites.json`:** `{ ids, cases: [{ label, clock, lines: [{ venue, label, tone }], startingSoon: [ids] }] }`.

### 4.7 Reminders.swift ← `web/src/lib/reminders.ts`

```swift
public struct ReminderPlan: Codable, Hashable, Sendable {
    public var title: String
    public var detail: String
    public var days: [Weekday]
    public var start: Int?    // ≥ 1440 means early the next morning
    public var end: Int?
}
public let reminderLeadMinutes = 15
public func reminderPlan(_ venue: Venue, window: HappyHourWindow) -> ReminderPlan
public func reminderPlan(_ venue: Venue, daily: DailySpecial) -> ReminderPlan
```

**Plan fields:**

| Field | Happy hour | Daily special |
| --- | --- | --- |
| `title` | `"Happy hour at {name}"` | `"{dailyLabel} at {name}"` |
| `detail` | First 3 specials, `formatSpecial`, joined `" · "` | Same |
| `days` | Sorted ascending | Same |
| `start`, `end` | The window's | The special's (nil for an all-day special) |

The web turns this into a weekly calendar file (`reminderIcs`). **iOS doesn't need that**: it schedules local notifications from the plan (§7.1). Test only the plan.

**Fixture `reminders.json`:** `{ now, cases: [{ venue, kind: "happy-hour" | "daily", deal, plan, ics }] }`. Build the plan from `deal` and compare it with `plan`; ignore `ics`.

### 4.8 Community.swift additions ← `web/src/lib/community.ts`

**Claims:**

```swift
public struct ClaimInput: Codable, Hashable, Sendable {
    public var device: String
    public var venueId: String
    public var name: String
    public var role: String?
    public var contact: String
    public var message: String?
}
public func validateClaim(_ input: ClaimInput) -> String?
```

Checks in order, each returning the message shown (the UI shows it as is):

| Check | Message |
| --- | --- |
| `device` doesn't match the existing device pattern | `"Missing device id."` |
| `venueId` doesn't match `^[a-z0-9-]{1,80}$` | `"Unknown venue."` |
| Trimmed `name` empty or longer than 80 | `"Add your name."` |
| `role` longer than 40 | `"Keep the role short."` |
| Trimmed `contact` empty, longer than 120, or neither an email (`^[^\s@]+@[^\s@]+\.[^\s@]+$`) nor 10+ digits | `"Add an email or phone number we can reach you at."` |
| `message` longer than 280 | `"The message is too long."` |

Add `role = 40` and `contact = 120` to `CommunityLimits`.

**Venue keys on submissions:** in `validateSubmission`, right after the venue-id check, reject when `venueKey` is set and either doesn't match `^[A-Z0-9-]{8,40}$` (case-insensitive) or `venueId` is nil. The message is `"That venue key doesn’t look right."` (curly apostrophe).

**`mergeCommunity` for venue posts** (`byVenue == true`):

- The added window or special gets `community.byVenue = true`.
- Its note is `"From {venue.name}: “{note}”"`, or `"Posted by {venue.name}."` without a note. Community posts keep their existing notes.
- On a listed venue, a venue post turns `deals` from `none`, `community` or `reported` into `venue`. Otherwise `none` becomes `community`, as now.

**Fixture:** `community.json` has a new `claims: [{ name, input, error }]` list for `validateClaim`. There's no fixture for the `byVenue` merge, so add a small hand-written test next to `mergesDailySpecialsAndNewPlaces()`.

## 5. API changes

Add to `HappyHRClient` in `API.swift`. Errors come back as `{ "error": "…" }` through the existing `APIError.rejected`, so show the message as is.

```swift
/// POST /api/claims → 201 { id }. 400 bad input, 429 more than 3 a day, 503 claiming isn't switched on yet.
public func claim(_ input: ClaimInput) async throws -> String

/// POST /api/venue-key { key } → 200 { venueId }. 404 unknown or replaced key, 503 not switched on yet.
public func venueForKey(_ key: String) async throws -> String
```

`submit(_:)` sends `venueKey` when it's set. The server then:

- answers **403** if the key belongs to a different venue,
- answers **503** if venue posting isn't switched on yet,
- skips the rate limit for venue posts,
- returns the submission with `byVenue: true`.

`GET /api/community` submissions now carry `byVenue` too. The full contract is in [`shared/api/openapi.yaml`](../shared/api/openapi.yaml).

**Server note:** claims and venue keys need migration `0004_venue_owners.sql` on the live database (`bash web/scripts/migrate-and-deploy.sh`). Until then those calls answer 503 and everything else works.

## 6. UI: where everything goes

The web app's rule applies here too: **nothing new on the main sheet unless it's useful right now.** Things appear only when they have something to say, and glass stays on the floating layer (toolbars, map buttons, the sheet itself), never on cards (`cardBackground`).

### AppModel additions (`HappyHR/App/AppModel.swift`)

| State | Kept in | Notes |
| --- | --- | --- |
| `favourites: [String]` | UserDefaults `"favourites"` | Newest first; `toggleFavourite(_:)` |
| `venueKeys: [String: String]` | Keychain (§7.3) | venueId → key |
| `searchTab: SearchTab` (`.spots`, `.cheapest`) | memory | Kept while search is closed, like `searchQuery` |
| `priceQuery: (kind: PriceKind?, onlyNow: Bool)` | memory | |
| `meet: (venueID: String, minutes: Int)?` | memory | From a shared link; shown on that venue only |
| `favouriteLines` | derived | `favouriteLines(everything, ids: favourites, at: clock)` |
| `claiming: Venue?`, `sharing: RankedVenue?` | memory | Drive the sheets below |

`ContributeTarget` gets `asVenue: Bool`. When it's true, the form posts with the stored key.

### Main sheet (`NowSheet.swift`, `Cards.swift`)

- **Your spots:** a horizontal `ScrollView` of small cards at the very top of the list, **only when there are favourites** and the Daily specials filter is off.
  - Each card shows the name and the line's label.
  - The `live` tone uses honey text with the live dot; `soon` and `today` use primary text; `quiet` uses secondary text.
  - Tapping opens the venue.
  - Use `cardBackground`, not glass.
- **`SpotRow`:** show `openLabel(openState(...))` instead of the address when the hours are known. "Open…" lines are green, everything else secondary. Today's daily special still wins over both.
- **`DealCard`:** a small "May be out of date" tag (amber, dashed like the existing Sample tag) when `freshness(...).stale` and nobody has confirmed it (`voteSummary` mood is `none`).
- **Daily specials view:** today's all-day special isn't "On" while `mightBeOpen` is false.

### Venue page (`VenueDetailView.swift`)

Top to bottom:

1. **Hero:**
   - Toolbar buttons: **Share** (opens the share sheet below) and **Star** (`star` / `star.fill`, honey when saved).
   - Optional photo (§7.4); keep the gradient when there's none.
2. **Meta lines:** add a third line with the open state, e.g. "Closed · opens 5 PM ⌄". It's green when open and amber when closing soon. Tapping expands the week (`weekHours`) in the same row style as "This week", with today highlighted.
3. **Meet banner:** only when opened from a link with `meet` for this venue. A honey card reading "**Meet here at 5:30 PM?**" with `dealLine` under it.
4. **Tags:** `venueVibes` first (emoji + label, slightly stronger than plain tags), then the existing `tags`.
5. **Status block:**
   - When `freshness` is `confirmed`, add a green line with its label.
   - When it's `stale`, add an amber line "May be out of date · {label}".
   - Otherwise add nothing.
6. **Today's specials:** unchanged.
7. **Daily specials:** each item gets a small bell toggle for its reminder (§7.1).
8. **This week:** a "Remind me" bell in the section header for the happy hour.
9. **Actions and links:** a **Menu** link chip (`fork.knife`) when `menuUrl` is set.
10. **Provenance box:** add the freshness label after the title, when it isn't a confirmation.
11. **Check-in:**
    - While a happy hour is live, ask "Here now? Did you get the {formatSpecial(lead)}?".
    - For a spot whose only deal is a daily special today, ask about `dailyLabel` instead.
    - Otherwise keep the current question.
12. **Footer:**
    - If this device holds the venue's key: "You manage this page. **Post a deal**" (opens ContributeView with `asVenue`).
    - Otherwise, for listed venues only (not community-added `c-…` ones): "Run {name}? **Claim this page**" in small secondary text.

### Search (`SearchView.swift`)

- A segmented `Picker` under the search field: **Spots | Cheapest**.
- **Spots:**
  - The deal chips as now.
  - One combined chip row: the eight vibes first, a thin divider, then food. Vibe and food each toggle on their own.
  - Clear also resets the vibe.
  - A result row with no note and no happy hour shows `openLabel` instead of nothing.
  - The "On now" badge also needs `mightBeOpen`.
- **Cheapest:**
  - One chip row: an "On now" toggle, then `priceKinds(in:)`.
  - Rows lead with the price (honey when on now), then the venue name, the item and `when`, and the walk time.
  - The search text filters rows by venue name and item.
  - Empty states: "Nothing like that on right now. Turn off “On now” to see the week." or "No prices to compare yet."

### New sheets

- **ShareView** (`.presentationDetents([.medium])`):
  - Title "Share {name}" and a row of time chips: "Just the spot" plus `meetOptions`.
  - A preview of `shareMessage`.
  - A `ShareLink(item: venueLink(...), message: Text(shareMessage(...)))`.
- **ClaimView:**
  - A `Form` like ContributeView: name, role (optional), "Email or phone, ideally the venue's", and a note (optional).
  - Check `validateClaim` locally, then call `claim`.
  - When done: "Thanks, we'll be in touch. We check every request by phone or email, then send you a link to manage this page."
- **ContributeView with `asVenue`:**
  - Title "Post a deal at {name}"; hide the Where section and lock the venue.
  - The note section reads "Anything to add? (optional)".
  - The button says "Post it"; send `venueKey`.

### Settings menu (`RootView.swift`)

Add **"Have a venue key?"**: a field that calls `venueForKey`, then stores the key. It's the fallback until universal links work (§7.2).

## 7. Platform pieces

### 7.1 Reminders and the heads-up: local notifications

The web gives a weekly calendar file and an in-app toast. iOS can do better with `UNUserNotificationCenter`:

- **Bell = a weekly notification** for that deal, scheduled from `reminderPlan`. Ask for permission the first time someone taps a bell, not at launch.
- **When:**
  - With a start time: `start − 15` minutes on each of the plan's days. Treat `day·1440 + start − 15` modulo a week (10080), so a 1 AM start lands on the next day and a 12:05 AM start lands just before midnight.
  - All-day specials: noon on the day (the web's calendar alert does the same).
- **Toronto time:** build `DateComponents` with `weekday = day + 1` (Calendar counts Sunday as 1), `hour`, `minute`, and a Gregorian calendar whose `timeZone` is `America/Toronto`. Use `UNCalendarNotificationTrigger(dateMatching:repeats: true)`. Check it by switching the simulator to another time zone.
- **Identifiers:** `reminder.{venueId}.{happy-hour|daily}.{index}.{day}`, so a bell can find and remove its own notifications. The bell shows "on" when any pending request has its prefix.
- **Limit:** iOS keeps at most 64 pending notifications, and a Mon–Fri happy hour uses 5. Say so if someone goes past that.
- **Content:** title `plan.title`, body `plan.detail`, and `userInfo["venueID"]`. Tapping it opens the venue (`UNUserNotificationCenterDelegate`).
- **Heads-up while the app is open:** when `startingSoon(everything, ids: favourites)` gives a venue that hasn't had one today, show a small glass capsule under the top bar, like the location message: "⭐ {name}: happy hour starts at {time}". Tapping opens the venue. Keep "already told today" in UserDefaults (`{day, ids}`). Starring alone never schedules notifications; the bell does.

### 7.2 Links: universal links for `?v=`, `&meet=` and `?venuekey=`

Shared links are ordinary web URLs (`https://happy-hr-beta.pages.dev/?v=manita&meet=1050`). Without the app installed they open the web app, which already handles them. Making them open the app takes three steps:

1. Add the Associated Domains entitlement `applinks:happy-hr-beta.pages.dev`. This needs the paid Apple Developer Program.
2. Serve `https://happy-hr-beta.pages.dev/.well-known/apple-app-site-association` as `application/json`. In `web/public/.well-known/` add:
   ```json
   { "applinks": { "details": [{ "appIDs": ["TEAMID.com.happyhr.app"],
       "components": [{ "?": { "v": "*" } }, { "?": { "venuekey": "*" } }] }] } }
   ```
   Then add a `_headers` rule for the content type and deploy. Use your real Team ID and bundle id.
3. Handle the link in the app with `.onOpenURL`. Call `parseLink(query:)` with the URL's query, then:
   - `venueId` → select it.
   - `meet` → set `model.meet`.
   - `venueKey` → call `venueForKey`, store the key, select the venue, and show "You can now post deals for {name} from this device."

### 7.3 Venue keys in the Keychain

Store them like `DeviceID.swift` stores the device id: one generic-password item, account `venueKeys`, with JSON `{venueId: key}` as the value. Never log keys or show them in full.

### 7.4 Photos (optional)

The web uses the Google Places **JavaScript** API with `placeId`, and shows the photographer's credit as Google requires. For iOS there are three choices:

- **Keep the gradient** (recommended for now). No key and no cost.
- **Google Places SDK for iOS:** add the `GooglePlaces` package and an **iOS-restricted** API key (a separate key from the web one). Then call `GMSPlacesClient.fetchPlace(fromPlaceID:placeFields: .photos)` and `loadPlacePhoto`. Show the attribution, and cache the image per venue. Each photo is a billed request.
- **Apple Look Around** (`MKLookAroundSceneRequest` from the venue's coordinates): free street-level imagery, but it's not a photo of the venue.

## 8. Porting gotchas

- **Stable sorting.** JavaScript's `sort` keeps equal items in their original order, and several fixtures depend on that (`cheapest`, `favouriteLines`, `meetOptions`). Swift's `sorted(by:)` doesn't promise it. Sort `enumerated()` pairs with the offset as the last tiebreak.
- **Insertion order.** `cheapest` deduplicates with a JavaScript `Map`. Replacing a value keeps its **original position**. Use an array plus a key→index dictionary, not a Swift `Dictionary`.
- **Weekdays.** The core counts 0 = Sunday. Calendar and notification `weekday` count 1 = Sunday. Convert only at the notification boundary.
- **Times past midnight.** Spans and windows use minutes after midnight of their **start** day, so 1560 is 2 AM the next day. `formatTime` already wraps.
- **Toronto, always.** `Clock(Date())` and `torontoDate()` are Toronto. Never use the phone's calendar for "today", "yesterday" or a weekday.
- **Curly apostrophes** in user-facing strings ("doesn’t", "We’ll"), matching the web and the fixtures.
- **`String.count` vs JS `length`** for the limits: they agree for the plain text people type, which is fine.
- **Regex:** `\b` with case-insensitive matching behaves the same in `NSRegularExpression` as in JavaScript for these patterns. Copy them character for character from the `.ts` files.

## 9. Done checklist

**Core (`swift test`):**
- [x] Models decode `hours`, `amenities`, `placeId`, `menuUrl`, `checked`, `byVenue`, `venueKey`
- [x] `Hours` matches `hours.json`
- [x] `Vibes` and `SearchQuery.vibe` match `vibes.json`, and `search.json` still passes
- [x] `Freshness` matches `freshness.json`
- [x] `Price` matches `price.json`
- [x] `Share` matches `share.json`
- [x] `Favourites` matches `favourites.json`
- [x] `Reminders` plans match `reminders.json`
- [x] `validateClaim` matches `community.json` claims; the `byVenue` merge has a hand-written test
- [x] `HappyHRClient.claim` and `venueForKey`

**App:**
- [x] Star, the Your spots strip, and the heads-up capsule
- [x] Bells schedule and cancel local notifications in Toronto time
- [x] Open-state line and week hours, and open state on More spots rows
- [x] Vibe tags, freshness lines, Menu link, named check-in
- [x] Share sheet with meeting times, and links that open the app (`.onOpenURL`)
- [x] Spots | Cheapest in search, and vibe chips
- [x] Claim form, "Have a venue key?", posting as the venue
- [x] Privacy manifest: claims collect a name and an email or phone number. Declare them as contact info, linked to the person, for app functionality.

**On a phone around Ossington:** compare each screen with the web app at https://happy-hr-beta.pages.dev at the same time of day. The two should say the same things.
