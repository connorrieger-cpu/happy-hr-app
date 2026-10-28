# Nineteen Kensington spots publish deals, led by Trinity Common and Sneaky Dee’s

All 176 Google Places candidates for Kensington Market (Bathurst St to Spadina Ave, Dundas St W to College St, both sides of the boundary streets) were checked on Wednesday, October 28, 2026. After dropping food-court stalls, takeout counters, places with no sign of alcohol and non-venues, **82 spots make the list: 19 with deals and 63 without.** All 19 deal listings come from the venues’ own websites, menus or posts (`deals: "venue"`). None rest only on a third-party guide, because every third-party claim found was older than 2024, had no prices, was contradicted by the venue or was outside the area (Table B).

The standouts:

- **Trinity Common** (303 Augusta) has the area’s best weekly lineup: **buck-a-shuck oysters on Tuesdays**, **half-price wine bottles on Wednesdays**, $5 tacos and $10 margaritas on Thursdays, and $5 rail shots on Fridays.
- **Sneaky Dee’s** (431 College) runs a daily **11 AM–4 PM happy hour with $4 drinks, tax in, and $10 personal nachos**, plus half-price nachos on Wednesdays, half-price fajitas and $3 tacos on Tuesdays, and $6 mixed drinks at all hours.
- **Casa Morales** (152 Augusta) has three windows a day, Wednesday to Sunday (noon–2, 5–7 and 9 PM to close), with **$11 margaritas (regularly $18)** and $5 rail shots and beer of the day.
- **FreePlay** (300 College) posted an October 8, 2026 price list: **$4 tall cans and $5 draft, weekdays 3–5 PM**, on top of everyday $6 vodka drinks and $6 draft.
- **Handlebar** (159 Augusta) has **$6 rail drinks and $6 Burdock or Eastbound pints, Mon–Fri 5–8 PM**, and $6 Burdock Deluxe pints at its Sunday matinee.
- Also worth knowing: **Midnight Market**’s $5 lager and $5 snacks (Wed–Sun 5:30–7:30), **Chat Bar**’s late-night half-price beer (Sun–Thu after 9 PM), and **Kos**’s $15.95 food-and-a-pint combos (weekdays 4–8 PM).

Three well-known Kensington bars are gone: **Cold Tea** left the Market in 2020 and announced in 2025 that it was closing for good, **Thirsty and Miserable** closed at 197 Baldwin in December 2021 (Rumble Pontiac now sits at 197½), and **Koi Koi Saké Bar** at 170 Baldwin is marked closed. Limitations apply throughout: Instagram, Facebook, OpenTable and Yelp could not be read from here, and about 20 of the listed spots have no working website, so “none found” means no deal appeared in any source that could be reached, not that the spot has none.

## Method

- **Date:** all sources read on October 28, 2026 (a Wednesday). Times below are 24-hour Toronto time; prices are CAD before tax and tip, as printed.
- **Candidates:** `candidates.json` (176 places, swept October 28, 2026 under the new rules: chains allowed, fast food and takeout out). The sweep had already set aside 88 places: 38 that Google says don’t serve alcohol, 28 outside the area and 22 cafés, takeout counters and the like. None of those were added back. Off-list names were looked up too: Cold Tea, Thirsty and Miserable and Koi Koi (closed), Poetry Jazz Café (now Tapestry, listed), Big Trouble (460 Dundas St W, which is east of Spadina and so outside the area) and The Arch Café/Bar and The Harmony Café/Bar (cafés, as the sweep found).
- **Order of checks**, per `RESEARCH.md`: the venue’s own site (home page, menus, specials, events, contact and “about” pages, menu PDFs and menu images), then its booking page, then local guides (blogTO, Toronto Life, Streets of Toronto, Daily Hive, Fringinto, UltimateHappyHours, Restaurantica), then web searches for `"<name>" Toronto happy hour` and similar. In all, 105 venue websites were tried (100 loaded), about 320 subpages and guide pages were fetched, 10 menu PDFs were read and 10 menu or promo images were viewed.
- **Unreachable:** OpenTable (every request failed), Yelp (HTTP 403), Instagram and Facebook. Resy pages load only as an empty shell.
- **Grading:** “High” means the venue’s own current page with prices; “Medium” means the venue’s own source with a gap (no prices, an hours conflict, a chain-wide page or a social post). Nothing from a third party alone was loaded.

## The load list

### Table A: venue-published deals (in `deals.json`)

Each row is one window or one day’s special. Happy hours are time-boxed. Daily specials are tied to days of the week and never take over the timers.

