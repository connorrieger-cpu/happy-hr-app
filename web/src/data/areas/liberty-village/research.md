# Liberty Village: eight spots publish deals, all on their own sites

All 36 Google Places candidates in Liberty Village were checked on Wednesday, October 28, 2026. The area runs from Dufferin St to Strachan Ave and from King St W to the rail line. A further 13 spots that Google missed were also checked, found through OpenStreetMap, news and the Liberty Village BIA. **21 spots qualify for the list. Eight have deals, and every one of them comes from the venue's own website, menu PDF, menu image or events calendar.** None of the eight rests on a third-party guide, so all are graded `venue`. The other 13 go in the directory without deals. Fifteen candidates are left out: fast food, takeout, food-hall stalls, a sauna, places with no alcohol, two spots west of Dufferin and one that hasn't opened yet. The area is small, so 21 is well under the usual 50.

The standouts:

- **Brazen Head Irish Pub** runs a happy hour **all day, every day**: $6 shots, a $7 20 oz tap, $9 house wine and $13 margaritas. It adds a feature every weekday: Burger Monday ($17), Taco Tuesday ($6 a taco), Wingsday ($15 a pound) with Wine Down Wednesday, Thorogood Thursday, and Fish n’ Chip Friday ($18) with an $11 Guinness. Weekend brunch has $32 bottomless mimosas. Its menus are dated October 2026.
- **Fox and John’s** has the cheapest drinks in the village and the longest hours. Its happy hour runs Sun–Fri 2–5 PM and 9 PM to close, and Sat from 10 PM. It offers $5 Canadian or Coors Light, a $5.50 bar rail, $6.95 20 oz drafts, a $6 fish taco and 20% off shareables. There is also a special every day: half-price wings Monday, half-price wine bottles Tuesday and Wednesday, $13 tacos Thursday, and $16 for a pint and a pound of wings on Sunday.
- **LOCAL Public Eatery** (a chain) runs happy hour Mon–Fri 2–5 PM and every night from 9 or 11 PM. It has a $6 house lager, 51% off wine bottles and $5 chips and salsa.
- **NODO Liberty** has a weekday 2–5 PM aperitivo: $8 house wine, $10 mini cocktails, $10 snacks and $12 pizzettas. On Wednesdays from 5 PM, Seashells & Vino brings **$2 oysters** and half-price select wine bottles.
- **Liberty Soho** runs happy hour Sun–Thu 4–6 PM and 9 PM to close: $8 beers, $9 wine, $10 martinis, $12 spritzes, and $15 wings and shareables.
- Smaller ones: **Left Field Brewery** has half-price wings all day Monday. **KINTON RAMEN** has a $5.99 16 oz Sapporo Mon–Fri 2–6 PM, chain-wide at participating locations. **INJapan** has weekday lunch bentos at $14.95–$15.95, $2 off the regular price.

