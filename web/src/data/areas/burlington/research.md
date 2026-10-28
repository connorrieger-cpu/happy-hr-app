# Burlington: 41 spots publish deals, and downtown’s happy hours run from 2 to 6 pm

**Update, October 28, 2026: Oakville to Third Line, and Halton Crown.** The area now runs east past Burloak to Third Line in Oakville (Bronte, West Oak Trails, Palermo), and lists Halton Crown Pub and Grill, which the first pass cut. That added 21 spots, 12 with deals, for **115 spots, 53 with deals**. See [Oakville to Third Line](#oakville-to-third-line-and-halton-crown) at the end.

On Wednesday, October 28, 2026, 158 Burlington spots were checked for happy hours and daily specials: 156 of the 233 Google Places candidates that passed the listing rules, plus two sit-down bars Google’s sweep missed (400 Brant Kitchen & Bar and Emma’s Back Porch). **41 spots publish current deals on their own sites, menus or location pages**, all graded `venue`; nothing rests on a third-party guide alone. The area lists **94 spots**: the 41 with deals (`deals.json`) and 53 of the best of the rest (`directory.json`), weighted to downtown and to well-loved pubs.

**Downtown has the densest run of afternoon deals in the city**, almost all between 2 and 6 pm: 400 Brant (daily 2–4 pm, $14 shareables and $6 rail), Pepperwood (weekdays 2:30–5 pm, $6.25 pints and house wine), radius (3–5 pm, $15 plates and cocktails), Spencer’s Cocktail Hour (weekdays 3:30–5:30 pm), and **Prime Steak + Raw Bar** and **Isabelle**, both 4–6 pm with oysters at $2 and $2.50. The Dickens, Blk Swan, Joe Dog’s, The Martini House and Bardō add a deal for nearly every night of the week.

**The five best deals:**

1. **St. Louis Bar & Grill (Appleby Line and Walkers Line):** $4 sliders, fries, 12 oz draught, 5 oz house wine and rail drinks, every day from open to 5 pm and 9 pm to close; half-price wings Tuesdays from 5 pm ([St. Louis happy hour](https://www.stlouiswings.com/happyhour2025/), Aug 2026; [deals](https://www.stlouiswings.com/deals/)).
2. **Prime Steak + Raw Bar (390 Brant St):** daily 4–6 pm, $2 oysters, nigiri from $2.50, $8 draught pints, an 8 oz pour for the 5 oz price and half-price bottles ([Prime happy hour](https://primesteakandrawbar.ca/happy-hour/)).
3. **Squires Gastro Pub (3537 Fairview St):** $5 20 oz pints, $6 wine and $20 wings-and-a-pint every day 3–5 pm and Sun–Thu 9–11 pm; 99¢ wings Wednesdays ([Squires specials](https://www.squires.pub/specials)).
4. **Barra Fion (1505 Guelph Line):** every day 2–5 pm, 25% off tapas, $5 select pints and rail, $8 house wine, sangria and mules; half-price bottles Thursdays ([Barra Fion specials](https://www.barrafion.ca/specials)).
5. **The Tipsy Fox (1250 Brant St):** a deal every day, from 90¢ wings and $15 domestic pitchers on Mondays to $5 tacos and $5 tequila on Tuesdays and half-price wings on Wednesdays ([drink specials](https://tipsyfoxpub.com/wp-content/uploads/2026/10/Specials01-768x768.jpeg), [food specials](https://tipsyfoxpub.com/wp-content/uploads/2026/10/Specials02-768x768.jpeg), Oct 2026).

Close behind: Earls (half-price cocktails and wine daily 3–6 pm and 9 pm–close, lounge and patio), Milestones ($5 highballs, bellinis and Budweiser, 3–6 pm and 9 pm–close), Jack Astor’s ($6 wine, PBR and cocktails, 2–5 pm and 9 pm–close, half-price bottles Mon–Tue), and the 89¢ wing nights at The Black Bull (Wednesday) and Uptown Social House (Tuesday).

**What couldn’t be read.** Instagram and Facebook couldn’t be read, and many local pubs post their specials only there (The Poacher, The North Coal and Culaccino point to them). Bot checks blocked automated reading of Kelseys, Montana’s, East Side Mario’s and Swiss Chalet (all Recipe sites), Red Lobster, Jacksons Landing, Beertown, Social 99, Piper Arms, The Lone Wolf, Halton Crown and Prince of India; these were not worked around. OpenTable and BurlingtonToday’s directory pages didn’t load, and web search mostly returns Burlington, Vermont. “No deals found” therefore means none appeared in any source that could be reached, not that a spot has none.

## Method

- **Candidates.** `candidates.json` (Google Places sweep, October 28, 2026) lists 233 places. 77 were left out under the listing rules (Table D): fast food and takeout counters (A&W, Taco Bell, Pizza Hut, barBURRITO, Mucho Burrito, Dave’s Hot Chicken and others), grocery-store sushi counters, cafés, places that don’t serve alcohol, and non-restaurants Google filed with them (furniture stores, a church, a farm, a barber, a nail salon, golf courses). Chains were kept and researched like any other spot.
- **Order of checking.** For each remaining spot: its own site (home page, happy hour, specials, events and drinks pages, PDF and image menus), then the chain’s location page for chains, then local sources (the Burlington Downtown business association’s directory, Tourism Burlington, BurlingtonToday, Hamilton City Magazine, Yelp lists) and web searches. Downtown (Brant St and the waterfront) was done first, then Aldershot and Plains Rd, Brant Hills, Fairview and the South Service Rd, Uptown and Millcroft, Appleby, Alton and Burloak.
- **Images.** Several venues publish specials only as images (The Tipsy Fox, The Martini House, Barra Fion, Gator Ted’s, Jersey’s, Chuck’s Roadhouse, Jack Astor’s, St. Louis). Each image was opened and read directly; dates come from the upload path or file name where there is one (for example `/uploads/2026/10/`).
- **Missed by the sweep.** 400 Brant Kitchen & Bar is in `excluded` as “no dine-in, per Google”, but it is a sit-down restaurant and bar in the old Queen’s Head building ([BDBA directory](https://burlingtondowntown.ca/business-directory/400-brant-kitchen-bar/)). Emma’s Back Porch (2084 Old Lakeshore Rd), a well-known waterfront patio bar, isn’t in the sweep at all. Both are listed with an address and coordinates (from OpenStreetMap) instead of a place id. The BDBA’s 71 downtown restaurant listings were all checked against the candidates; no other qualifying downtown bar was missing.
- **Grading.** `venue` means the venue’s or chain’s own site, menu or location page, current in 2025–2026. Chain-wide offers (Turtle Jack’s happy-hour menu, St. Louis, Chuck’s Roadhouse, Wild Wing, Montfort) are graded `venue` because they come from the chain’s own site and, where it has one, the Burlington location page lists the deal; the report notes “at participating locations”. Set menus at regular value (Rust’s $100 date night, Lot 88’s Sip & Sear and Table for Two, GameTime’s date night, Spencer’s $70 Sunday prime rib) are not counted as deals.
- **Times** are 24-hour Toronto time; “close” windows use each day’s Google closing time. Prices are CAD before tax and tip, as printed.
- `venues.json` was not rebuilt here; run `npm run areas` from `web/`. A dry run of `mergeArea` on these files gives 94 venues, 41 with deals.

## Conflicts and caveats worth knowing

- **radius** publishes one site for its Hamilton (Hess St) and Burlington (Brant St) rooms. The daily 3–5 pm happy-hour PDF (fall 2026) names no room, and neither does the weekly lineup ($6 spritzes and craft beer Tuesdays, 50% off select wine Wednesdays, $12 martinis Thursdays). The Friday–Saturday late-night happy hour with a DJ is left out because it may be Hamilton only ([radius](https://radius.ca/)).
- **The Port House** says “Happy hour runs from 3pm to 6pm” in its FAQ, but opens at 4 pm Mon–Wed, so those days are stored as 4–6 pm; its happy-hour menu page loads in the browser only, so prices aren’t published ([The Port House Burlington](https://theporthouse.ca/location/burlington)).
- **Uptown Social House**: the specials page gives the $25 and $20 beer buckets as Sun–Fri 12–5 pm; the home page says Mon–Fri. Mon–Fri is stored ([home](https://uptownsocialhouse.ca/), [specials](https://uptownsocialhouse.ca/daily-specials-1)).
- **Squires**: the specials page header says late night is “Thur–Sun”, but its own text and the menu both say Sun–Thu 9–11 pm, which is stored.
- **The Black Bull**: the home page and menu list Monday–Tuesday $10 apps and $6 20 oz draught (12–4 pm), $10.99 liver and onions and $12.99 fish and chips; the older specials page shows lower prices ($9.99, $11.99). The home page is used ([Black Bull](https://blackbull.ca/)).
- **The Mule** links its “Weekly Specials” to The Mule London’s page, and a BurlingtonToday listing (undated, seen only in a search result) gives a Sun–Thu 3–5 pm happy hour. Held back (Table B).
- **Prices not published**: The Keg (bar and lounge happy hour, open–6 pm weekdays, open–5 pm weekends, 9 pm–close), Scaddabush (Mon–Fri 2–5 pm), Shooterville (daily 4–6 pm, prices in an image that wouldn’t load), Mythos (daily 2–5 pm) and The Port House are stored with times and no prices.
- **Bardō**’s Tuesday $13 pizza and $8 pints is marked “limited time only, with the purchase of any beverage”.
- **Spencer’s** lists Shuck Wednesday as “half-price oysters and bubbly, $30”; what the $30 covers isn’t stated.

## Table A: deals to load (41 spots)

| Venue (address) | Area | Happy hours | Day specials | Grade | Sources |
|---|---|---|---|---|---|
| Bardō (419 Brant St) | Downtown | — | **Tue** Pizza + Pints: personal pizzas $13, pints $8 (With any drink; a limited-time offer)<br>**Wed** Wine Wednesday (11:00+): half-price bottles of wine (11 am to close) | Venue | [Bardō Brant St Burlington page](https://bardorestaurants.ca/brant-st-burlington/) (2026-10) |
| Prime Steak + Raw Bar (390 Brant St) | Downtown | **Daily 16:00–18:00**: oysters $2, yellowfin nigiri or sashimi $2.50, truffle fries $10, cocktails $12, draught pints $8, 8 oz wine for the price of 5 oz, half-price bottles of wine (Dine-in only; half-price bottles are those listed at $100 or less) | — | Venue | [Prime happy hour page](https://primesteakandrawbar.ca/happy-hour/) (2026-10) |
| radius on Brant (455 Brant St) | Downtown | **Tue–Sun 15:00–17:00**: small plates $15, cocktails $15, 9 oz wine for the price of 6 oz (One happy-hour menu for radius’s Hamilton and Burlington rooms; Brant St is closed Mondays) | **Tue** Spritz + Craft Tuesdays: spritzes $6, craft beers $6 (From radius’s weekly lineup, which doesn’t say which room)<br>**Wed** Wine Wednesday: 50% off select wine (From radius’s weekly lineup, which doesn’t say which room)<br>**Thu** Melody + Martini Thursdays: martinis $12 (From radius’s weekly lineup, which doesn’t say which room) | Venue | [radius happy hour menu (fall 2026 PDF)](https://radius.ca/wp-content/uploads/2026/10/Radius-Happy-Hour-Menu-FALL-2026V2.pdf) (2026-10); [radius weekly lineup](https://radius.ca/) (2026-10) |
| Blk Swan Kitchen Hub (380 Brant St) | Downtown | **Tue–Sat 11:30–18:00**: Bud or Bud Light pints $7.99 | **Daily** House pints: Swan Lager or BD Currency pints $6.49 (Every day)<br>**Mon, Tue** Wing O Mania (15:00+): half-price wings (After 3 pm; dine-in with a drink)<br>**Mon, Sun**: $2 off tall cans<br>**Wed** Pub grub Wednesday: pub grub $17.99, 9 oz wine for the price of 6 oz (Trivia at 7:45 pm)<br>**Thu**: $5 off any pasta, half-price bottles of wine, martinis $9<br>**Fri** Fish Friday (15:00+): fish and chips $16.99 (After 3 pm)<br>**Sat, Sun**: Caesars $6.99 | Venue | [Blk Swan Downtown daily specials](https://blkswan.ca/downtownburlingtonhub/dailies.html) (2026-10) |
| Pepperwood Bistro (1455 Lakeshore Rd.) | Downtown | **Mon–Fri 14:30–17:00**: appetizers $11, draft pints $6.25, house wine $6.25, bar rail $5.25 (Orders placed 2:30–5 pm) | — | Venue | [Pepperwood happy hour page](https://pepperwood.on.ca/happy-hour/) (2026-10) |
| The Martini House (437 Elizabeth St) | Downtown | — | **Mon** Mangia Monday: pizzas $15, pastas $20 (All night)<br>**Tue** Tuesday Tapas: half-price tapas (All night)<br>**Wed** Date Night Wednesday: half-price wine (All night) | Venue | [The Martini House promotions page](https://www.martinihouse.ca/what-s-happening-promotions) (2026-10) |
| The Dickens (423 Elizabeth St) | Downtown | **Mon–Fri 12:00–17:00**: Social Lager $5, Budweiser or Bud Light $6, house spirits $6, 6 oz Jackson-Triggs wine $6 (Open to 5 pm) | **Mon** Industry Night (21:00–02:00 (next day)): rail, Jäger, Jameson and El Jimador $6, Budweiser or Bud Light $6, 6 oz house wine $6 (After 9 pm)<br>**Mon** Burger Monday: original burger $13 (Dine-in with a drink)<br>**Tue** Half-price wing Tuesday: wings, half price $9.50 (Dine-in with a drink; trivia at 8 pm)<br>**Wed** Appy Ending Wednesday: 25% off appetizers (Dine-in with a drink)<br>**Fri** Fish Friday: one-piece haddock $14, two-piece haddock $20 (Dine-in with a drink)<br>**Sun** Sunday Roast: roast beef and Yorkshire pudding $21 (Dine-in with a drink) | Venue | [The Dickens daily features](https://thedickens.ca/daily-features.html) (2026-10); [The Dickens home page (events)](https://thedickens.ca/) (2026-10) |
| The Port House (2020 Lakeshore Rd.) | Downtown | **Thu–Sun 15:00–18:00**: prices not published (Prices aren’t published)<br>**Mon–Wed 16:00–18:00**: prices not published (Happy hour is 3–6 pm, but it opens at 4 pm Mon–Wed; prices aren’t published) | — | Venue | [The Port House Burlington page (FAQ)](https://theporthouse.ca/location/burlington) (2026-10) |
| Joe Dog’s Gasbar Grill (531 Brant St) | Downtown | — | **Wed** Wing Night: buy-one-get-one wings | Venue | [Joe Dog’s Burlington page](https://joedogs.com/burlington/) (2026-10) |
| Isabelle (3 Elizabeth St) | Downtown | **Mon–Fri 16:00–18:00**: oysters $2.50, cocktails $10, glasses of wine $10, beers $8, bottles of house wine $45 | — | Venue | [Isabelle happy hour menu](https://isabelle.ca/menu/happy-hour/) (2026-10) |
| Spencer’s at the Waterfront (1340 Lakeshore Rd.) | Downtown | **Mon–Fri 15:30–17:30**: highballs $7.50, margaritas or Moscow mules $10, 5 oz Cave Spring wine $10, draught pints $10, sangria $16 (Cocktail Hour) | **Tue** Half-Price Wine Tuesdays (17:00+): half-price select bottles (From 5 pm)<br>**Wed** Shuck Wednesday (17:00+): half-price oysters, bubbly $30 (From 5 pm; Spencer’s lists “half-price oysters and bubbly, $30”)<br>**Sat, Sun** Weekend brunch (11:00–15:00): all-you-can-enjoy mimosas $30 (Per guest) | Venue | [Spencer’s Cocktail Hour menu](https://spencers.ca/menu/cocktail-hour/) (2026-10); [Spencer’s weekly offerings](https://spencers.ca/) (2026-10) |
| Montfort Mediterranean Grill (796 Brant St) | Brant St north | — | **Daily**: chicken shawarma pita and a 16 oz pint $16.99<br>**Wed** Souvlaki Wednesday: souvlaki special, from $16<br>**Sun** Sunday Mixed Grill: mixed grill for two $66, mixed grill for four $129 | Venue | [Montfort weekly specials](https://montfortrestaurant.ca/weekly-special) (2026-10) |
| Turtle Jack’s Mapleview (900 Maple Ave) | Mapleview | **Daily 14:00–17:00**: 18 oz Canadian or Coors Light $7, 5 oz house wine $6, margaritas $6, sweet potato fries $6, classic burger $15, Turtle wings $16<br>**Mon–Thu, Sat 20:00–22:00**: 18 oz Canadian or Coors Light $7, 5 oz house wine $6, margaritas $6 (8 pm to close)<br>**Fri 20:00–23:00**: 18 oz Canadian or Coors Light $7, 5 oz house wine $6, margaritas $6 (8 pm to close)<br>**Sun 20:00–21:00**: 18 oz Canadian or Coors Light $7, 5 oz house wine $6, margaritas $6 (8 pm to close) | **Tue** Fajita Tuesdays: chicken fajita special with free chips and salsa<br>**Wed** Half-price wine night: half-price bottles of wine | Venue | [Turtle Jack’s Mapleview page (happy hour times)](https://turtlejacks.com/locations/turtle-jacks-mapleview/) (2026-10); [Turtle Jack’s happy hour menu](https://turtlejacks.com/happy-hour/) (2026-10); [Turtle Jack’s features and specials](https://turtlejacks.com/features-and-specials/) (2026-10) |
| Earls Kitchen + Bar (900 Maple Ave Unit A25) | Mapleview | **Daily 15:00–18:00**: half-price cocktails and sangria, half-price house wine and select bottles, $3 off beer, truffle fries $7, Baja tacos $7, oysters $3.50, margherita pizza $16 (Lounge, bar and patio only)<br>**Daily 21:00–24:00**: half-price cocktails and sangria, half-price house wine and select bottles, $3 off beer, truffle fries $7, Baja tacos $7 (9 pm to close; lounge, bar and patio only)<br>**Sat, Sun 11:00–12:00**: brunch cocktails and mimosas $10, tiny espresso martinis or bellinis $7 (Brunch happy hour, weekends and holidays until noon) | — | Venue | [Earls Burlington page](https://earls.ca/locations/burlington/) (2026-10); [Earls Burlington menu (happy hour tab)](https://earls.ca/locations/burlington/menu/) (2026-10) |
| Shooterville Billiards Bar & Grill (1400 Plains Rd E #202) | Plains Rd | **Daily 16:00–18:00**: prices not published (Prices are in an image on Shooterville’s site that couldn’t be read; ask at the bar) | — | Venue | [Shooterville home page](https://shooterville.com/) (2026-10) |
| Scaddabush Italian Kitchen & Bar (2429 Fairview St) | Fairview | **Mon–Fri 14:00–17:00**: prices not published (Signature drinks and scratch-made pizzas; prices are on the location menu, not published as text) | **Wed** Wine Wednesday: half-price bottles of wine (All day) | Venue | [Scaddabush home page, Burlington selected](https://scaddabush.com/?locationId=850) (2026-10); [Scaddabush happy hour page](https://scaddabush.com/happy-hour/) (2026-10) |
| Milestones (1200 Brant St Unit 30) | Brant St north | **Daily 15:00–18:00**: highballs, bellinis or 14 oz Budweiser $5, garlic parmesan fries $5, tacos $6, 6 oz house wine $6, margaritas $8, martinis $10, half-price bottles of wine, any 3 happy-hour starters $39<br>**Sun 21:00–22:00**: highballs, bellinis or 14 oz Budweiser $5, garlic parmesan fries $5, tacos $6, 6 oz house wine $6, martinis $10 (9 pm to close)<br>**Mon–Thu 21:00–23:00**: highballs, bellinis or 14 oz Budweiser $5, garlic parmesan fries $5, tacos $6, 6 oz house wine $6, martinis $10 (9 pm to close)<br>**Fri, Sat 21:00–24:00**: highballs, bellinis or 14 oz Budweiser $5, garlic parmesan fries $5, tacos $6, 6 oz house wine $6, martinis $10 (9 pm to close) | — | Venue | [Milestones Brant Street menu (happy hour)](https://milestonesrestaurants.com/menus/brant-street/) (2026-10); [Milestones Brant Street page](https://milestonesrestaurants.com/locations/brant-street/) (2026-10) |
| The Tipsy Fox (1250 Brant St) | Brant St north | — | **Mon**: domestic pitchers $15, wings (min. 6) $0.90<br>**Tue** Taco Tuesday: tequila $5, tacos $5, 30% off appetizers<br>**Wed**: domestic tall cans $6, half-price wings<br>**Thu**: half-price bottles of wine, 20% off pasta<br>**Fri**: bar rail $5, ribs and wings $25<br>**Sat**: 50% off desserts<br>**Sun**: Caesars $8 | Venue; Dine-in only | [The Tipsy Fox daily specials (Oct 2026 images)](https://tipsyfoxpub.com/wp-content/uploads/2026/10/Specials01-768x768.jpeg) (2026-10); [The Tipsy Fox daily food specials](https://tipsyfoxpub.com/wp-content/uploads/2026/10/Specials02-768x768.jpeg) (2026-10) |
| The Keg Steakhouse + Bar (3130 S Service Rd) | South Service Rd | **Mon–Fri 16:00–18:00**: prices not published (Bar, lounge and patio; prices on the Keg’s happy-hour menu)<br>**Sun 16:00–17:00**: prices not published (Bar, lounge and patio; prices on the Keg’s happy-hour menu)<br>**Sat 15:00–17:00**: prices not published (Bar, lounge and patio; prices on the Keg’s happy-hour menu)<br>**Mon–Thu, Sun 21:00–22:00**: prices not published (9 pm to close; bar, lounge and patio)<br>**Fri, Sat 21:00–23:00**: prices not published (9 pm to close; bar, lounge and patio) | — | Venue | [The Keg Burlington page](https://thekeg.com/en/locations/burlington) (2026-10) |
| Wild Wing (3295 Fairview St Unit 9) | Fairview | — | **Mon** Michelob Monday: 20 oz Michelob $6.99<br>**Tue** Wing Tuesday: single orders of wings with fries $12, Corona bottles $5.99 (Dine-in with a drink)<br>**Wed** Wine Wednesday: 6 oz wine $6<br>**Thu**: 32 oz schooners $9<br>**Sun**: Caesars $5 | Venue; Chain-wide Ontario specials, “at participating restaurants” | [Wild Wing Ontario daily and drink specials](https://www.wildwingrestaurants.com/) (2026-10) |
| Jack Astor’s Bar & Grill (3140 S Service Rd) | South Service Rd | **Daily 14:00–17:00**: 5 oz house wine $6, 18 oz PBR $6, 18 oz Budweiser or Bud Light $7, classic cocktails $6, mixed drinks $6, PBR bucket of 4 $14.99<br>**Mon–Thu, Sun 21:00–22:00**: 5 oz house wine $6, 18 oz PBR $6, classic cocktails $6, mixed drinks $6 (9 pm to close)<br>**Fri, Sat 21:00–24:00**: 5 oz house wine $6, 18 oz PBR $6, classic cocktails $6, mixed drinks $6 (9 pm to close) | **Mon, Tue**: half-price bottles of wine (All day) | Venue | [Jack Astor’s home page, Burlington selected](https://jackastors.com/?locationId=907) (2026-10); [Jack Astor’s Ontario happy hour menu (PDF)](https://jackastors.com/wp-content/uploads/2026/05/JAE_ON_HH-BevMenu_0426_web.pdf) (2026-05) |
| The Black Bull (2475 Mountainside Dr) | Mountainside | **Mon, Tue 12:00–16:00**: appetizers $10, 20 oz draught or tall cans $6 (Large nachos excluded; with any drink) | **Wed** Wing Wednesday: wings (10 or more) $0.89 (Dine-in only)<br>**Tue**: liver and onions $10.99<br>**Thu**: one-piece fish and chips $12.99, shepherd’s pie $13.99<br>**Fri**: burger and fries $12.99<br>**Sun**: chicken dinner $16.99 | Venue; Weekly specials need a drink; the older specials page shows lower prices | [The Black Bull home page (weekly specials)](https://blackbull.ca/) (2026-10) |
| District Kitchen + Bar (335 Plains Rd E) | Aldershot | **Daily 11:00–17:00**: Social Lager $5, Budweiser or Bud Light $6, house spirits $6, 6 oz Jackson-Triggs wine $6 (Open to 5 pm)<br>**Mon–Thu, Sun 21:00–23:00**: Social Lager $5, Budweiser or Bud Light $6, house spirits $6, 6 oz Jackson-Triggs wine $6 (9 pm to close)<br>**Fri, Sat 21:00–24:00**: Social Lager $5, Budweiser or Bud Light $6, house spirits $6, 6 oz Jackson-Triggs wine $6 (9 pm to close) | **Mon** Burger Monday: original burger $13 (Dine-in with a drink)<br>**Tue** Half-price wing Tuesday: wings, half price $9.50 (Dine-in with a drink)<br>**Thu** Thirsty Thursday: 9 oz wine for the price of 6 oz, half-price bottles of wine, 25% off appetizers<br>**Fri** Fish Friday: one-piece haddock $14, one-piece halibut $20<br>**Sun** Sunday pizza (14:00+): pizzas $13 (2 pm to close)<br>**Sat, Sun** Bottomless mimosas (11:00–15:00): bottomless mimosas $29.95 (With an entrée; 90-minute limit) | Venue | [District features and happy hour page](https://districtkitchenandbar.ca/daily-features.html) (2026-10) |
| GameTime Social (3330 S Service Rd) | South Service Rd | — | **Mon** Margarita Monday: half-price margherita pizzas, half-price margaritas (All day)<br>**Wed**: half-price bottles of wine | Venue | [GameTime Social Burlington specials](https://www.gametimesocial.ca/specials-menu-burlington) (2026-10) |
| Mythos Greek Cuisine (3500 Fairview St) | Fairview | **Tue–Sun 14:00–17:00**: prices not published (Prices not published; closed Mondays) | — | Venue | [Mythos home page](https://www.mythoscuisine.com/) (2026-10) |
| Squires Gastro Pub (3537 Fairview St) | Fairview | **Daily 15:00–17:00**: 20 oz domestic pints $5, 6 oz house wine $6, cocktails $11, 1 lb wings and a pint $20, any 2 bar bites $22<br>**Mon–Thu, Sun 21:00–23:00**: 20 oz domestic pints $5, 6 oz house wine $6, cocktails $11, 1 lb wings and a pint $20 (Late night) | **Wed** Wing Wednesday: wings $0.99<br>**Thu**: half-price bottles of wine, pastas $19<br>**Fri** Friday Fish Fry: one-piece fish and chips $16.95, two-piece fish and chips $23.95<br>**Sun**: kids eat free with an adult entrée | Venue | [Squires specials page](https://www.squires.pub/specials) (2026-10); [Squires menu (happy hour and daily specials)](https://www.squires.pub/menu) (2026-10) |
| Uptown Social House (1900 Walkers Line) | Uptown | **Mon–Fri 12:00–17:00**: bucket of 5 bottles $25, bucket of 4 tall cans $20<br>**Mon–Fri 16:00–19:00**: half-price wine | **Mon** Wrap day: wraps $13<br>**Tue** Wing day: wings $0.89<br>**Wed** Burger day: burgers, from $13<br>**Thu** Taco Thursday: tacos $5, tequila shots $5, Sol or Dos Equis $5, margaritas $6 (Trivia at 7:30 pm)<br>**Sun**: fish and chips $13, Caesars or mimosas $6 | Venue; The specials page says the buckets run Sun–Fri; the home page says Mon–Fri | [Uptown Social House home page](https://uptownsocialhouse.ca/) (2026-10); [Uptown Social House daily specials](https://uptownsocialhouse.ca/daily-specials-1) (2026-10) |
| QB Sports Bar Grill Games (4460 Fairview St) | Appleby | — | **Tue** Burger combo (17:00+): burger, fries and a drink $26 (From 5 pm, with live trivia)<br>**Wed** Tacos and a drink: tacos and a drink $26<br>**Thu** Wing Thursday: 2 lb of wings $22<br>**Sun**: kids eat half price | Venue | [QB Sports daily specials](https://www.qbsports.ca/daily-specials) (2026-10) |
| Chuck’s Roadhouse Bar & Grill (1940 Appleby Line) | Millcroft | **Mon–Thu, Sun 21:00–24:00**: half-price appetizers (After 9 pm; dine-in with a drink)<br>**Fri, Sat 21:00–01:00 (next day)**: half-price appetizers (After 9 pm; dine-in with a drink) | **Wed** Rib Day: half rack of ribs $10, full rack of ribs $15, rib and wing combo $15 (Dine-in with a drink) | Venue; Chain-wide offers | [Chuck’s Roadhouse offers page](https://chucksroadhouse.com/offers/) (2026-10) |
| Hibachi Teppanyaki & Bar (1940 Appleby Line) | Millcroft | — | **Fri** Sake Friday: 5 oz hot house sake $5 | Venue | [Hibachi Burlington page](https://www.hibachiteppanyaki.com/locations/burlington) (2026-10) |
| Turtle Jack’s Appleby (1900 Appleby Line) | Millcroft | **Daily 14:00–17:00**: 18 oz Canadian or Coors Light $7, 5 oz house wine $6, margaritas $6, sweet potato fries $6, classic burger $15, Turtle wings $16<br>**Mon, Sun 20:00–22:00**: 18 oz Canadian or Coors Light $7, 5 oz house wine $6, margaritas $6 (8 pm to close)<br>**Tue–Thu 20:00–23:00**: 18 oz Canadian or Coors Light $7, 5 oz house wine $6, margaritas $6 (8 pm to close)<br>**Fri, Sat 20:00–24:00**: 18 oz Canadian or Coors Light $7, 5 oz house wine $6, margaritas $6 (8 pm to close) | **Tue** Fajita Tuesdays: chicken fajita special with free chips and salsa<br>**Wed** Half-price wine night: half-price bottles of wine | Venue; Happy-hour prices are the chain menu, “at participating locations” | [Turtle Jack’s Appleby page (happy hour times)](https://turtlejacks.com/locations/turtle-jacks-appleby-line/) (2026-10); [Turtle Jack’s happy hour menu](https://turtlejacks.com/happy-hour/) (2026-10); [Turtle Jack’s features and specials](https://turtlejacks.com/features-and-specials/) (2026-10) |
| Lot 88 Steakhouse & Bar (2020 Appleby Line) | Millcroft | — | **Wed** The Lot 88 Social: half-price appetizers (With any drink; dine-in only; oysters excluded)<br>**Thu** Cellar & Shore: oysters $2.25, half-price bottles of wine (Dine-in only)<br>**Sun** Sunday Prime Rib: prime rib, from $19.99 | Venue | [Lot 88 menu (Dining Rituals)](https://lot88steakhouse.ca/menu2/) (2026-10) |
| Montfort Mediterranean Grill (Appleby) (2000 Appleby Line g6) | Millcroft | — | **Daily**: chicken shawarma pita and a 16 oz pint $16.99<br>**Wed** Souvlaki Wednesday: souvlaki special, from $16<br>**Sun** Sunday Mixed Grill: mixed grill for two $66, mixed grill for four $129 | Venue | [Montfort weekly specials](https://montfortrestaurant.ca/weekly-special) (2026-10) |
| Montfort Mediterranean Grill (Burloak) (728 Burloak Dr) | Burloak | — | **Daily**: chicken shawarma pita and a 16 oz pint $16.99<br>**Wed** Souvlaki Wednesday: souvlaki special, from $16<br>**Sun** Sunday Mixed Grill: mixed grill for two $66, mixed grill for four $129 | Venue | [Montfort weekly specials](https://montfortrestaurant.ca/weekly-special) (2026-10) |
| Blk Swan Kitchen Hub North (4040 Palladium Wy) | Alton | **Tue–Sat 11:30–18:00**: Bud or Bud Light pints $7.99 | **Daily** House pints: Swan Lager or BD Currency pints $6.49 (Every day)<br>**Mon, Tue** Wing O Mania (15:00+): half-price wings (After 3 pm; dine-in with a drink)<br>**Mon, Sun**: $2 off tall cans<br>**Wed** Pub grub Wednesday: pub grub $17.99, 9 oz wine for the price of 6 oz (Trivia at 8 pm)<br>**Thu**: $5 off any pasta, half-price bottles of wine, martinis $9<br>**Fri** Fish Friday (15:00+): fish and chips $16.99 (After 3 pm)<br>**Sat, Sun**: Caesars $6.99<br>**Sun** (15:00+): half-price appetizers (After 3 pm) | Venue | [Blk Swan North daily specials](https://blkswan.ca/burlington/dailies.html) (2026-10) |
| 400 Brant Kitchen & Bar (400 Brant St) | Downtown | **Daily 14:00–16:00**: appetizers and shareables $14, rail drinks $6, Aperol spritz $9, sangria $10, 25% off draft, cans and select wine | — | Venue; Google lists it as “no dine-in”, so the sweep left it out; it is a sit-down restaurant in the old Queen’s Head building | [400 Brant happy hour menu (PDF)](https://400brant.ca/wp-content/uploads/2026/10/Happy-Hour-Menu.pdf) (2026-10); [Burlington Downtown business directory](https://burlingtondowntown.ca/business-directory/400-brant-kitchen-bar/) (2026-10) |
| Gator Ted’s Tap & Grill (1505 Guelph Line) | Brant Hills | — | **Mon** Taco Night: tacos $15<br>**Tue**: fajitas $55, appetizers $13 (As listed: fajitas $55, apps $13)<br>**Wed** Burger Night: burgers $17<br>**Thu** Wrap Night: crispy chicken wraps $16<br>**Fri**: fish and chips $16<br>**Sat** Rib Night: half rack of ribs $22, full rack of ribs $28, rib and wing combo $26<br>**Sun**: wings, per pound $14, pizza, wings and fries $60 (Wing special is dine-in only) | Venue | [Gator Ted’s weekly specials (home page image)](https://www.gatorteds.ca/) (2026-10) |
| Barra Fion (1505 Guelph Line #10a) | Brant Hills | **Daily 14:00–17:00**: 25% off tapas, house wine $8, sangria or mules $8, tall cans $6, bar rail $5, select pints $5 | **Mon**: Molson pints $5 (All day)<br>**Tue**: margaritas $10, $5 off premium tequila<br>**Wed**: 8 oz wine for the price of 5 oz<br>**Thu**: half-price bottles of wine | Venue | [Barra Fion specials page (weekly features image)](https://www.barrafion.ca/specials) (2026-10) |
| Jersey’s Bar & Grill (1450 Headon Rd) | Headon Forest | **Mon–Sat 11:00–18:00**: domestic draft $5.50 (Draft Days, open till 6 pm) | **Tue** Irish pint Tuesday: 20 oz Guinness $8.50<br>**Fri**: one-piece fish and chips $14.95 | Venue | [Jersey’s specials page (images dated 2026)](https://jerseysbarandgrill.ca/specials.html) (2026-03) |
| St. Louis Bar & Grill (Appleby) (450 Appleby Line) | Shoreacres | **Daily 11:00–17:00**: sliders, pickle coins or fries $4, 12 oz domestic draught $4, 5 oz house wine $4, bar rail $4, domestic bottles $4 (Dine-in only)<br>**Mon–Thu, Sun 21:00–23:00**: sliders, pickle coins or fries $4, 12 oz domestic draught $4, 5 oz house wine $4, bar rail $4, domestic bottles $4 (9 pm to close; dine-in only)<br>**Fri, Sat 21:00–24:00**: sliders, pickle coins or fries $4, 12 oz domestic draught $4, 5 oz house wine $4, bar rail $4, domestic bottles $4 (9 pm to close; dine-in only) | **Tue** Half Priced Tuesdays (17:00+): half-price wings (From 5 pm, with any drink; dine-in only)<br>**Fri**: half-price select bottles of wine | Venue; Chain-wide, “at participating locations” | [St. Louis $4 happy hour page](https://www.stlouiswings.com/happyhour2025/) (2026-08); [St. Louis deals page](https://www.stlouiswings.com/deals/) (2026-10) |
| St. Louis Bar & Grill (Walkers) (1831 Walkers Line) | Tansley | **Daily 11:30–17:00**: sliders, pickle coins or fries $4, 12 oz domestic draught $4, 5 oz house wine $4, bar rail $4, domestic bottles $4 (Dine-in only)<br>**Mon–Thu, Sun 21:00–23:00**: sliders, pickle coins or fries $4, 12 oz domestic draught $4, 5 oz house wine $4, bar rail $4, domestic bottles $4 (9 pm to close; dine-in only)<br>**Fri, Sat 21:00–24:00**: sliders, pickle coins or fries $4, 12 oz domestic draught $4, 5 oz house wine $4, bar rail $4, domestic bottles $4 (9 pm to close; dine-in only) | **Tue** Half Priced Tuesdays (17:00+): half-price wings (From 5 pm, with any drink; dine-in only)<br>**Fri**: half-price select bottles of wine | Venue; Chain-wide, “at participating locations” | [St. Louis $4 happy hour page](https://www.stlouiswings.com/happyhour2025/) (2026-08); [St. Louis deals page](https://www.stlouiswings.com/deals/) (2026-10) |

## Table B: weak or undated claims, held back

| Venue | Claim | Why it’s held back | Source |
|---|---|---|---|
| The Mule Burlington (Formerly Burro) | Happy hour Sun–Thu 3–5 pm | BurlingtonToday directory listing, undated (the page sits behind a bot check, seen only in a search snippet). The Burlington site’s “Weekly Specials” link goes to The Mule London’s page ($4 tacos and half-price house cervezas Sun–Thu 3–5 pm, $5 fish tacos Tuesdays), which may not apply here | [BurlingtonToday listing](https://www.burlingtontoday.com/directory/restaurants-casual-dining/the-mule-burlington-111913) |
| Emma’s Back Porch | Daily features: Burger & A Crafty Monday, Taco Tuesday, Wacky Wednesday, Thrifty Thirsty Thursday, Fresh & Funky Fridays | Terms are only in images dated 2018 (featured_mondays_020818.jpg and so on) | [Emma’s Back Porch daily features](https://emmasbackporch.ca/daily-features.html) |
| The WORKS Craft Burgers & Beer | A “Happy Hour” menu and “Daily Deals” are listed for the Burlington store | No times, days or prices published; the menu tabs are empty | [The Works Burlington page](https://worksburger.com/store/burlington/) |
| Boston Pizza | Appy Hour (“apps and drinks from $5”) and Pizza Monday / Pasta Tuesday / Wing Wednesday | Boston Pizza says to check with each restaurant for its Appy Hour; the daily specials are marked for Alberta and Quebec, not Ontario | [Boston Pizza promotions](https://bostonpizza.com/en/promotions.html) |
| Boston Pizza | Same as Boston Pizza South | Same as Boston Pizza South | [Boston Pizza promotions](https://bostonpizza.com/en/promotions.html) |
| Nai Restaurant | A “Happy Hours” menu tab | The tab has no published days, times or prices | [Nai home page](https://nairestaurant.ca/) |
| Red Lobster | Red Lobster Canada has run happy hours at some locations | The Burlington page is behind a bot check; nothing Burlington-specific could be read | [Red Lobster Burlington page](https://www.redlobster.ca/) |
| Symposium Cafe Waterdown | Happy Hour Appetizers 3–6 pm and 9 pm–close; $7 martinis and mules Wednesdays | BurlingtonToday classifieds (April 2025), and it is in Waterdown (Hamilton), outside the area | [BurlingtonToday classifieds](https://www.burlingtontoday.com/classifieds/buy-sell-and-services/browse-local-sales-offers-more/1951537) |
| Old downtown patio guide | Turtle Jack’s “Turtle time” Mon–Fri 4–6 pm and 9 pm–close, Martini House Tapas Tuesdays from 3 pm, Paradiso half-price wine Wednesdays | Burlington Downtown patio guide from 2020; the venues’ current pages give different terms (used instead), and Paradiso no longer lists it | [Burlington Downtown patio guide](https://burlingtondowntown.ca/patios-downtown-burlington/) |

## Table C: checked, no deals found (110 candidates)

“Directory” marks the spots listed without deals. Sites behind bot checks were not read; that’s noted.

| Venue (address) | Listed? | What was checked | Source |
|---|---|---|---|
| Di Mario’s Trattoria (1455 Lakeshore Rd.) | Directory | Menus and wine list only; an image named “happy hour” is a 2023 food photo | [Di Mario’s](https://www.dimarios.com/) |
| NISI Greek Taverna Burlington (1455 Lakeshore Rd.) | Directory | Drinks menu at regular prices | [Nisi menu](https://www.nisigreek.ca/menu) |
| The Express Restaurant- Italian Eatery (1477 Lakeshore Rd.) | Directory | Wix menu pages with no specials | [Express](https://www.expressrestaurant.com/) |
| Downtown Bistro & Grill (441 Elizabeth St) | Directory | Lunch, dinner and wine menus only | [Downtown Bistro](https://downtownbistro.ca/) |
| Lettuce Love Café (399 John St) | Directory | Plant-based café menu; no drink specials | [Lettuce Love menu](https://www.lettucelovecafe.com/menu) |
| Buvette Restaurant and Wine Bar (417 Elizabeth St) | Directory | Menu and wine list only | [Buvette](https://buvetteresto.com/) |
| Mikado Japanese Restaurant (415 Elizabeth St) | Directory | Set “course menus” at regular prices; no happy hour | [Mikado](https://mikadojapanese.ca/) |
| Paradiso (2041 Pine St) | Directory | Site is a bare location page | [Paradiso](https://www.paradisorestaurant.com/) |
| The North Coal Kitchen & Bar (399 Elizabeth St #8) | Directory | Menus only; deals go out by newsletter and Instagram (not readable) | [The North Coal](https://www.thenorthcoal.com/) |
| No.8 Restaurant (446 Pearl St) | Directory | Seasonal menus only | [No.8](https://www.no8restaurant.com/menu) |
| Son of a Peach Pizzeria (2049 Pine St #62) | Directory | Menu only | [Son of a Peach menu](https://www.heypeachy.com/menu) |
| The Poacher (436 Pearl St) | Directory | Menu only; points to Instagram for news (not readable) | [The Poacher](https://www.thepoacher.ca/) |
| Smoq House (399 Elizabeth St #6) | No | BBQ counter open Thu–Sun; menu only | [Smoq House](https://smoqhouse.com/) |
| Rayhoon Persian Eatery (420 Pearl St) | Directory | Menu and events only | [Rayhoon](https://www.rayhooneatery.com/) |
| Bar Origin (399 Elizabeth St Unit 3) | Directory | Opened 2026; menu and events only | [Bar Origin](https://barorigin.ca/) |
| Culaccino Bar & Kitchen (527 Brant St) | Directory | Wix site with beer list in images; no specials text | [Culaccino](https://www.culaccino.ca/) |
| Pearle's Cafe (3 Elizabeth St) | No | Hotel café; the hotel’s happy hour is at Isabelle | [The Pearle Hotel](https://thepearlehotel.ca/) |
| Pho Mi T&T (583 Brant St) | Directory | Menu only | [Pho Mi T&T menu](https://phomitt.com/menu/) |
| The Carriage House Restaurant (2101 Old Lakeshore Rd) | Directory | “Game special of the day” is a regular menu item | [The Carriage House](https://thecarriagehouse.ca/) |
| August 8 Burlington (834 Brant St) | No | All-you-can-eat menu | [August 8](https://august8.ca/) |
| Mandarin Restaurant (1881 Fairview St) | No | Buffet; promotions are takeout and gift offers | [Mandarin promotions](https://www.mandarinrestaurant.com/promotions/) |
| Prince of India Burlington (1235 Fairview St) | No | Site behind a bot check (not read) | [Prince of India](http://www.princeofindia.ca/) |
| Nord Restaurant (2207 Fairview St) | No | No website; 21 reviews | Google listing |
| Wimpy's Diner (475 Guelph Line) | No | Diner; “promotions coming soon” | [Wimpy’s](https://wimpysdiner.ca/) |
| Imi Japanese Cuisine (2011 Plains Rd E #1) | No | Site is a placeholder | [Imi](https://imisushi.ca/) |
| Siam Dish Thai Cuisine (730 Guelph Line Unit 4) | No | Weekday lunch special only | [Siam Dish](https://siamdish.ca/) |
| Board Games at 19th Social (2051 Plains Rd E) | No | Board-game lounge; per-person table fee, no drink specials | [Board Games at 19th Social](https://www.19thboardgames.com/) |
| Swiss Chalet (2422 Fairview St) | No | Swiss Chalet location pages are behind a bot check (not read) | [Swiss Chalet](https://www.swisschalet.com/) |
| Bento Box (2405 Fairview St) | No | Menu image only | [Bento Box](https://bentoboxburlington.ca/) |
| Dear Saigon (2405 Fairview St) | No | Menu only | [Dear Saigon](https://dearsaigon.com/) |
| East Side Mario's (777 Guelph Line Unit M18) | Directory | Location page behind a bot check (not read) | [East Side Mario’s](https://www.eastsidemarios.com/) |
| Kelseys Original Roadhouse (777 Guelph Line) | Directory | Location page behind a bot check (not read) | [Kelseys](https://www.kelseys.ca/) |
| Panda Chopsticks Chinese Restaurant (650 Plains Rd E) | No | Online ordering page only | [Panda Chopsticks](https://pandachopsticks.com/) |
| Royal Cumin BURLINGTON Indian & Hakka Bistro (650 Plains Rd E) | No | Menu only | [Royal Cumin](https://royalcumin.com/) |
| Lord Nelson Steak House (650 Plains Rd E) | Directory | “Lord Nelson Special” is a regular menu item | [Lord Nelson](https://www.thelordnelson.com/) |
| Skyway Diner (645 Plains Rd E) | No | Diner; everyday food specials and family packs, no drink deals | [Skyway Diner](https://theskywaydiner.ca/) |
| The Moose & Maple Bar and Grill (2412 Queensway Dr Unit 2) | No | Site “in progress”; two reviews | [The Moose & Maple](https://themooseandmaple.com/) |
| Spoon and Fork Burlington (1200 Brant St) | No | All-you-can-taste promotions, limited time | [Spoon & Fork promotions](https://www.spoonandfork.ca/promotions) |
| Cima Enoteca (1200 Brant St B1) | Directory | Menu PDF only | [Cima Enoteca](https://www.cimaenoteca.ca/) |
| Aroma Kitchen (566 Plains Rd E) | No | Takeout ordering menu | [Aroma Kitchen](https://www.aromakitchenburlington.com/) |
| Stacked Pancake & Breakfast House (1220 Brant St Unit 3C) | No | Breakfast chain; weekday breakfast and lunch specials only | [Stacked Brant St](https://stacked.ca/restaurant/burlington-brant) |
| Swiss Chalet (1220 Brant St Unit 201) | No | Location page behind a bot check (not read) | [Swiss Chalet](https://www.swisschalet.com/) |
| Splitsville Bowl Burlington (830 Laurentian Dr) | No | Bowling-game deals only | [Splitsville Burlington](https://www.splitsvillebowl.ca/burlington) |
| Halibut 'N' Malt Fish & Chips (1250 Brant St #4) | No | Takeout fish-and-chips special only | [Halibut ’n’ Malt](https://www.halibutnmalt.com/) |
| Cherry House Restaurant (3106 S Service Rd) | Directory | Menus (Oct 2026) at regular prices | [Cherry House](https://cherryhouse.ca/) |
| Sotiris Greek Restaurant (3135 Harvester Rd) | Directory | Menu only | [Sotiris](https://sotirisrestaurant.com/) |
| Mount Royal Family Restaurant (2029 Mt Forest Dr) | No | Family restaurant; minimal site | [Mount Royal](http://mountroyalfamilyrestaurant.ca/) |
| Pür & Simple (3315 Fairview St Unit 8) | No | Breakfast chain | [Pür & Simple](https://pursimple.com/) |
| Harvest Table (3350 Fairview St) | No | No website; breakfast spot | Google listing |
| Montana’s BBQ & Bar (3040 Davidson Ct) | Directory | Location page behind a bot check (not read) | [Montana’s](https://www.montanas.ca/) |
| Familia Fine Foods (3245 Harvester Rd Unit 17) | No | Deli and frozen meals; restaurant menu only | [Familia Fine Foods](https://familiafinefoods.com/) |
| THE KITCHEN Restaurant&Bar (960 Cumberland Ave) | No | No website, no reviews | Google listing |
| Napoleon’s Steak & Seafood (3455 Fairview St) | Directory | Menu only | [Napoleon’s](https://napoleons.ca/) |
| Thai Coconut (3455 Fairview St) | No | Menu only | [Thai Coconut](https://www.thaicoconutinburlington.com/) |
| Club 54 Nightclub (3345 Harvester Rd) | Directory | Nightclub; group and birthday offers only | [Club 54](https://www.club54.ca/) |
| Comedy At Club 54 (3345 Harvester Rd) | No | Comedy night at Club 54; 2-for-1 admission passes, not food or drink | [Comedy at Club 54](https://www.club54.ca/comedy-at-club-54) |
| The Bombay Grill (3480 Fairview St) | No | Lunch and dinner combos only | [The Bombay Grill](https://www.thebombaygrill.ca/) |
| Cora Breakfast and Lunch (3455 Fairview St) | No | Breakfast chain; loyalty offers only | [Cora Burlington](https://www.chezcora.com/) |
| Thistle Fish & Chips (3455 Fairview St) | No | Menu only | [Thistle](https://www.thistlefishandchips.ca/) |
| Bar Down Inc. (1179 Northside Rd) | No | Two reviews; part of the Wave Sports complex | Google listing |
| The Raider's Den (1179 Northside Rd) | No | Arena sports bar; menu image only | [Raider’s Den menu](https://conacherhockey.com/) |
| Sea Shanty Fish & Chips (2455 Mt Forest Dr) | No | Menu only | [Sea Shanty](https://theseashanty.ca/) |
| Halton Crown Pub and Grill (4057 New St) | No | Site behind a bot check (not read) | [Halton Crown](http://haltoncrownpub.com/) |
| Hakka Rise & MoMo House (3537 Fairview St Unit 3) | No | Weekday lunch special and online-order discounts only | [Hakka Rise](https://hakkarise.ca/) |
| West Plains Bistro (133 Plains Rd E) | Directory | Menu only | [West Plains Bistro](https://www.westplainsbistro.com/) |
| Jake's Grill & Oyster House (950 Walkers Line) | Directory | Menus and a limited-time seafood festival only | [Jake’s Grill](https://www.jakesgrill.ca/) |
| Sama Lounge (4045 Harvester Rd) | No | Hookah lounge; menu only | [Sama Lounge](https://samalounge.ca/) |
| Brooklyn's Bar & Grill (4065 Harvester Rd) | No | Bowling-alley bar; menu PDF only | [Brooklyn’s menu](http://burlingtonbowl.com/BrooklynsMenuWeb.pdf) |
| Kwality Indian Cuisine (1505 Guelph Line) | No | Site is a placeholder | [Kwality](https://kwalityburlington.com/) |
| Piper Arms Burlington (4155 Fairview St Unit 1) | Directory | Site behind a bot check (not read); a venue listing mentions “everyday specials” and “late-night specials” with no terms | [The Vendry listing](https://thevendry.com/venue/256958/piper-arms-pub-burlington-burlington-canada) |
| Russell Williams Family Restaurant (20 Plains Rd E) | No | Family restaurant; menu images only | [Russell Williams](http://www.russellwilliamsrestaurant.com/) |
| Nickel Brook Brewing Co. (3426 Mainway) | Directory | Brewery site is a script-only page (not readable) | [Nickel Brook](https://www.nickelbrook.com/) |
| Sakai Japanese And Korean Restaurant (4155 Fairview St #22) | Directory | Weekday lunch specials only | [Sakai](https://www.sakai-restaurant.com/) |
| The Lone Wolf - Resto Bar (1233 Dillon Rd) | Directory | Site behind a bot check (not read) | [The Lone Wolf](http://lonewolfbar.ca/) |
| Carrigan Arms (2025 Upper Middle Rd #23) | Directory | Events page: trivia Mondays, live music, poker, karaoke; no drink specials | [Carrigan Arms events](https://carriganarms.ca/live-music-%26-other-events) |
| The Judge & Jury (1222 Walkers Line) | Directory | Menus, including late night and gluten-free Monday menus, at regular prices | [The Judge & Jury](https://www.thejudgeandjury.ca/) |
| Ye Olde Squire - Aldershot Village (127 Plains Rd W) | Directory | Home page only; no specials | [Ye Olde Squire](https://yeoldesquire.ca/) |
| Saving Thyme Patisserie & Bistro (450 Appleby Line) | No | Patisserie and bistro; tea and pastry menus only | [Saving Thyme](https://www.savingthyme.ca/) |
| Rust BistroBar (1801 Walkers Line Unit 7) | Directory | Menus and a $100-per-couple Wednesday date-night set menu | [Rust Bistrobar](https://www.rustbistrobar.ca/) |
| Mughal Spices Burlington (4460 Fairview St) | No | Saturday breakfast buffet ($16.99) only; no drink deals | [Mughal Spices](https://mughalspices.ca/) |
| Jacksons Landing (5000 New St) | Directory | The Landing Group location page is behind a bot check (not read) | [Jacksons Landing](https://www.thelandinggroup.ca/) |
| Mayjjana Restaurant & Lounge (4490 Fairview St) | No | No website | Google listing |
| Captain’s Crab (511 Appleby Line #100) | No | Weekday lunch combos only | [Captain’s Crab](https://captainscrab.ca/) |
| Bahn Thai Restaurant (4490 Fairview St) | Directory | Weekday lunch specials only | [Bahn Thai](http://www.bahnthaigroup.com/) |
| Loondocks Restaurant (5111 New St) | Directory | Menus and wine list only | [Loondocks](https://loondocks.ca/) |
| Oh Bombay - Burlington (671 Appleby Line) | No | Online-order discounts only | [Oh Bombay Burlington](https://ohbombayrestaurant.com/locations/burlington) |
| Sushi Masayuki (2180 Itabashi Way) | No | Minimal site | [Sushi Masayuki](https://sushimasayuki.com/) |
| Lima91 Authentic Peruvian Cuisine (5353 Lakeshore Rd. #24) | No | No website | Google listing |
| Applestone Pizzeria (1900 Appleby Line) | Directory | Menu PDF (Aug 2024) only | [Applestone](https://www.applestonepizzeria.com/) |
| Industria Pizzeria + Bar (1860 Appleby Line) | Directory | Burlington page and menu; “promotions vary by province”, none listed | [Industria Burlington](https://industriapizzeria.com/locations/burlington) |
| El Inka Peruvian Cuisine (1940 Appleby Line a21) | Directory | Menu only | [El Inka](https://www.elinka.ca/) |
| Bombay's (3450 Dundas St Unit B1) | No | Website did not load | [Bombay’s](http://www.wowindiankitchen.ca/) |
| BAB Korean Food & BBQ (3550 Dundas St Unit 1) | No | Menu only | [BAB Korean](https://babkoreanfoodandbbq.com/) |
| Pür & Simple (1940 Appleby Line Unit 22) | No | Breakfast chain | [Pür & Simple](https://pursimple.com/) |
| Doma Sushi (3450 Dundas St UnitB16) | No | Site is a script-only page | [Doma Sushi](https://www.domasushi.ca/) |
| Swiss Chalet (1950 Appleby Line) | No | Location page behind a bot check (not read) | [Swiss Chalet](https://www.swisschalet.com/) |
| Pepe and Lela's Restaurant (1893 Appleby Line) | Directory | Website returned an error | [Pepe and Lela’s](https://pepeandlelas.com/) |
| Bombay's Chutney (3450 Dundas St) | No | Takeout specials only | [Bombay’s Chutney](https://www.bombayschutney.ca/) |
| Bombay Vintage (2000 Appleby Line Unit F4) | No | Weekday lunch special only | [Bombay Vintage](https://bombayvintage.ca/) |
| Rose Garden Restaurant (1124 Plains Rd W) | No | Website suspended | [Rose Garden](https://rosegardenfamily.com/) |
| Social 99 Restaurant & Bar (2000 Appleby Line) | Directory | Site behind a bot check (not read) | [Social 99](http://www.social99.ca/) |
| Beertown - Burlington (2050 Appleby Line Unit K) | Directory | Site behind a bot check (not read) | [Beertown](http://www.beertown.ca/) |
| Ben Thanh (2080 Appleby Line) | No | Online-ordering page only | [Ben Thanh](http://benthanhburlington.ca/) |
| Daylight Grill (Appleby) (2080 Appleby Line) | No | Breakfast spot; menu only | [Daylight Grill](https://www.daylightgrill.ca/) |
| Kudo Sushi - Japanese Cuisine (738 Burloak Dr) | No | Online-ordering page only | [Kudo Sushi](https://www.kudosushi.com/) |
| Chillax Social (5515 N Service Rd Unit 107) | No | Instagram only (not readable); Google lists no alcohol | [Chillax Social](https://www.instagram.com/chillaxsocial_burlington/) |
| The Bistro - Eat. Drink. Connect. (1110 Burloak Dr) | No | Hotel bistro; the link goes to Marriott’s brand page | [Courtyard Burlington](https://courtyard.marriott.com/) |
| KINTON RAMEN APPLEBY BURLINGTON (2500 Appleby Line C3 & C4) | No | Seasonal ramen promotions only | [Kinton Ramen](https://kintonramen.com/) |
| Avani Asian Indian Bistro (2535 Appleby Line) | Directory | Menus only | [Avani](https://www.avani.ca/) |
| Lowville Bistro (6179 Guelph Line) | No | Menus (Oct 2026), wine list and jazz nights; no specials | [Lowville Bistro](https://lowvillebistro.ca/) |

## Table D: left out under the listing rules (77 candidates)

Google’s sweep had already set aside 689 places (390 outside Burlington, 133 without alcohol, and fast food, cafés, grocery stores and the like); those are in `candidates.json` under `excluded`. One of them, 400 Brant Kitchen & Bar, was put back (see Method). These 77 were in `candidates` but don’t meet the listing rules:

| Candidate (address) | Reason |
|---|---|
| No Bull Burgers - Burlington (357 Brant St) | Counter-service burger shop; Google lists no alcohol |
| La Pita Halal Shawarma & Grill (2003 Lakeshore Rd.) | Shawarma counter; no alcohol |
| HEAL Wellness (399 John St) | Wellness café (smoothies and bowls); no alcohol |
| The Block co (395 John St) | Food store |
| Hi-Line Pizza - Lakeshore Burlington (2027 Lakeshore Rd.) | Takeout pizza by the slice; no alcohol |
| Ruby Thai Kitchen (900 Maple Ave f1) | Mall food-court counter; no alcohol |
| A&W Canada (900 Maple Ave) | Fast food (A&W) |
| Poulet Rouge (900 Maple Ave) | Fast-casual rotisserie chicken counter; no alcohol |
| Taco Bell (900 Maple Ave) | Fast food (Taco Bell) |
| Olive Us Greek Take-out Restaurant (421 Guelph Line) | Greek takeout counter |
| Alei Kitchen (1400 Plains Rd E #6) | Chinese counter-service spot; Google lists no alcohol |
| Funjo wok (2011 Plains Rd E #3) | Wok counter; no alcohol |
| Lutf Indo-Pak Cuisine (2011 Plains Rd E Unit 2) | Halal Indo-Pak restaurant; no alcohol |
| Mish Mish Mezza (1035 Brant St Unit 6) | Middle Eastern counter-service spot; no alcohol listed |
| 19th Hole Indoor Golf & Social (2051 Plains Rd E) | Indoor golf simulator; its “late night special” is a golf-bay rate |
| Philthy Philly's Burlington (2405 Fairview St #2) | Cheesesteak counter (order online, takeout) |
| 1st Choice Kitchen (2405 Fairview St) | No website, no reviews, no alcohol listed |
| Pane Fresco at Fortinos (1059 Plains Rd E) | Grocery-store counter (Fortinos) |
| ZENSHI Handcrafted Sushi (1059 Plains Rd E) | Grocery-store sushi counter (Fortinos) |
| A&W Canada (777 Guelph Line) | Fast food (A&W) |
| ABC Restaurant (700 Dynes Rd) | Two reviews, no website, no alcohol listed |
| The Art Of Pho (777 Guelph Line) | Mall food-court counter; no alcohol |
| Taco Bell (777 Guelph Line) | Fast food (Taco Bell) |
| Burlington Golf & Country Club (422 North Shore Blvd E) | Private golf club |
| Windmill Restaurant (2238 Mountainside Dr) | Breakfast diner; no alcohol |
| Oakville Hakka House (516 Plains Rd E) | Hakka restaurant; Google lists no alcohol |
| He He Restaurant (710 Cumberland Ave Unit 4) | No website; Google lists no alcohol |
| barBURRITO (3455 Fairview St Unit 3) | Fast food (barBURRITO) |
| KTEN10 Japanese Thai House (3480 Fairview St Unit 1-2) | Takeout-style Japanese-Thai counter; no alcohol listed |
| Pho Ahead (495 Walkers Line Unit 10) | Pho counter; no alcohol |
| Golfers Creek (3345 N Service Rd Unit 101) | Indoor golf simulator, not a bar or restaurant |
| Table 10 Private Dining (175 Plains Rd E) | Private dining by booking only |
| Interior Design House (4047 Fairview St) | Furniture store |
| Burlington Bowl (4065 Harvester Rd) | Bowling alley (its bar, Brooklyn’s Bar & Grill, is checked separately) |
| The Brick (990 Fraser Dr) | Furniture store |
| Pizza Hut (1505 Guelph Line Unit 23) | Fast food and takeout (Pizza Hut) |
| ZENSHI Handcrafted Sushi (2025 Guelph Line) | Grocery-store sushi counter (Fortinos) |
| Pottery N Paint Cafe Inc. (755 Griffith Ct #1) | Paint-your-own-pottery studio |
| Jerseys Food & Beverage Co. (1450 Headon Rd) | Duplicate listing of Jersey’s Bar & Grill |
| Gem Limousine (4325 Harvester Rd Unit 18a) | Limousine company |
| Eggsmart (1900 Walkers Line Unit 14) | Breakfast chain; no alcohol |
| Kibo Sushi House - Burlington (1900 Walkers Line Unit 11) | Sushi takeout; no alcohol listed |
| A&W Canada (1811 Walkers Line) | Fast food (A&W) |
| The Burnt Tongue (491 Appleby Line Unit 103) | Counter-service soup and burger spot; no alcohol |
| bbq Chicken (5010 Pinedale Ave Unit 1001A) | Korean fried-chicken counter; no alcohol listed |
| Blondies Pizza - Burlington (4490 Fairview St) | Takeout pizza |
| M2GO by Mandarin - Burlington (4490 Fairview St) | Takeout (Mandarin’s to-go brand) |
| Zesty - Shawarma Saj Catering (3505 Upper Middle Rd) | Shawarma counter |
| ZENSHI Handcrafted Sushi (5111 New St) | Grocery-store sushi counter (Fortinos) |
| The Groundswell Church (1996 Itabashi Way) | Church |
| Karahi Boys (2180 Itabashi Way Unit D4) | Halal karahi restaurant; no alcohol |
| A&W Canada (1207 Appleby Line) | Fast food (A&W) |
| Pine And Dale Barbershop (5291 Lakeshore Rd. #7) | Barber shop |
| Green Press Burlington (5195 Harvester Rd) | Juice bar; no alcohol listed |
| Food Basics (5353 Lakeshore Rd.) | Supermarket |
| Mucho Burrito Fresh Mexican Grill (1940 Appleby Line Unit 17) | Fast food (Mucho Burrito) |
| Delhi Belli Momos (3450 Dundas St) | Momo counter; no alcohol listed |
| Kairos Gift Baskets & Flowers (1893 Appleby Line Unit 5) | Gift shop |
| barBURRITO (3450 Dundas St) | Fast food (barBURRITO) |
| Classic Hakka (2000 Appleby Line) | Hakka takeout; no alcohol listed |
| Pita Land Shawarma - Burlington (3061 Walkers Line) | Shawarma counter |
| Uptown Cravings 728 Burloak Drive, Burlington ON (728 Burloak Dr) | Takeout; no alcohol listed |
| Hilton Garden Inn Toronto/Burlington (985 Syscon Rd) | Hotel (its restaurant is listed separately) |
| Great North American Grill (985 Syscon Rd) | Hotel breakfast restaurant; Google lists no alcohol |
| Hoser Burger (inside Blk Swan) (4040 Palladium Wy) | Burger counter inside Blk Swan North (covered by Blk Swan) |
| Huxley Hot Chicken (4040 Palladium Wy Unit 11-13) | Fast food (hot chicken) |
| Delimark Cafe (5500 N Service Rd) | Café |
| Hidden Lake Golf Club (1137 1 Side Rd) | Golf course |
| Dave's Hot Chicken (2500 Appleby Line) | Fast food (Dave’s Hot Chicken) |
| Poppadum Burlington (2465 Appleby Line D1-C) | Indian restaurant; Google lists no alcohol |
| Hakka Impression Asian Cuisine (2475 Appleby Line) | Halal Hakka restaurant; no alcohol |
| WingsUp! Burlington - Appleby Line (2475 Appleby Line e9) | Wings takeout counter |
| ZENSHI Handcrafted Sushi (2515 Appleby Line) | Grocery-store sushi counter (Fortinos) |
| Masemo Pizza by Paramount (2535 Appleby Line) | Takeout pizza; one review |
| Burlington Nail Bar (3101 Appleby Line Unit 3) | Nail salon |
| Silver Spoon Burlington (3247 Appleby Line Unit 3-4) | Halal restaurant; no alcohol |
| Backed By Bees (6214 Appleby Line) | Farm |

## The directory (53 spots without known deals)

Chosen for downtown first, then well-loved pubs and kitchens with many reviews, then the big chains people look for.

| Spot | Area | Category |
|---|---|---|
| The Mule | Downtown | Taco and tequila bar |
| Emma’s Back Porch | Downtown | Waterfront bar and grill |
| Culaccino Bar + Kitchen | Downtown | Craft beer gastropub |
| The Poacher | Downtown | British pub |
| The North Coal Kitchen & Bar | Downtown | Cottage-style kitchen and bar |
| Bar Origin | Downtown | Shared plates and cocktail lounge |
| Buvette Restaurant & Wine Bar | Downtown | Restaurant and wine bar |
| Di Mario’s Trattoria | Downtown | Italian trattoria |
| Nisi Greek Taverna | Downtown | Greek taverna |
| No.8 Restaurant | Downtown | Restaurant |
| Son of a Peach Pizzeria | Downtown | Pizzeria |
| Rayhoon Persian Eatery | Downtown | Persian restaurant |
| Downtown Bistro & Grill | Downtown | European bistro |
| Mikado Japanese Restaurant | Downtown | Japanese restaurant |
| Paradiso | Downtown | Mediterranean restaurant |
| Lettuce Love Café | Downtown | Plant-based café |
| The Express Italian Eatery | Downtown | Italian eatery |
| The Carriage House | Downtown | Fine dining |
| The Works Craft Burgers & Beer | Downtown | Burger restaurant |
| Pho Mi T&T | Downtown | Vietnamese restaurant |
| Cima Enoteca | Brant St north | Italian restaurant |
| Nickel Brook Brewing Co. | Brant Hills | Brewery taproom |
| Piper Arms | Fairview | British pub |
| The Judge & Jury | Tansley | Pub |
| Carrigan Arms | Brant Hills | Irish pub |
| Ye Olde Squire | Aldershot | British pub |
| The Lone Wolf Resto Bar | Fairview | Resto bar |
| Social 99 Restaurant & Bar | Millcroft | Restaurant and bar |
| Beertown | Millcroft | Craft beer public house |
| Loondocks | Alton | Casual fine dining |
| Jacksons Landing | Appleby | Restaurant and bar |
| Rust Bistrobar | Tansley | Bistro |
| Jake’s Grill & Oyster House | Appleby | Seafood grill |
| Napoleon’s Steak & Seafood | Fairview | Steak and seafood |
| Cherry House | South Service Rd | Fine dining |
| Lord Nelson Steak House | Plains Rd | Steakhouse |
| West Plains Bistro | Aldershot | Bistro |
| Sotiris Greek Restaurant | Fairview | Greek restaurant |
| Industria Pizzeria + Bar | Millcroft | Pizzeria and bar |
| El Inka Peruvian Cuisine | Millcroft | Peruvian restaurant |
| Pepe and Lela’s | Millcroft | Mexican restaurant |
| Avani Asian Indian Bistro | Alton | Indian bistro |
| Applestone Pizzeria | Millcroft | Pizzeria |
| Nai Restaurant | Appleby | Middle Eastern restaurant |
| Bahn Thai | Appleby | Thai restaurant |
| Sakai Japanese & Korean | Fairview | Japanese and Korean restaurant |
| Club 54 | Harvester Rd | Nightclub |
| Kelseys Original Roadhouse | Burlington Centre | Roadhouse |
| Montana’s BBQ & Bar | Brant Hills | Barbecue and bar |
| East Side Mario’s | Burlington Centre | Italian-American |
| Red Lobster | Fairview | Seafood restaurant |
| Boston Pizza (South Service Rd) | South Service Rd | Sports bar and grill |
| Boston Pizza (Dundas St) | Alton | Sports bar and grill |

## Chains not yet in `src/data/chains.ts`

Not added here (only this folder was edited). Seen in Burlington: **Lot 88 Steakhouse & Bar**, **Industria Pizzeria + Bar**, **Hibachi Teppanyaki & Bar**, **Beertown**, **The Landing Group** (Jacksons Landing), **GameTime Social**, **The Mule** (also London, Oakville, Cambridge), **Spoon & Fork**, **August 8**, **Oh Bombay**, **Stacked Pancake & Breakfast House**, **Pür & Simple**, **Cora**, **Wimpy’s Diner**, **barBURRITO**, **Poulet Rouge**, **WingsUp!**, **Philthy Philly’s**, **bbq Chicken**, **Karahi Boys**, **Silver Spoon**, **Splitsville**, **Zenshi** and **Symposium Cafe** (already listed). Local multi-site groups, if a “local only” filter ever needs them: **Montfort Mediterranean Grill**, **Blk Swan Kitchen Hub**, **Bardō**, **radius**, **Lettuce Love**, **Son of a Peach**, and **B Social Hospitality** (The Dickens, District Kitchen + Bar, Prime Steak + Raw Bar).

## Oakville to Third Line and Halton Crown

Added October 28, 2026. The region's east side now follows Third Line from Lakeshore Rd up past Dundas St (Google's intersections with Lakeshore, Rebecca, Speers, Upper Middle and Dundas), and the sweep keeps addresses in Oakville as well as Burlington. Re-running the sweep found 46 new places in Oakville and 4 in Burlington; 5 old candidates were gone (none of them listed). Each kept spot's own site was read, including PDF menus where they could be opened. The same caveats apply: Instagram and Facebook couldn't be read.

**Halton Crown Pub and Grill (4057 New St)** was in the first sweep but its site was behind a bot check then. It loads now: happy hour every day from 9 pm to close (half-price appetizers, $5 bar rail, $6 domestic pints, $5 desserts) and a Monday special (1 lb wings $12, $6 domestic pints), with live music on Fridays ([home page](https://haltoncrownpub.com/), [events](https://haltoncrownpub.com/events/)).

### A) Deals loaded

| Spot | Deals | Source |
| --- | --- | --- |
| Halton Crown Pub and Grill (4057 New St) | Daily 9 pm–close: half-price apps, $5 rail, $6 domestic pints, $5 desserts; Mon 1 lb wings $12 | [Home page](https://haltoncrownpub.com/) |
| Plank Restobar (67 Bronte Rd) | “Appy Hour” Mon–Thu 2–5 pm at Bronte: $10 cocktails (old fashioned, margarita, Plank cosmo), $10 poke spoons. Hamilton runs it Mon–Fri; the full menu is a PDF that couldn’t be read | [Plank Bronte](https://www.plankrestobar.ca/bronte/) (Instagram posts on its own page), [Appy Hour PDF](https://www.plankrestobar.ca/wp-content/uploads/2025/10/PLANK_BRONTE_APPY_HOUR_MENU_OCT2025.pdf) |
| Marine Tavern (49 Bronte Rd) | Thu half-price wine bottles (live music 7–10 pm); quiz Tuesdays | [What’s On](https://marinetavern.ca/What-s-On) |
| The Firehall (2390 Lakeshore Rd W) | Tue wing night, 2-for-1 wings (dine in with a drink); Mon kids eat free from 4 pm | [Specials & promotions](https://www.thefirehall.ca/) (the promo graphics date from 2021 but are still listed; the 2-for-1 detail is in an Instagram post on the page) |
| Bronte Fish & Chips (2313 Lakeshore Rd W) | Tue haddock and chips $17.95 dine in ($16.95 to take out) | [Menu](https://www.brontefishandchips.ca/menu) |
| Por Vida Mezcal & Mexican (2330 Lakeshore Rd W) | Wed all-you-can-eat tacos $39 a person and $40 margarita pitchers (Wednesday is AYCE only; 90 minutes, 18% gratuity) | [Home page](https://porvida.ca/), [AYCE menu, June 2026](https://porvida.ca/wp-content/uploads/2026/06/PV_AYCE_MENU_JUNE_10_2026.pdf) |
| Blk Swan Kitchen Hub Oakville (3420 Rebecca St) | Like the Burlington Blk Swans: $6.99 Swan Lager pints daily; $7.99 Bud pints Tue–Sat until 6 pm; half-price wings Mon–Tue after 3; $17.99 pub grub and 9 oz wine for 6 oz Wed; half-price bottles and $9 martinis Thu; $16.99 fish and chips Fri; $6.99 Caesars Sat (until 6) and Sun; half-price apps Sun | [Oakville dailies](https://blkswan.ca/oakville/dailies.html) |
| Milestones Burloak (3529 Wyecroft Rd) | Daily 3–6 pm, and 9 pm–close Mon–Sat: $5 highballs, bellinis and Budweiser, $6 tacos and house wine, $8 margaritas, $10 martinis, half-price bottles | [Burloak menu](https://milestonesrestaurants.com/menus/burloak), [location](https://milestonesrestaurants.com/locations/burloak) |
| Chop Steakhouse & Bar (3451 S Service Rd W) | Daily 3–6 pm and 9 pm–close, lounge and patio: $5 house wine and highballs, $7.50 prosecco, $9 Big Life Amber, half-dozen oysters $27 | [Location](https://chop.ca/locations/burlington-oakville), [menu](https://chop.ca/menu) |
| Casey’s Clubhouse (3540 Wyecroft Rd) | Mon–Tue 30% off apps; Wed 2-for-1 wings; Thu fish and chips $15.95; Sun a pint and a pound of wings $20 | Menu PDF (created Oct 25, 2026) linked from [Casey’s page](https://burloakindoorgolf.com/caseys-clubhouse). Its banner says the indoor golf opens November 7; the clubhouse lists daily hours |
| Palermo Pub (2512 Old Bronte Rd) | “Cocktail Hour” weekdays 4–6 pm: $5.80 rail, $6.50 Canadian or Coors Light, $4.80 bottles; a special every day but Monday (e.g. Tue second pound of wings half price, Wed $5.75 tall boys, Fri $19.95 fish and chips) | [Specials](https://www.palermopub.com/specials) |
| The Olive Press (2322 Dundas St W) | Mon half-price spaghetti and meatballs and Tue half-price appetizer (from 3 pm, with a drink); Wed half-price wine bottles; Sat–Sun half-price Caesars 12–3 pm | [Menu](https://www.olivepress.ca/menu/) |

### B) Held back

- **Por Vida’s happy hour:** its June 2026 menu lists 2-for-1 margaritas, $6 bottles of Sol and $10 botanas, but no days or times anywhere on the site. Left out until the times are known.
- **Plank’s days:** two posts on its page disagree (Mon–Fri, and Mon–Thu for Bronte); the Bronte one is used.
- **Olive Press email deals** ($15–25 off) are for subscribers only.

### C) Listed, no deals found

Kelseys (Wyecroft Rd; Recipe site, not read), Bronte’s Sports Kitchen, Cucci, The Wine Bar, Camila (site didn’t render), Peppino’s Oven (menu is an image), Mi Amor Taqueria, Casa Mia, El Spero.

### D) Left out

- **No alcohol on their own menus:** Zara’s BBQ, Mehfill Indian Cuisine, Pizza Fiamma (takeout), Watan Flame, Fnajeen, Cafe Imran Khan.
- **Takeout or fast casual:** La Bodega by Por Vida (pick-up), barBURRITO.
- **Closed for the season:** Bronte Boathouse (“closed for the 2026 season”, back in 2027).
- **Not a bar or restaurant:** Goldwyn & Sons (a barbershop with a members’ bar), Burloak Indoor Golf and Triple Eagle Golf (Casey’s is listed), the Bronte Legion (members’ club), OE Banquet Centre, Farm Boy, a park, a spa, a limo company, a furniture store, a wholesaler and a manufacturer Google filed with them; “Seamuseses gooner den” (a joke listing at a house).
- **Couldn’t check:** Burger Theory at the Holiday Inn (IHG’s site refused), Denny’s, Pür & Simple (breakfast), Brisotto (bowls), Swiss Chalet, Deepti’s Veg Kitchen (no reviews yet).