| Venue (address) | Kind | Days | Times | Specials (CAD) | Confidence | Source |
|---|---|---|---|---|---|---|
| Trinity Common (303 Augusta Ave) | Daily special (Monday) | Mon | All open hours | $10 pint of Beau’s and a shot. | High (undated page, © 2025) | [Trinity Common “Weekly Specials” (Daily Specials / Contact page)](https://trinitycommon.ca/contact/), 2026-10 |
| Trinity Common (303 Augusta Ave) | Daily special (Buck-a-shuck Tuesday) | Tue | All open hours | $1 oysters; $7 Woodhouse. | High (undated page, © 2025) | [Trinity Common “Weekly Specials” (Daily Specials / Contact page)](https://trinitycommon.ca/contact/), 2026-10 |
| Trinity Common (303 Augusta Ave) | Daily special (Wine Wednesday) | Wed | All open hours | Half-price wine bottles. | High (undated page, © 2025) | [Trinity Common “Weekly Specials” (Daily Specials / Contact page)](https://trinitycommon.ca/contact/), 2026-10 |
| Trinity Common (303 Augusta Ave) | Daily special (Thursday) | Thu | All open hours | $10 margaritas; $5 tequila shots; $5 tacos; $12 three tacos. | High (undated page, © 2025) | [Trinity Common “Weekly Specials” (Daily Specials / Contact page)](https://trinitycommon.ca/contact/), 2026-10 |
| Trinity Common (303 Augusta Ave) | Daily special (Friday) | Fri | All open hours | $5 rail shots; $6 mixed drinks; $6 house lager (16 oz). | High (undated page, © 2025) | [Trinity Common “Weekly Specials” (Daily Specials / Contact page)](https://trinitycommon.ca/contact/), 2026-10 |
| Trinity Common (303 Augusta Ave) | Daily special (Saturday) | Sat | All open hours | $12 rail doubles. | High (undated page, © 2025) | [Trinity Common “Weekly Specials” (Daily Specials / Contact page)](https://trinitycommon.ca/contact/), 2026-10 |
| Sneaky Dee’s (431 College St) | Happy hour | Daily | 11:00–16:00 | $4 drinks (tax in); $10 personal nachos. | High | [Sneaky Dee’s website](https://www.sneakydees.com/), 2026-10 |
| Sneaky Dee’s (431 College St) | Daily special (Monday) | Mon | All open hours | $12 bacon cheeseburger; $10 veggie burger; $30 nachos and a beer pitcher. | High | [Sneaky Dee’s website](https://www.sneakydees.com/), 2026-10 |
| Sneaky Dee’s (431 College St) | Daily special (Tuesday) | Tue | All open hours | Half-price fajitas; $3 single tacos. | High | [Sneaky Dee’s website](https://www.sneakydees.com/), 2026-10 |
| Sneaky Dee’s (431 College St) | Daily special (Wednesday) | Wed | All open hours | Half-price nachos. | High | [Sneaky Dee’s website](https://www.sneakydees.com/), 2026-10 |
| Sneaky Dee’s (431 College St) | Daily special (Thursday) | Thu | All open hours | $30 chicken wings and a beer pitcher. | High | [Sneaky Dee’s website](https://www.sneakydees.com/), 2026-10 |
| Sneaky Dee’s (431 College St) | Daily special (Weekend brunch) | Sat, Sun | All open hours | $11 brunch items. | High | [Sneaky Dee’s website](https://www.sneakydees.com/), 2026-10 |
| Sneaky Dee’s (431 College St) | Daily special (Every day) | Daily | All open hours | $6 mixed drinks; $6 select beers; $15 select pitchers. | High | [Sneaky Dee’s website](https://www.sneakydees.com/), 2026-10 |
| Casa Morales (152 Augusta Ave) | Happy hour | Wed–Sun | 12:00–14:00 | $11 Morales margaritas; $11 flavour margaritas or mezcalitas; $11 sangría; $11 Aperol spritz; $12 espresso martinis; $10 aguita de horchata; $5 beer of the day; $5 bar rail shots. In the cantina, during brunch. | High (© 2026) | [Casa Morales website (cantina menu and hours)](https://www.casamorales.ca/), 2026-10 |
| Casa Morales (152 Augusta Ave) | Happy hour | Wed–Sun | 17:00–19:00 | $11 Morales margaritas; $11 flavour margaritas or mezcalitas; $11 sangría; $11 Aperol spritz; $12 espresso martinis; $10 aguita de horchata; $5 beer of the day; $5 bar rail shots. | High (© 2026) | [Casa Morales website (cantina menu and hours)](https://www.casamorales.ca/), 2026-10 |
| Casa Morales (152 Augusta Ave) | Happy hour | Wed, Thu, Sun | 21:00–22:00 | $11 Morales margaritas; $11 flavour margaritas or mezcalitas; $11 sangría; $11 Aperol spritz; $12 espresso martinis; $10 aguita de horchata; $5 beer of the day; $5 bar rail shots. Late happy hour, 9 PM to close. | High (© 2026) | [Casa Morales website (cantina menu and hours)](https://www.casamorales.ca/), 2026-10 |
| Casa Morales (152 Augusta Ave) | Happy hour | Fri, Sat | 21:00–23:00 | $11 Morales margaritas; $11 flavour margaritas or mezcalitas; $11 sangría; $11 Aperol spritz; $12 espresso martinis; $10 aguita de horchata; $5 beer of the day; $5 bar rail shots. Late happy hour, 9 PM to close. | High (© 2026) | [Casa Morales website (cantina menu and hours)](https://www.casamorales.ca/), 2026-10 |
| FreePlay (300 College St) | Happy hour | Mon–Fri | 15:00–17:00 | $5 draft beer; $4 tall can; $4 PBR Strong Iced Tea. Arcade entry is $5 Sun–Thu, $10 Fri–Sat. | High (Oct 8, 2026) | [FreePlay blog: “Retro Games, Retro Vibes, Retro Prices!”](https://www.freeplaytoronto.com/post/retro-games-retro-vibes-retro-prices), 2026-10-08 |
| FreePlay (300 College St) | Daily special (Retro prices) | Daily | All open hours | $6 vodka drinks; $6 draft beer. | High (Oct 8, 2026) | [FreePlay blog: “Retro Games, Retro Vibes, Retro Prices!”](https://www.freeplaytoronto.com/post/retro-games-retro-vibes-retro-prices), 2026-10-08 |
| Handlebar (159 Augusta Ave) | Happy hour | Mon–Fri | 17:00–20:00 | $6 rail drinks; $6 Burdock or Eastbound pints; $5 Burdock or Eastbound cans. Billed as its summer 2026 happy hour; still posted in late October. | High (graphic made May 2026) | [Handlebar website (happy hour and weekly events)](https://thehandlebar.ca/), 2026-05 |
| Handlebar (159 Augusta Ave) | Happy hour | Sun | 15:00–18:00 | $6 Burdock Deluxe pints. During the Sunday singer-songwriter matinee. | High (graphic made May 2026) | [Handlebar website (happy hour and weekly events)](https://thehandlebar.ca/), 2026-05 |
| Midnight Market (434 College St) | Happy hour | Wed–Sun | 17:30–19:30 | $5 Midnight Lager draft; $10 hi-balls; $5 snacks: fries, truffle fries, edamame, turnip cake; $8 chicken karaage or bulgogi dumplings; $15 wafu pastas. | High (matches an Oct 25, 2026 aggregator copy) | [Midnight Market website (“Happy Hour & Daily Specials”)](https://www.midnightmkt.ca/), 2026-10 |
| Midnight Market (434 College St) | Daily special (Wednesday) | Wed | All open hours | $5 Tsingtao. | High (matches an Oct 25, 2026 aggregator copy) | [Midnight Market website (“Happy Hour & Daily Specials”)](https://www.midnightmkt.ca/), 2026-10 |
| Midnight Market (434 College St) | Daily special (Thursday) | Thu | All open hours | $7 rail mixed drinks. | High (matches an Oct 25, 2026 aggregator copy) | [Midnight Market website (“Happy Hour & Daily Specials”)](https://www.midnightmkt.ca/), 2026-10 |
| Midnight Market (434 College St) | Daily special (Sunday) | Sun | All open hours | $5 Midnight Lager. | High (matches an Oct 25, 2026 aggregator copy) | [Midnight Market website (“Happy Hour & Daily Specials”)](https://www.midnightmkt.ca/), 2026-10 |
| Chat Bar (307 Spadina Ave.) | Happy hour | Sun–Thu | 21:00–02:00 (next day) | Half-price beer; Buy 2 skewers, get 1 free (cartilage, wings or sausage). Late-night happy hour, Sun–Thu after 9 PM. | Medium (venue’s Instagram post, Feb 2026) | [Chat Bar post on its website (Instagram feed), Feb 2026](https://chatbar.ca/), 2026-02-24 |
| Kos (61 Bellevue Ave) | Happy hour | Mon | 16:00–20:00 | $15.95 chicken fingers and a pint. | High (menu updated Nov 2025) | [Kos menu (Happy Hour tab, updated Nov 2025)](https://www.kosrestaurant.ca/menu), 2025-11 |
| Kos (61 Bellevue Ave) | Happy hour | Tue | 16:00–20:00 | $15.95 veggie cheese quesadilla and a pint. | High (menu updated Nov 2025) | [Kos menu (Happy Hour tab, updated Nov 2025)](https://www.kosrestaurant.ca/menu), 2025-11 |
| Kos (61 Bellevue Ave) | Happy hour | Wed | 16:00–20:00 | $15.95 nachos and a pint. | High (menu updated Nov 2025) | [Kos menu (Happy Hour tab, updated Nov 2025)](https://www.kosrestaurant.ca/menu), 2025-11 |
| Kos (61 Bellevue Ave) | Happy hour | Thu | 16:00–20:00 | $15.95 chicken wings and a pint. | High (menu updated Nov 2025) | [Kos menu (Happy Hour tab, updated Nov 2025)](https://www.kosrestaurant.ca/menu), 2025-11 |
| Kos (61 Bellevue Ave) | Happy hour | Fri | 16:00–20:00 | $15.95 cheeseburger and a pint. | High (menu updated Nov 2025) | [Kos menu (Happy Hour tab, updated Nov 2025)](https://www.kosrestaurant.ca/menu), 2025-11 |
| Voodoo Child (388 College St) | Happy hour | Daily | 17:00–19:00 | $12 cocktails; $12 wine by the glass; $5 lager; $5 Blackbird shots. | High (© 2026) | [Voodoo Child website](https://voodoochildcafe.com/), 2026-10 |
| Midnight Arcade (158 Augusta Ave) | Happy hour | Wed–Sun | 18:00–21:00 | $20 pizzas; $10 wings; $6 MA lager; $6 desserts. | High | [Midnight Arcade website](https://www.midnightarcade.ca/), 2026-10 |
| Midnight Arcade (158 Augusta Ave) | Daily special (Wednesday) | Wed | All open hours | $20 soju bottles. | High | [Midnight Arcade website](https://www.midnightarcade.ca/), 2026-10 |
| Midnight Arcade (158 Augusta Ave) | Daily special (Thursday) | Thu | All open hours | $6 rail shots; $6 White Claws. | High | [Midnight Arcade website](https://www.midnightarcade.ca/), 2026-10 |
| Midnight Arcade (158 Augusta Ave) | Daily special (Friday) | Fri | 18:00–22:00 | $6 tequila shots. | High | [Midnight Arcade website](https://www.midnightarcade.ca/), 2026-10 |
| Midnight Arcade (158 Augusta Ave) | Daily special (Sunday) | Sun | All open hours | $5 Sapporo bottles; $6 tequila shots. | High | [Midnight Arcade website](https://www.midnightarcade.ca/), 2026-10 |
| Kensington Socials (204 Augusta Ave) | Happy hour | Tue–Fri | 13:00–16:00 | $7 draft beer; $6 bottled beer; $7 signature cocktails; $13 margaritas. Times from its own site; a directory listing checked in July says Mon–Fri 2–5 PM. | Medium-high (undated; a July directory listing says Mon–Fri 2–5 PM) | [Kensington Socials website](https://kensingtonsocials.com/), 2026-10 |
| Burdock Kensington Tavern (184 Augusta Ave) | Happy hour | Fri | 14:00–17:00 | Half-price Ducks IPA and Deluxe pints. “Duck Out Early” Fridays. | High (© 2026) | [Burdock Kensington Tavern page](https://burdockbrewery.com/pages/tavern), 2026-10 |
| TacoTaco (319 Augusta Ave) | Happy hour | Mon–Thu | 17:00–19:00 | $9 margaritas; $6 beer, shots or mixed drinks; $15 three tacos (same kind). | Medium-high (undated; new owners) | [TacoTaco menu page (“Happy Hour Specials”)](https://eattaco.ca/menu), 2026-10 |
| T.O. Dickens (276 Augusta Ave) | Happy hour | Mon–Thu | 15:00–23:00 | $9 cocktails. Not on holidays. | Medium-high (undated) | [T.O. Dickens website (“Daily Happy Hours”)](https://todickens.com/), 2026-10 |
| T.O. Dickens (276 Augusta Ave) | Happy hour | Fri, Sat | 15:00–23:00 | $5 domestic rail shots. Not on holidays. | Medium-high (undated) | [T.O. Dickens website (“Daily Happy Hours”)](https://todickens.com/), 2026-10 |
| T.O. Dickens (276 Augusta Ave) | Daily special (Sunday brunch) | Sun | All open hours | $7 Caesars; $7 mimosas. | Medium-high (undated) | [T.O. Dickens website (“Daily Happy Hours”)](https://todickens.com/), 2026-10 |
| Sinaloa Factory (181 Augusta Ave) | Daily special (Birria Monday) | Mon | All open hours | 2-for-1 birria with 2 drinks. | Medium (chain-wide, undated) | [Sinaloa Factory promotions page (all locations, undated)](https://www.sinaloafactory.com/promotions), 2026-10 |
| Sinaloa Factory (181 Augusta Ave) | Daily special (Taco Tuesday) | Tue | All open hours | $5 tacos. | Medium (chain-wide, undated) | [Sinaloa Factory promotions page (all locations, undated)](https://www.sinaloafactory.com/promotions), 2026-10 |
| Sinaloa Factory (181 Augusta Ave) | Daily special (All-you-can-eat Wednesday) | Wed | All open hours | $24.95 all-you-can-eat Mexican sushi. | Medium (chain-wide, undated) | [Sinaloa Factory promotions page (all locations, undated)](https://www.sinaloafactory.com/promotions), 2026-10 |
| Sinaloa Factory (181 Augusta Ave) | Daily special (Aguachile Thursday) | Thu | All open hours | $19.95 aguachile with 1 drink. | Medium (chain-wide, undated) | [Sinaloa Factory promotions page (all locations, undated)](https://www.sinaloafactory.com/promotions), 2026-10 |
| Pizzeria Via Mercanti (188 Augusta Ave) | Daily special (Weekday lunch) | Mon–Fri | 12:00–15:00 | $18 small Margherita pizza and Mercanti salad. Dine-in only, plus tax. | High (© 2026) | [Pizzeria Via Mercanti specials page](https://www.pizzeriaviamercanti.ca/specials), 2026-10 |
| Kensington Jerk & Pasta (61 Kensington Ave) | Happy hour | Tue–Sun | 16:00–18:00 | $6 shots. | Medium-high (undated) | [Kensington Jerk & Pasta drinks menu](http://jerkandpasta.com/), 2026-10 |
| Free Times Cafe (320 College St) | Happy hour | Tue–Sun | 16:00–20:00 | “Happy Hour 4–8pm Everyday” on the patio, bistro and bar. Prices not published. | Medium (no prices) | [Free Times Cafe website and drinks menu](https://www.freetimescafe.com/), 2026-10 |
| Free Times Cafe (320 College St) | Daily special (House special) | Tue–Sun | All open hours | $5 tequila shots. | Medium (no prices) | [Free Times Cafe website and drinks menu](https://www.freetimescafe.com/), 2026-10 |
| Tony’s (283 Augusta Ave) | Happy hour | Mon, Wed–Sun | 14:00–17:00 | Aperitivo hours: wine and snacks. Prices not published. | Medium (hours conflict) | [Tony’s website ($21 prix fixe, aperitivo, $10 pasta lunch)](https://www.tonyskensington.ca/21-prix-fixe), 2026-10 |
| Tony’s (283 Augusta Ave) | Happy hour | Mon, Wed–Sun | 17:00–19:00 | $21 prix fixe: pasta, salad, focaccia and a cookie. Google lists a 6 PM close except Fri–Sat (7 PM), so check before going late. | Medium (hours conflict) | [Tony’s website ($21 prix fixe, aperitivo, $10 pasta lunch)](https://www.tonyskensington.ca/21-prix-fixe), 2026-10 |
| Tony’s (283 Augusta Ave) | Daily special (Pasta lunch) | Mon, Wed–Sun | All open hours | $10 pasta lunch. | Medium (hours conflict) | [Tony’s website ($21 prix fixe, aperitivo, $10 pasta lunch)](https://www.tonyskensington.ca/21-prix-fixe), 2026-10 |

### Table B: weak, old or unpriced claims (held back)

| Venue (address) | Claim | Source and date | Why it’s held back |
|---|---|---|---|
| Pizzeria Via Mercanti (188 Augusta) | “Locals Wednesdays, half-price wine Thursdays” | Search description of its [specials page](https://www.pizzeriaviamercanti.ca/specials), live Oct 2026 | Only in the page’s hidden description; the page itself shows neither deal, and no terms. |
| Pizzeria Via Mercanti | Weekday lunch: a Peroni with one of four pizzas, “now available all week long” | [Specials page](https://www.pizzeriaviamercanti.ca/specials) | No price shown. (The $18 pizza-and-salad lunch is loaded.) |
| El Rey Mezcal Bar (2a Kensington) | “$4 off margaritas” at happy hour | A Yelp review, seen only as a search snippet (undated) | El Rey’s own [menu PDF](http://elreybar.com/menu.pdf), saved Oct 26, 2026, has no happy hour. |
| Daldongnae (355 Spadina) | Lunch special every day until 5 PM | [blogTO, Mar 5, 2025](https://www.blogto.com/restaurants/daldongnae-spadina-toronto/) | No prices. |
| The Green Room (414 College) | “Regular specials and bar rail under five bucks” | [blogTO, Feb 16, 2018](https://www.blogto.com/bars/green-room-toronto/) | Too old and not specific. |
| Handlebar (159 Augusta) | Wednesdays: $5 rail drinks, $5 premium pints, $5 dinners | [Toronto Life, Dec 5, 2012](https://torontolife.com/food/toronto-happy-hour/) | Replaced by its 2026 happy hour (loaded). |
| Last Temptation (12 Kensington Ave) | “Daily specials”; karaoke Mon, Wed and Thu | Reviews quoted on its [website](https://lasttemptation.shop/) | No days, items or prices. |
| Grey Gardens (199 Augusta) | Appears on Yelp’s “Happy Hour near Kensington Market” list | Yelp search, seen as a snippet (Yelp blocks direct reads) | No terms; its own site lists none. |
| Midnight Market (434 College) | “BOGO appetizers, beer $5” | [Fringinto 2026 list](https://www.fringinto.com/best-happy-hours-toronto/) | Superseded by the venue’s own list ($5 and $8 snacks), which is loaded. |
| Kensington Socials (204 Augusta) | Mon–Fri 2–5 PM happy hour | [Restaurantica, last checked Jul 2](https://www.restaurantica.com/on/toronto/kensington-socials) | Conflicts with the venue’s own Tue–Fri 1–4 PM; the venue’s times are loaded with a note. |
| Koi Koi Saké Bar (170 Baldwin) | “Happy Hour” tag | OpenTable listing, seen only as a search snippet | blogTO marks it closed; 170 Baldwin now houses other businesses. |
| Big Trouble (460 Dundas St W, 2nd floor) | 5:30–7:30 PM: beer $6, cocktails $10 + food | [Fringinto 2026 list](https://www.fringinto.com/best-happy-hours-toronto/) | Outside the area: 460 Dundas is east of Spadina. Belongs to a Chinatown area if one is added. |

### Table C: checked, no deal found (in `directory.json`, best first)

| Venue (address) | Status | Happy hour | What was checked |
|---|---|---|---|
| Ronnie’s Local 069 (69 Nassau St) | Open (Google), 4.4★ (686) | None found | No website (Instagram only); blogTO listing is from 2007 |
| Embassy Bar (223 Augusta Ave) | Open (Google), 4.4★ (425) | None found | No website; [blogTO profile, Dec 2021](https://www.blogto.com/eat_drink/2021/12/embassy-bar-toronto/) gives regular prices only ($5 PBR cans) |
| Pamenar (307 Augusta Ave) | Open (Google), 4.3★ (1205) | None found | No website listed (Instagram only) |
| El Rey Mezcal Bar (2a Kensington Ave) | Open (Google), 4.4★ (1966) | None found | [Menu PDF](http://elreybar.com/menu.pdf), saved Oct 26, 2026: no happy hour (see Table B) |
| Grossman’s Tavern (377 Spadina Ave.) | Open (Google), 4.4★ (624) | None found | [Website](https://grossmanstavern.com/) menu and events: regular prices only ($10 burger deluxe) |
| Supermarket Bar & Variety (268 Augusta Ave) | Open (Google), 4.1★ (920) | None found | [Website](https://www.supermarketto.ca/events) hours, events, bottle service: no drink specials |
| The Little Jerry (418 College St) | Open (Google), 4.6★ (464) | None found | [Menu](https://thelittlejerry.com/menu/) and beer/wine PDFs: none |
| Lonely Diner (432 College St) | Open (Google), 4.8★ (187) | None found | No website; [Streets of Toronto, Sep 2, 2025](https://streetsoftoronto.com/food/restaurants/this-lonely-new-diner-is-anything-but-meet-the-star-bartenders-reviving-a-toronto-classic/) opening piece: none |
| Cloak & Dagger (394 College St) | Open (Google), 4.4★ (489) | None found | Facebook only; [blogTO listing](https://www.blogto.com/bars/cloak_dagger/): none |
| Slice of Life (409 College St) | Open (Google), 4.6★ (222) | None found | [Website](https://www.sliceoflifebar.com/) is a script-only app with no readable menu |
| Sampo (370 College St) | Open (Google), 4.6★ (134) | None found | [Website and menu](http://www.sampobar.com/menu.html): none (closed Wednesdays) |
| The Green Room (414 College St) | Open (Google), 4.1★ (932) | None found | No website; only a [2018 blogTO listing](https://www.blogto.com/bars/green-room-toronto/) (see Table B) |
| Toby’s Pub & Eatery (411 College St) | Open (Google), 4.2★ (1205) | None found | [Website](http://tobyspub.ca/): none |
| Last Temptation (12 Kensington Ave) | Open (Google), 4.2★ (641) | None found | Website is a third-party template; reviews mention “daily specials” without terms (Table B) |
| Lola (40 Kensington Ave) | Open (Google), 4.6★ (54) | None found | No website or menu found |
| Rumble Pontiac (197 1/2 Baldwin St) | Open (Google), 5★ (33) | None found | No website; no coverage found (at 197½ Baldwin, the old Thirsty and Miserable spot) |
| Bistro 422 (422 College St) | Open (Google), 4.4★ (333) | None found | Facebook only |
| Tapestry (224 Augusta Ave) | Open (Google), 4.4★ (142) | None found | Instagram only (live music room in the old Poetry Jazz Café space) |
| El Rancho (430 College St) | Open (Google), 3.8★ (1183) | None found | [Website](https://elrancho.ca/): Thu–Sat dance nights, no deals |
| NEST (423 College St) | Open (Google), 3.6★ (1085) | None found | [Website](https://www.nesttoronto.ca/): club nights, no deals |
| Grey Gardens (199 Augusta Ave) | Open (Google), 4.6★ (1059) | None found | [Website](https://greygardens.ca/) and OpenTable widget: none; appears on a Yelp “happy hour” list with no terms |
| Sunnys Chinese (60 Kensington Ave Units 6-14) | Open (Google), 4.4★ (1123) | None found | [Website](https://sunnyschinese.com/) and Oct 2026 private-event PDF: none |
| Quetzal (419 College St) | Open (Google), 4.6★ (1736) | None found | [Menu](https://www.quetzaltoronto.com/menu): none |
| DaNico (440 College St) | Open (Google), 4.5★ (537) | None found | [Website](https://www.danicotoronto.com/): none |
| Hawker (291 Augusta Ave) | Open (Google), 4.7★ (905) | None found | [Menus](https://www.hawker.to/menu) and tasting menus: none |
| Rikki Tikki (209 Augusta Ave) | Open (Google), 4.8★ (2137) | None found | [Website](https://rikkitikki.ca/) incl. bar menu: none |
| The Cottage Cheese (64 Oxford St) | Open (Google), 4.5★ (1527) | None found | [Menu](https://thecottagecheese.ca/menu/): none |
| Baazigar (189 Augusta Ave) | Open (Google), 4.5★ (1380) | None found | [Menu](https://www.baazigar.ca/our-menu): none |
| El Trompo (277 Augusta Ave) | Open (Google), 4.4★ (2326) | None found | [Menu](https://eltrompo.ca/menu/): none |
| Pancho y Emiliano (200 Augusta Ave) | Open (Google), 4★ (1078) | None found | [Menu](https://www.panchoyemiliano.com/menu): none |
| Placos Tacos (21 Kensington Ave) | Open (Google), 4.8★ (658) | None found | [Website](https://placostacos.com/): none |
| Isaan Der (327 Spadina Ave.) | Open (Google), 4.8★ (414) | None found | [Spadina menu](https://isaander.com/menu/spadina/) and news page: none |
| Pomegranate (420 College St) | Open (Google), 4.4★ (1229) | None found | [Website](https://pomegranatetoronto.com/): none |
| Tibet Café and Bar (51 Kensington Ave) | Open (Google), 4.5★ (380) | None found | [Menu](https://tibetcafeandbar.com/menu/): none |
| Korean Grill House (431 Spadina Ave.) | Open (Google), 4.8★ (2065) | None found | No website |
| Daldongnae (355 Spadina Ave.) | Open (Google), 4.7★ (442) | None found | [Menu](https://www.daldongnaebbq.com/menu); lunch special without prices (Table B) |
| Original Ka Chi (8 St Andrew St) | Open (Google), 4.7★ (2477) | None found | Website redirects to a broken address |
| The Famous Owl of Minerva (280 Spadina Ave, 2nd floor) | Open (Google), 4.3★ (836) | None found | [Menu](https://owlfamily.ca/menu/): none |
| Saigon Lotus (6 St Andrew St) | Open (Google), 4.6★ (1915) | None found | Website did not load |
| Ramen Isshin (421 College St) | Open (Google), 4.6★ (4540) | None found | [Website news](https://ramenisshin.com/): only a one-off 50% off on July 4, 2026 (expired) |
| Hacienda Las Americas (424 College St) | Open (Google), 4.7★ (644) | None found | Website did not load |
| August 8 (331 Spadina Ave.) | Open (Google), 4.4★ (2817) | None found | [Menus](https://august8.ca/main-menu/): all-you-can-eat price is the regular price |
| Phở Hưng (350 Spadina Ave.) | Open (Google), 4.1★ (3145) | None found | [Website](http://phohung.ca/): none |
| Rol San (390 Spadina Ave.) | Open (Google), 4★ (4749) | None found | Website is a third-party template: none |
| Wok Theory (530 Dundas St W) | Open (Google), 4.4★ (537) | None found | [Menu](https://woktheory.com/food-menu/): none |
| Mother’s Dumplings (421 Spadina Ave.) | Open (Google), 4.1★ (3455) | None found | [Website](https://mothersdumplings.com/): none |
| Dumpling House (328 Spadina Ave.) | Open (Google), 4.1★ (2804) | None found | [Website](https://restaurantwebexpert.com/dumplinghouse/): none |
| Hao’s Bistro (339 Spadina Ave.) | Open (Google), 4.9★ (544) | None found | [Website](https://www.haosbistro.com/): none |
| A Szechuan (440 Spadina Ave.) | Open (Google), 4.5★ (1025) | None found | No website |
| Thai Country Kitchen (412 Spadina Ave.) | Open (Google), 4.5★ (620) | None found | No website |
| Som Tum Jinda (356 College St) | Open (Google), 4.7★ (200) | None found | [Website](https://somtumjinda.ca/): none |
| Ajisen Ramen (332 Spadina Ave.) | Open (Google), 4.5★ (2983) | None found | [Chain website](https://www.ajisenramen.ca/menu) menus and locations: none |
| Anh Dao (383 Spadina Ave.) | Open (Google), 4.4★ (1285) | None found | No website |
| KL Kitchen (536 Dundas St W Main Floor) | Open (Google), 4.1★ (448) | None found | [Menu page](https://klkitchentoronto.com/menu/): none (open to 4 AM Fri–Sat) |
| New Sky (444 Spadina Ave.) | Open (Google), 4.2★ (1358) | None found | [Website](https://newskytoronto.com/): none |
| Sang’s Great Seafood (343 Spadina Ave.) | Open (Google), 4.2★ (691) | None found | No website |
| New Ho King (410 Spadina Ave.) | Open (Google), 3.8★ (1306) | None found | [Website](https://newhokingon.com/) late-night menu: regular prices |
| King’s Noodle (296 Spadina Ave.) | Open (Google), 3.8★ (2035) | None found | [Website](https://kingsnoodle.ca/): none |
| Pho Pasteur (525 Dundas St W) | Open (Google), 3.8★ (1300) | None found | [Website](https://phopasteur.ca/): none |
| Taste of China (338 Spadina Ave.) | Open (Google), 3.8★ (1029) | None found | [Website](https://tasteofchinarestaurant.ca/): none |
| Koi Japan Sushi (281 Augusta Ave) | Open (Google), 4.8★ (572) | None found | [Website](https://www.koijapansushi.com/): none |
| Mamacita’s (305 Augusta Ave) | Open (Google), 4.5★ (178) | None found | No website |
| Nina’s Brunch (238 Augusta Ave) | Open (Google), 4.7★ (637) | None found | No website |

### Table D: left out (94 candidates)

Every candidate not in `deals.json` or `directory.json` is here, by reason. Names are as Google gives them.

| Group | Spots | Why |
|---|---|---|
| Food courts and stalls (23) | Latin American Food Court, Xolotl Mexican Cuisine, La Chilaca Taqueria, Birria Catrina, Nile Express, El Gordo Fine Foods, Diablos Tacos, Jungli, La Bikina Mexican Street Food, BIM Street Eats, Momo Kensington market, Casa habanero, Tropic North, Taco House Pork Carnitas, Chicken chipotle smokehouse, Los Gordos Mexican Food, Sabor macho, Gigi’s Street Eats, CHEF HU’S Chinese Food, JamICan, Jus Street Eats, Momo Corner, Ethio & Eri Cafe | Stalls in the 210 and 214 Augusta food halls, the 160–161 Baldwin counters, 268 Augusta and the 707 Dundas container market. (Birria Catrina’s sit-down room at 267 Augusta is below.) |
| Takeout and fast-food counters (28) | Dolyang love&Fire Momo, Rob’s pupusas, Jumbo Empanadas, Rey Mango, Cachito From Mexico, I Love Churros, Ugly Delicious Toronto, Otto’s Berlin Döner, Tacos 101 and Fruta Libre, Frank Ranalli's Pizza and Italian Beef, Tres Piggies Carnitas, MacsFamous444, Fresco's Fish and Chips, Flava Ceen Express, 大铁牛鸡蛋灌饼DATIENIU Egg Guanbing, Street Food Bento & Poke Bowl, Mix It Up, Grilled Fish, Jian Bing Club, 葵阿姨螺蛳粉(downtown) Aunt Kui Rice Noodles, Mexi-Pak FusionTaco´S, 6IXTY WINGS, Simple Burger, The Bollywood Tacos, Pasta Bout It, Burger Pop, Manic Pasta, Birria Catrina Restaurant | Order-at-the-counter spots. Otto’s, Ugly Delicious, Fresco’s, Jumbo Empanadas, Tacos 101 and 6IXTY Wings sell beer but are counters or takeout first; Birria Catrina has no drinks on its online menu. |
| No sign they serve alcohol (21) | Teow Tem Toh, Okay Maguey, Latin Taste, French Toast, Zicatela, COAL AND CURRY, Saigon Alley, Grandma Kitchen, Machida Shoten (College St), Taste Bender Canada, Ann’s Donburi, Ohiru Cafe, Forsure Chaoshan Beef Hotpot 福牛顺潮汕牛肉火锅, Pho Ha Noi, 来福砂锅王 Fortune King Hotpot, Sizzler Kabab, Zafoon Middle Eastern Restaurant., Bảnk Bao, California Beef Noodle King U.S.A, Tagpuan (Kensington), Swatow Restaurant | Google has no drinks listed (or says no wine or cocktails) and no drinks menu turned up. |
| Not a bar or restaurant (8) | Coral Sea, Fong On Foods Ltd., Cocktail Emporium, Planet Traveler Hostel, Virtual Cuisines Canada, Burdock Brewery & Beer Shop, Moskitto Bar, The Moonlight Lounge | A fish market, a grocer, a bar-supply shop, a hostel and a ghost kitchen. Burdock’s Denison Square site is the production brewery and bottle shop (tastings by ticket); its tavern next door is listed. “Moskitto Bar” is a band whose Google pin sits on Pamenar ([moskittobar.com](https://www.moskittobar.com/)). The Moonlight Lounge behind TacoTaco is rented by the hour for events ([eattaco.ca/events](https://eattaco.ca/events)). |
| Karaoke rooms and pool halls (6) | 8090Karaoke, K-ONE KTV, B Boss Ktv, Karaoke, iCue Billiard & Lounge, TNL Zone Billiard Club | Private-room karaoke (KTV) and billiard halls rather than bars. B Boss KTV’s “happy hour” is a cash-only room rate, not a drink or food deal ([bbossktv.com](https://bbossktv.com/)). |
| Unclear, very few reviews, or a broken site (7) | Le Chateau du Maison Bleu, hush hush, Myst Toronto, The Den, Tabuleh Rasa, Lan city BBQ, Sushi Hub | Le Chateau du Maison Bleu has 2 reviews and no details. hush hush (site returns 404), Myst (2.8★) and The Den (5 reviews, no hours) share 423 College with NEST, which is listed. Tabuleh Rasa has a 1★ rating and no hours. Lan City BBQ and Sushi Hub are small, mostly takeout spots left off to keep the list to places people go out to. |
| Website now spam (1) | Canton Chilli | cantonchilli.com now hosts an online-casino article, and the app would link it from candidates.json. Left out until the restaurant has a working site or the link is removed. |

## Notes on the deals

**Trinity Common’s week is the area’s best value, and it’s on a page few people would find.** The “Daily Specials / Contact” page lists Monday’s $10 pint of Beau’s and a shot, Tuesday’s buck-a-shuck oysters and $7 Woodhouse, Wednesday’s half-price wine bottles, Thursday’s $10 margaritas, $5 tequila shots and $5 tacos (three for $12), Friday’s $5 rail shots, $6 mixed drinks and $6 16 oz house lager, and Saturday’s $12 rail doubles ([Trinity Common](https://trinitycommon.ca/contact/)). The page is undated and its footer says © 2025, so it’s worth a quick check in person, but nothing contradicts it.

**Sneaky Dee’s has both a happy hour and a full week of specials.** Its home page gives “happy hour(s) – 11am to 4pm” with $4 drinks (tax in) and $10 personal nachos, then specials “all hours”: Monday burgers ($12 bacon cheeseburger, $10 veggie, $30 nachos and a pitcher), Tuesday half-price fajitas and $3 tacos, Wednesday half-price nachos, Thursday $30 wings and a pitcher, $11 weekend brunch items, and $6 mixed drinks, $6 select beers and $15 pitchers at any time ([Sneaky Dee’s](https://www.sneakydees.com/)). No days are given for the 11–4 happy hour, so it’s stored as daily.

**Casa Morales prints regular and happy-hour prices side by side.** Its cantina menu shows the Morales margarita at $18 and $11, the espresso martini at $20 and $12, flavour margaritas, mezcalitas, sangría and Aperol spritz at $16 and $11, and beer of the day and rail shots at $10 and $5. Happy hour runs noon–2 PM (during brunch), 5–7 PM and 9 PM to close, Wednesday to Sunday; it’s closed Monday and Tuesday ([Casa Morales](https://www.casamorales.ca/)). Close is taken from Google: 10 PM Sun, Wed and Thu, 11 PM Fri–Sat.

**FreePlay’s prices are the freshest in the area.** An October 8, 2026 post sets “retro pricing” of $6 vodka drinks and $6 draft at all times, and a weekday 3–5 PM happy hour with $5 draft, a $4 tall can and $4 PBR Strong Iced Tea. Arcade entry is $5 Sun–Thu and $10 Fri–Sat ([FreePlay](https://www.freeplaytoronto.com/post/retro-games-retro-vibes-retro-prices)).

**Handlebar’s happy hour graphic is named for summer 2026 but is still on the site.** The image file, saved in May 2026, reads “Mon–Fri 5–8pm: $6 rail drinks, $6 Burdock/Eastbound pints, $5 Burdock/Eastbound cans”. A second graphic gives $6 Burdock Deluxe pints at the Sunday 3–6 PM singer-songwriter matinee ([Handlebar](https://thehandlebar.ca/)). Recheck in winter in case the summer deal ends.

**Midnight Market and Midnight Arcade both publish full lists.** Midnight Market (its site footer says “Midnight Snack Bar”) has 5:30–7:30 PM happy hour every night it’s open (Wed–Sun) and all-day Wednesday, Thursday and Sunday drink prices ([Midnight Market](https://www.midnightmkt.ca/)); an aggregator copy dated October 25, 2026 matches ([UltimateHappyHours](https://ultimatehappyhours.com/location/toronto-on/)). Midnight Arcade, upstairs at 158 Augusta, has 6–9 PM happy hour ($20 pizzas, $10 wings, $6 lager) and a special for each night ([Midnight Arcade](https://www.midnightarcade.ca/)). Lonely Diner (432 College), which grew out of the Lonely Bar inside Midnight Market and opened in 2025, publishes no deals yet ([Streets of Toronto, Sep 2, 2025](https://streetsoftoronto.com/food/restaurants/this-lonely-new-diner-is-anything-but-meet-the-star-bartenders-reviving-a-toronto-classic/)).

**Chat Bar’s late-night happy hour comes from a post, not a menu.** A February 2026 Instagram post shown on its website offers, Sunday to Thursday after 9 PM, half-price beer and a free third skewer when you order two (chicken cartilage, honey or garlic wings, or sausage) ([Chat Bar](https://chatbar.ca/)). Graded Medium until it appears on a menu.

**Kos ties a pint to a different dish each weekday.** The “Happy Hour!” tab of its menu (4–8 PM, updated November 2025) lists chicken fingers (Mon), a veggie cheese quesadilla (Tue), nachos (Wed), wings (Thu) and a cheeseburger (Fri), each with a pint for $15.95 ([Kos](https://www.kosrestaurant.ca/menu)). These are stored as one window per weekday.

**Smaller or less certain listings.** Voodoo Child’s daily 5–7 PM ($12 cocktails and wine, $5 lager and Blackbird shots) is on its home page ([Voodoo Child](https://voodoochildcafe.com/)). Burdock’s new Kensington Tavern has one deal, “Duck Out Early”: half-price Ducks IPA and Deluxe pints, Friday 2–5 PM ([Burdock](https://burdockbrewery.com/pages/tavern)). TacoTaco, now under new owners, lists Mon–Thu 5–7 PM: $9 margaritas, $6 beer, shots and mixed drinks, and three tacos for $15 ([TacoTaco](https://eattaco.ca/menu)). T.O. Dickens, open around the clock, calls 3–11 PM its daily happy hours: $9 cocktails Mon–Thu and $5 domestic rail shots Fri–Sat, not on holidays, with $7 Caesars and mimosas at Sunday brunch ([T.O. Dickens](https://todickens.com/)). Sinaloa Factory’s weekday promos (2-for-1 birria with two drinks on Monday, $5 tacos on Tuesday, $24.95 all-you-can-eat Mexican sushi on Wednesday, $19.95 aguachile with a drink on Thursday) are on a promotions page shared by all its locations and carry no date ([Sinaloa Factory](https://www.sinaloafactory.com/promotions)). Pizzeria Via Mercanti has an $18 dine-in lunch of a small Margherita and a salad, weekdays noon–3 PM ([Via Mercanti](https://www.pizzeriaviamercanti.ca/specials)). Kensington Jerk & Pasta (the former Rasta Pasta) has $6 shots 4–6 PM daily ([Kensington Jerk & Pasta](http://jerkandpasta.com/)).

**Two listings have a happy hour with no prices.** Free Times Cafe says “Happy Hour 4–8pm Everyday” but its drinks menu shows only regular prices and a standing $5 tequila shot ([Free Times Cafe](https://www.freetimescafe.com/)). Tony’s (283 Augusta) lists “Aperitivo hour(s)” 2–5 PM without prices and a $21 prix fixe 5–7 PM (pasta, salad, focaccia and a cookie). Google’s hours close Tony’s at 6 PM except Friday and Saturday (7 PM), so the prix fixe window may be shorter than the site says ([Tony’s](https://www.tonyskensington.ca/21-prix-fixe)). Both are stored with `"specials": []` or a note, as `RESEARCH.md` asks.

## Closures, oddities and things for the app

- **Closed:** Cold Tea (left 60 Kensington Ave at the end of 2020, and announced in July 2025 that its later Queen West home would close for good: [blogTO, Jul 23, 2025](https://www.blogto.com/eat_drink/2025/07/toronto-speakeasy-cold-tea-closing/)). Thirsty and Miserable (closed at 197 Baldwin on December 30, 2021: [blogTO, Dec 2, 2021](https://www.blogto.com/eat_drink/2021/12/thirsty-miserable-toronto-closing/); it reopened on Dundas West in 2024: [blogTO, Sep 2024](https://www.blogto.com/eat_drink/2024/09/thirsty-miserable-golden-peacock-dundas-west/)). Koi Koi Saké Bar (170 Baldwin, marked closed on [blogTO](https://www.blogto.com/bars/koi-koi-sake-bar-toronto)). Poetry Jazz Café’s space at 224 Augusta is now Tapestry (listed).
- **Canton Chilli’s website (cantonchilli.com) now hosts online-casino content.** Since the app takes websites from `candidates.json`, the spot is left out; if it’s ever listed, drop the link.
- **“Moskitto Bar” at 307 Augusta is a band, not a venue.** Its Google pin shares Pamenar’s address and links to the band’s site.
- **Midnight Market** is Google’s name; the venue’s site footer says Midnight Snack Bar and Fringinto uses that name. The app uses Google’s.
- **Supermarket Bar & Variety** has no hours on Google but is open: its site lists Mon 6–11 PM, Tue–Wed 5–11 PM, Thu 5 PM–midnight, Fri 5 PM–2 AM, Sat noon–2 AM, Sun noon–1 AM ([Supermarket](https://www.supermarketto.ca/events)).
- **Chains:** none of the 176 candidates are tagged `chain`. **Ajisen Ramen** (332 Spadina) belongs to a large international chain and isn’t in `src/data/chains.ts`; suggest adding `'ajisen'`. Sinaloa Factory, Daldongnae, Isaan Der, Ramen Isshin, Korean Grill House, The Famous Owl of Minerva, August 8 and Burdock look like Toronto-area groups with a few locations each, so they’re treated as local (chains are allowed either way).

## What to check next

1. Instagram or a visit for the bars with no website, in order of likely payoff: Ronnie’s Local 069, Embassy Bar, Pamenar, Cloak & Dagger, Lonely Diner, Lola, Rumble Pontiac and Bistro 422.
2. OpenTable “Offers” for Grey Gardens, Sunnys Chinese, Hawker and Casa Morales, which all take OpenTable bookings; none could be read from here.
3. Prices for Free Times Cafe’s 4–8 PM happy hour and Tony’s aperitivo, and Tony’s real closing time.
4. Handlebar after the summer: whether the $6 happy hour carries on into winter.
5. Whether Pizzeria Via Mercanti still runs “locals Wednesdays” and half-price wine Thursdays.