Some news on venues. **Liberty Commons at Big Rock Brewery closed on February 16, 2025** ([blogTO, Jan 2025](https://www.blogto.com/eat_drink/2025/01/liberty-commons-toronto-closing/)). **Something in the Water Brewing closed its Liberty Village taproom in July 2026**, and Ghost Taco inside it closed too ([blogTO, Jul 2026](https://www.blogto.com/eat_drink/2026/07/something-in-the-water-toronto-closed/); [inSauga](https://www.insauga.com/closure-local-brewery-and-taproom-has-closed-its-doors-in-toronto/)). **Wilbur’s Taco Shop**, the Wilbur Mexicana spin-off, opened at 50 Atlantic Ave in summer 2026 ([blogTO, Jun 2026](https://www.blogto.com/eat_drink/2026/06/wilbur-mexicana-toronto-liberty-village/); [inSauga, Jul 2026](https://www.insauga.com/4-restaurants-that-opened-in-toronto-in-july-2026/)).

Some sources could not be read. OpenTable timed out on every attempt. Instagram and Facebook can't be read. Longo’s Corks page answered "Access Denied", bb.q Chicken's site showed only a bot check, and Kibo's menu is a script-only app. "No deals found" means none appeared in any source that could be reached. It does not prove the spot has none.

## Method

- **Date:** every source was read or attempted on 2026-10-28.
- **Candidates:** `candidates.json`, re-swept on 2026-10-28 under the new rules: chains allowed, no fast food or takeout. It holds 36 candidates and 31 exclusions.
- **Order of checks:** each spot's own site (happy hour pages, menu HTML, PDFs and images), then booking pages (OpenTable, which timed out), then local guides (blogTO, Streets of Toronto, inSauga, Curiocity, the Liberty Village BIA), then a web search.
- **Missed-spot sweep:** an OpenStreetMap (Overpass) query covered every bar, pub, restaurant, brewery and fast-food node inside the area's bounds. Searches covered new openings and closures, the Liberty Market Building (171 E Liberty) and King St W between Dufferin and Strachan. The OSM street geometry puts Dufferin St at King at about −79.42736. That means 1200–1226 King St W (Pho Asia 21, Samosa Boulevard, Rebecca’s Lounge, Reina de México) are on the Parkdale side of Dufferin, outside the area.
- **Grading:** `venue` means the spot's own site, menu or calendar, current in 2025–2026. `reported` means a third party. Nothing here needed `reported`: every third-party claim found was either superseded by the venue's own page or too vague to keep (Table B).
- **Times:** 24-hour Toronto time. Prices are CAD before tax and tip, as printed.

## Table A: deals to load (in `deals.json`)

| Venue (address) | Status | Kind | Days | Times | Specials (CAD) | Confidence | Best source |
|---|---|---|---|---|---|---|---|
| Brazen Head Irish Pub (165 E Liberty St) | Open | All-day happy hour | Daily | Open to close | Shots (1 oz) $6; daily tap 20 oz $7 / 32 oz $13 (not Irish pours); house wine 6 oz $9; classic or spicy margarita (2 oz) $13 | High | [Happy hour & lunch PDF, Oct 13, 2026](https://fabrestaurants.b-cdn.net/wp-content/uploads/2021/02/BRZN_TT_5x7_HAPPY-HOUR-LunchFeatures_1013-2026WEB.pdf) |
| Brazen Head | Open | Lunch feature | Mon–Fri | 11:30–15:00 | Taco duo $12; smash burger & fries $15; Liberty bowl $16 | High | Same PDF |
| Brazen Head | Open | Daily features | Mon / Tue / Wed / Fri | All day | Burger Monday $17; Taco Tuesday $6 a taco; Wingsday 1 lb wings $15 (reg. $20.75); Fish n’ Chip Friday $18 | High | [Main menu PDF, Oct 6, 2026](https://fabrestaurants.b-cdn.net/wp-content/uploads/2021/02/BRZN-CORE-Menu-8-5x14-1006-2026WEB.pdf) |
| Brazen Head | Open | Drink nights | Wed / Thu / Fri | All day | Wine Down Wednesday: 6 oz wine $9, $10 off bottles. Thorogood Thursday: Signal Hill whisky + Scotch + 18 oz beer $15. Thank Guinness It’s Friday: Guinness $11 (18 oz on the happy hour card, 20 oz on the main menu) | High | [Happy hour PDF](https://fabrestaurants.b-cdn.net/wp-content/uploads/2021/02/BRZN_TT_5x7_HAPPY-HOUR-LunchFeatures_1013-2026WEB.pdf) |
| Brazen Head | Open | Brunch | Sat–Sun | 10:30–15:00 | Bottomless mimosas $32 a guest (1.5-hour table limit) | High | [Brunch PDF, Oct 6, 2026](https://fabrestaurants.b-cdn.net/wp-content/uploads/2021/02/BRZN-BRUNCH-8-5x14MENU-1006-2026WEB.pdf); [Brazen Head](https://fabrestaurants.ca/restaurant/brazen-head/) |
| Fox and John’s Restaurant + Bar (107 Atlantic Ave) | Open (opened in the former Craft Brasserie space) | Happy hour | Sun–Fri | 14:00–17:00 and 21:00–close (1 AM; 2 AM Thu–Fri) | Canadian or Coors Light bottle $5; bar rail $5.50; Kawartha draft $6.50; 20 oz 3 Speed, Canadian or Coors Light $6.95; Guinness $9.50; 6 oz wine $9; margarita or Aperol spritz $9; espresso martini $10; perogies $5.50; fish taco $6; dumplings $7.50; mini nachos, truffle fries or quesadilla $9; sliders $10; 20% off starters and shareables. Restrictions on game and event days | High | [Happy hour images (uploaded Apr 24, 2026)](https://www.foxandjohnspub.com/happy-hour-liberty) |
| Fox and John’s | Open | Happy hour | Sat | 22:00–close (2 AM) | Same list | High | Same |
| Fox and John’s | Open | Daily specials (dine-in, this location only) | Mon–Fri, Sun | All day | Mon: half-price wings, F&J lager $6.95. Tue: F&J burger $16.95, F&J lager $6.95, half-price wine bottles. Wed: 8 oz NY steak $25, half-price wine bottles, Great Lakes Octopus IPA $8.75. Thu: tacos $13, lime margarita $10, tequila shot $6, Corona $6. Fri: fish & chips $19, espresso martini $13, Creemore $8.75. Sun: pot roast $23, Caesar or mimosa $7, pint + 1 lb wings $16, pitcher + 2 lb wings $36 | High | [Liberty specials images (uploaded Aug 27, 2026)](https://www.foxandjohnspub.com/liberty-menu) |
| LOCAL Public Eatery (171 E Liberty St, Unit 100) (chain) | Open | Happy hour | Mon–Fri | 14:00–17:00 | LPE house lager 0.35 L $6; domestic draft 0.35 L $6.50; espresso mar-tiny $7; Start Me Up $10.25; Hugo spritz $11; Old Smoky $14; $2 off wine by the glass; 51% off wine bottles; $3 off margaritas and martinis; chips & salsa $5; chips, dips & crudités $14; hot wings $16; fish tacos $17.75; poké bowl $19.75; nachos $24.50; $5 off steaks. May differ on statutory holidays | High | [LOCAL Liberty Village menu](https://localpubliceatery.com/neighbourhoods/liberty-village/menu/), ©2026 |
| LOCAL Public Eatery | Open | Late happy hour | Sun–Thu | 21:00–close (1 AM) | Same list | Medium-high: the menu says Sun–Thu 9 PM to close, but the location page's day-by-day schedule starts Thursday's at 10 PM | [Menu](https://localpubliceatery.com/neighbourhoods/liberty-village/menu/); [location page](https://localpubliceatery.com/neighbourhoods/liberty-village/) |
| LOCAL Public Eatery | Open | Late happy hour | Fri–Sat | 23:00–close (2 AM) | Same list | High | Same |
| LOCAL Public Eatery | Open | Saturday drinks | Sat | 10:00–14:00 | Drinks only (the drink list above) | Medium: on the location page, not on the menu | [Location page](https://localpubliceatery.com/neighbourhoods/liberty-village/) |
| NODO Liberty (120 Lynn Williams St) | Open | Aperitivo hour | Mon–Fri (not game days, holidays or special events) | 14:00–17:00 | Bottled beer $7–$8; house wine $8; Heineken or Asahi draft $9; Peroni draft $10; mini cocktails $10; snacks $10; pizzettas, meatballs or ricotta crostone $12 | High | [NODO Liberty aperitivo menu](https://www.nodoliberty.ca/menu?location=Lynn+Williams+Street&menu=aperitivo) |
| NODO Liberty | Open | Seashells & Vino | Wed | 17:00–close (21:00) | $2 oysters; half-price select wine bottles | High | [nodoliberty.ca](https://www.nodoliberty.ca/) |
| Liberty Soho (139 E Liberty St) | Open | Happy hour | Sun–Thu | 16:00–18:00 and 21:00–close (24:00) | Liberty lager, Ace Hill or Blanche de Chambly $8; Mill Street Organic or Cottage Springs $9; Stella $10; wine $9; martinis $10; spritzes $12; chips & guac $10; wings $15; poutine, nachos, sliders, spinach dip or Caesar $15 | High (times from the site menu; image file dated 11-08-25) | [Liberty Soho happy hour](https://www.liberty-soho.com/happy-hour); [homepage menu](https://www.liberty-soho.com/) |
| Left Field Brewery (40 Hanna Ave) | Open | Daily special | Mon | All day | Half-price wings ("restrictions apply") | High (weekly series on the venue's calendar, added Aug 2026) | [Left Field Liberty Village calendar](https://www.leftfieldbrewery.ca/events/liberty-village-calendar) |
| KINTON RAMEN Liberty Village (153 Liberty St) (chain) | Open | Happy hour, dine-in | Mon–Fri | 14:00–18:00 | 16 oz Sapporo draft $5.99; 20% off select sides; free Coca-Cola drink with a pork donburi | Medium-high: chain-wide at "participating locations" (only Victoria Downtown is named as out) | [KINTON happy hour](https://kintonramen.com/happy-hour/), updated Jul 17, 2026 |
| INJapan (124 Atlantic Ave) | Open (closed Sun) | Lunch daily specials | Mon–Fri (not holidays) | 11:30–15:30 | Mon sushi, Tue salmon teriyaki, Wed bulgogi, Thu chicken teriyaki bento $14.95 (reg. $16.95); Fri sashimi bento $15.95 (reg. $17.95); any 2 maki with miso $13.95 | High | [injapan.ca](https://www.injapan.ca/), ©2026 |

## Table B: weak or undated claims (held back)

| Venue | Claim | Why it's held back | Source |
|---|---|---|---|
| Black Sheep (165 E Liberty St, 3rd floor) | "Happy hour specials Monday to Friday", with no times or prices | A search summary attributed this to a Liberty Village BIA listing, but the page couldn't be found. Black Sheep opens only Wed–Sat from 5 PM per Google, and its own May and October 2026 menus list no deals. An Instagram caption ("Rolling into happy hour…") is cut off and can't be read | [Black Sheep menus](https://fabrestaurants.ca/menus/?loc=black-sheep) |
| Wilbur’s Taco Shop (50 Atlantic Ave) | Its Toast ordering menu has "Happy Hour Price Per Ounce" items at $1 | No days, times or published happy hour; it's a till entry, not an offer | [wilburstacoshop.com](http://wilburstacoshop.com/) |
| Liberty Soho | Mon–Fri 3–7 PM, "$10 eats, $7 beers, $2 off cocktails" | Undated roundups, superseded by the venue's own Sun–Thu 4–6 PM and 9 PM–close menu | [Curiocity](https://curiocity.com/happy-hour-deals-toronto/); [Streets of Toronto](https://streetsoftoronto.com/the-10-best-restaurants-in-liberty-village-ranked/) |
| Chiang Mai Liberty | "Ask your server what local specials we have on tap" | Not a price or a time | [Chiang Mai menu](https://www.chiangmai.ca/menu) |
| Thai Barn Na | 10% off pickup orders paid in cash | Takeout only, not a dine-in deal | [thaibarnna.ca](https://www.thaibarnna.ca/) |
| Liberty Commons (42 Liberty St) | Weekday 2–5 PM and 9 PM–close drink deals | Closed February 2025 | [libertycommons.ca/news](https://www.libertycommons.ca/news/); [blogTO](https://www.blogto.com/eat_drink/2025/01/liberty-commons-toronto-closing/) |

## Table C: checked, no deals found (in `directory.json`, best first)

| Venue (address) | Status | What was checked | Source |
|---|---|---|---|
| Chiang Mai Liberty (171 E Liberty St, #144) | Open daily 11:00–23:00 | Full menu and location page; no happy hour; a web search found none | [chiangmai.ca](https://www.chiangmai.ca/locations/liberty-village) |
| Mildred’s Temple Kitchen (85 Hanna Ave, #104) | Open daily, daytime only (Mon–Fri 10–3, Sat–Sun 9–3) | Brunch and B’lunch menus (May 2025) | [mildreds.ca](https://mildreds.ca/pages/mildreds-menus) |
| Black Sheep (165 E Liberty St, 3rd floor) | Open Wed–Sat from 17:00 | Food, drinks and game-day menus (May and Oct 2026); see Table B | [FAB menus](https://fabrestaurants.ca/menus/?loc=black-sheep) |
| Kibo Sushi House (171 E Liberty St, #146) | Open | The menu is a script-only app that couldn't be read; the location list and a web search found no happy hour | [kibosushi.com](https://kibosushi.com/location/) |
| Paris Steak (120 Atlantic Ave) | Open | Food and drinks menus, March 2026 PDFs; a web search | [parissteak.ca](http://www.parissteak.ca/) |
| Wilbur’s Taco Shop (50 Atlantic Ave) | Opened summer 2026 | Ordering menu (see Table B); press | [blogTO, Jun 2026](https://www.blogto.com/eat_drink/2026/06/wilbur-mexicana-toronto-liberty-village/) |
| Thai Barn Na (127 Jefferson Ave) | Open | Site; only a takeout discount | [thaibarnna.ca](https://www.thaibarnna.ca/) |
| Caffino (1185 King St W) | Open Tue–Sat | Site and menu page; a web search | [caffino.ca](http://caffino.ca/menu/) |
| SCHOOL (70 Fraser Ave) | Open daily 9 or 10 AM–4 PM | Drinks, lunch and brunch pages | [schooltoronto.com](https://www.schooltoronto.com/drinks-menu) |
| OEB Breakfast Co. (125 E Liberty St) (chain) | Open, daytime | Location page and menu | [eatoeb.com](https://eatoeb.com/locations/toronto-libertyvillage/) |
| bb.q Chicken (49 E Liberty St, Unit 3) (chain) | Open 15:00–01:00 per Google | The site showed only a bot check; a web search found nothing | [bbqchickenca.com](https://bbqchickenca.com/) |
| Merci Mon Ami (171 E Liberty St) | Open Mon–Sat, daytime | Site; a lunch bistro with 22 seats, a patio and wine and beer | [mercimonami.ca](http://www.mercimonami.ca/) |
| Corks Beer & Wine Bar (1100 King St W, in Longo’s) | Open weekdays per Google | Longo’s page answered "Access Denied"; the blogTO patio guide lists it | [blogTO patios](https://patios.blogto.com/patio/corks-beer-wine-bar-toronto/) |

## Table D: left out

| Spot | Reason | Source |
|---|---|---|
| NRG Haus (171 E Liberty St, #113) | Sauna and wellness club | candidates.json |
| Pi Co (61 Hanna Ave) | Build-your-own pizza counter (fast casual) | [pi-co.ca](http://www.pi-co.ca/) |
| WingsUp! (167 E Liberty St) | Takeout and delivery wing franchise; no alcohol | [wingsup.com](https://wingsup.com/) |
| Sundays Pasta Lab (171 E Liberty St, #125) | Build-your-own pasta counter; no drinks on the menu | [sundayspastalab.ca](https://www.sundayspastalab.ca/menu) |
| Mad Radish (171 E Liberty St, #147) | Fast-casual salads; no alcohol per Google | candidates.json |
| Liberty Village Market & Cafe (65 Jefferson Ave) | Grocery store with a café counter | [blogTO](https://blogto.com/cafes/libertyvillagemarketandcafe) |
| Mozy’s (114 Atlantic Ave) | Fast food (chicken); no alcohol per Google | candidates.json |
| Maurya East Indian Roti (150 E Liberty St) | Counter-service roti shop. OSM tags it fast food, and the online menu lists no drinks, although Google says beer and wine | [Maurya menu](https://mauryaeastindianroti.aiorders.io/menu) |
| Tacos Moras and PAI (1108 King St W) | Stalls in the Kitchen Hub food hall at Longo’s | candidates.json |
| Little House of Deli (159 Liberty St) | Deli, daytime; no alcohol | candidates.json |
| Burgers n’ Fries Forever (49 E Liberty St) | Fast food; no alcohol | candidates.json |
| The Bull Pit Bar & Grill (122 Atlantic Ave) | Not open yet: the Bull BBQ Pit site lists Liberty as "Coming Soon", and Google shows no reviews or hours. Insieme, which the BIA listed at this address in 2025, is gone | [thebullbbqpit.ca](https://thebullbbqpit.ca/); [Liberty Village BIA](https://www.libertyvillagebia.com/love-liberty/whats-new-in-liberty) |
| Pho Asia 21 (1208 King St W), Samosa Boulevard (1210 King St W) | West of Dufferin, so outside the area. Neither shows alcohol: Pho Asia 21's 2025 menu has no drinks list, and Samosa Boulevard's site is a "coming soon" page | [Pho Asia 21 menu](https://phoasia21.com/menu/) |
| Reina de México (1226 King St W), Rebecca’s Lounge (1212 King St W) | West of Dufferin (Parkdale). Not on Google; found via OSM | [The Infatuation](https://www.theinfatuation.com/toronto/reviews/reina-de-mexico) |
| Something in the Water Brewing (151 E Liberty St) and Ghost Taco | Closed July 2026 | [blogTO](https://www.blogto.com/eat_drink/2026/07/something-in-the-water-toronto-closed/) |
| Liberty Commons at Big Rock Brewery (42 Liberty St) | Closed Feb 16, 2025 | [blogTO](https://www.blogto.com/eat_drink/2025/01/liberty-commons-toronto-closing/) |
| The Craft Brasserie (107 Atlantic Ave) | Closed January 2025; Fox and John’s is there now | [blogTO](https://www.blogto.com/eat_drink/2025/01/craft-brasserie-toronto-closing) |
| King Rustic (905 King St W) | Closed per blogTO; kingrustic.ca is dead | [blogTO](https://www.blogto.com/restaurants/king-rustic-toronto) |
| Barcelona Tavern (Atlantic Ave) | Closed November 2020 (still in OSM) | [blogTO](https://www.blogto.com/eat_drink/2020/11/barcelona-tavern-toronto-shuts-down) |
| Thindi Café (153 E Liberty St) | Vegetarian Indian snack café; no alcohol found | [blogTO, Jun 2025](https://www.blogto.com/eat_drink/2025/06/thindi-cafe-second-location-toronto) |
| Toro Toro (72 Ordnance St) | East of Strachan; a sushi-box shop | [blogTO, Sep 2026](https://www.blogto.com/eat_drink/2026/09/toro-toro-sushi-toronto-liberty-village/) |
| "Joker" (OSM pub near the rail line, 43.6358, −79.4259) | No website, listing or review found; can't confirm it exists | — |
| 50 Liberty St | Under construction; a forum post guesses a bar with a patio | [UrbanToronto, Feb 2026](https://urbantoronto.ca/forum/goto/post?id=2072936) |
| Already out in the sweep (31) | Fast food, takeout or delivery, cafés, salad and sandwich shops, a caterer, no alcohol per Google, or outside the area (Aloette Go is a takeout window; Kitchen Hub is a food hall) | `candidates.json` → `excluded` |

## Chains not in `src/data/chains.ts`

These chains came up here and aren't in `chains.ts` (not edited, as instructed). OEB Breakfast Co. (a Calgary chain with locations across Canada), bb.q Chicken (global Korean chicken chain), WingsUp! (38 locations), Panago, Bento Sushi, Firehouse Subs, Booster Juice and Fat Bastard Burrito. Mad Radish and Kibo Sushi House are borderline (several GTA locations each). Corks is a Longo’s in-store bar (Longo’s is majority-owned by Empire, the company behind Sobeys). KINTON RAMEN and LOCAL Public Eatery are already listed.

## Notes for the app

- Brazen Head's happy hour is all day, every day, so it's stored as a daily special, not a timed window. It will match every "right now" query while the pub is open, like the Haifa Room's arak in Ossington.
- Fox and John’s, NODO and LOCAL all exclude game or event days or holidays. With BMO Field, the Coca-Cola Coliseum and Budweiser Stage next door, that matters here. The notes say so.
- Next checks: Black Sheep's happy hour (Instagram or a call, 416-535-8787); Corks' hours and specials (Longo’s); the Bull Pit's opening; and what opens at 42 and 50 Liberty St.
