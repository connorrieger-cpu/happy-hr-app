# Areas

Each area the app covers (a Toronto neighbourhood, or a whole city) is a folder here, and
one line in `index.ts`. The web app, the API and the iOS app all read the same list, so
adding or removing an area here changes all three once the web is deployed.

| Area | Folder | Covers | Map |
| --- | --- | --- | --- |
| Ossington | `ossington/` (data in `src/data/ossington*.ts`) | Ossington Ave, plus Queen and Dundas from Dovercourt to Shaw | [map](https://www.google.com/maps/@43.6466,-79.4206,16z) |
| Kensington | `kensington/` | Bathurst to Spadina, College to Dundas | [map](https://www.google.com/maps/@43.6553,-79.4029,16z) |
| King West | `king-west/` | King St W from Spadina to Tecumseth, Adelaide to Wellington | [map](https://www.google.com/maps/@43.6445,-79.4,16z) |
| Liberty Village | `liberty-village/` | Dufferin to Strachan, King St W to the rail line | [map](https://www.google.com/maps/@43.6385,-79.4195,16z) |
| Guelph | `guelph/` | The whole city; the map opens on downtown | [map](https://www.google.com/maps/@43.5446,-80.2482,15z) |
| Burlington | `burlington/` | The whole city, Aldershot to Burloak, and Oakville west of Third Line (Bronte, Palermo); the map opens on downtown Burlington | [map](https://www.google.com/maps/@43.3255,-79.799,15z) |

## What's in a folder

| File | Written by | What |
| --- | --- | --- |
| `area.ts` | hand | The area: name, city, `region` (its outline, which decides which spots belong and which area someone is in), `bounds` (what the map frames when it opens), `origin` (where walks start for people who aren't nearby), `spine` and `bearing` (the main street and map rotation), `covers` (the footnote's "in …"), and for a whole city `addressCity`. The comment at the top says where the corners came from and links a map. |
| `candidates.json` | `npm run sweep -- <id>` | Every operating bar and restaurant Google Places knows in the region, with hours, website, phone, alcohol flags, amenities and a `chain` tag, plus what was left out and why. |
| `research.md` | the researcher | The report: what was checked, how, and every source. |
| `deals.json` | the researcher | The spots with deals, in the app's `Venue` shape. |
| `directory.json` | the researcher | The other listed spots, best first. |
| `venues.json` | `npm run areas` | What the apps load: research merged with Google's details. Never edit by hand. |
| `index.ts` | hand (copy another) | Exports `area` and `venues` for the loaders. |

[`RESEARCH.md`](RESEARCH.md) is the research method: listing rules, where to look for deals,
grading, and the exact JSON formats.

## Adding an area

All from `web/` (Node 20.19+: `export PATH="/opt/homebrew/bin:$PATH"`).

1. **Outline it.** Copy a folder of the same kind (`kensington/` for a neighbourhood,
   `guelph/` for a city) to `src/data/areas/<id>/`, with a short kebab-case id. In `area.ts`,
   take the corners from Google Maps (or Places) at the boundary intersections, list them in
   order around the outline as `region`, and set `center`, `origin` (a well-known corner inside
   it, with a label like "King & Portland"), `bounds`, `spine`, `bearing` (-16.7 lines the map
   up with Toronto's street grid; 0 is north up), `covers` and the map link. For a city, the
   region can be a rough box around the city limits; `addressCity` then keeps only places
   whose Google address is in that city (add `alsoCities` where the region runs into the
   next one, as Burlington's does into Oakville; those addresses keep their city). Neighbourhoods keep both sides of their boundary
   streets (45 m past the outline).
2. **Register it.** Add it to `AREA_LIST` (menu order) and `LOADERS` in `index.ts`.
   Put `[]` in `venues.json` for now.
3. **Sweep it.** `npm run sweep -- <id>` writes `candidates.json` (needs
   `GOOGLE_PLACES_SERVER_KEY` in `.env.local`; a neighbourhood costs about 100 Google calls,
   a city a few hundred). It leaves out cafés, bakeries, fast food, takeout and places that
   don't serve alcohol, and tags chains from `src/data/chains.ts`.
4. **Research it** following `RESEARCH.md`: check every candidate, write `deals.json`,
   `directory.json` and `research.md`. An area lists 50 to 100 spots (fewer for a small
   neighbourhood). Spot ids must be unique across every area: check-ins, favourites and
   links are keyed by them (for chains, add the area, e.g. `boston-pizza-guelph`).
5. **Build and check.** `npm run areas` (writes `venues.json`), `npm test` (each area is set
   up, every spot is inside its area, ids are unique, `venues.json` is up to date), then
   `npm run shared` and `swift test` in `ios/HappyHRCore`. Try it: `npm run dev`, then
   `http://localhost:5173/?a=<id>`; on iOS, `SIM_LOCATION=lat,lng ./sim.sh -apiBase http://127.0.0.1:8788`
   with the local API running.
6. **Ship it** by deploying the web (ask first). The iOS app gets the new area from the API
   (`areas` in `GET /api/venues`) without an update; it bundles only Ossington's spots for
   offline use.

## Changing spots, deals or outlines

Everything here reaches phones without a new app build: edit the area's files (or move an
outline's corners in `area.ts`), run `npm run areas` and `npm test`, and deploy the web. The
iOS app asks for its area's list every time it opens or comes back to the front, and only
downloads it when something changed (the list's version is its ETag). Outlines come with
every list, so a moved edge also changes which area someone is in.

## Removing an area

Take its lines out of `AREA_LIST` and `LOADERS` in `index.ts`, delete its folder (or keep
it out of the list to bring back later), run `npm test` and `npm run shared`, and deploy.
Phones that had it open move to the area they're in (or Ossington) the next time they ask
for it, and its spots drop out of favourites' alerts. Shared links to its spots open on the
first area without the spot.

## How the apps use areas

- `src/lib/areas.ts` (ported to Swift as `Areas.swift`): `areaAt` picks the area someone is
  in (the smallest outline containing them, else the nearest within 3 km), `inArea` decides
  which spots belong.
- `GET /api/venues?area=<id>` serves one area, with every area's outline in `areas`; no
  `area` means Ossington, for apps from before areas. Unknown areas answer 404.
- Both apps open the area from a shared link (`?a=<id>&v=<spot>`; links without `a` are
  Ossington's), else the area the person is in the first time their location is known each
  visit, else the last area shown. The menu switches areas.
- Community posts belong to an area by their spot, or by their location for new places
  (`submissionsForArea`). New places from before areas stay in Ossington.
- Demo data is Ossington's only.
