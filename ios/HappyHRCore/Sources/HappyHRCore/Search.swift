import Foundation

// Food types and search. A port of src/lib/food.ts and src/lib/search.ts.
// Search: what someone types, plus what they picked from the browse tiles (drinks, food,
// places) and when. Typing is forgiving: accents, apostrophes and case don't matter, a word
// can be half typed or have a typo, and words for kinds of things ("beer", "music") work
// like the tiles.
// The food types come from the server (GET /api/venues → foodTypes), so new
// ones need no app update.

// MARK: - Food

/// A special together with the daily special it belongs to, if any.
public struct SpecialRef: Hashable, Sendable {
    public var special: Special
    public var daily: DailySpecial?
}

/// Every special a venue offers: happy hours first, then daily specials.
public func allSpecials(_ venue: Venue) -> [SpecialRef] {
    venue.happyHours.flatMap { $0.specials.map { SpecialRef(special: $0, daily: nil) } }
        + venue.daily.flatMap { d in d.specials.map { SpecialRef(special: $0, daily: d) } }
}

private func mentions(_ text: String, _ words: [String]) -> Bool {
    let lower = text.lowercased()
    return words.contains { lower.contains($0) }
}

/// Is this a food special that mentions the food type?
public func specialIsFood(_ special: Special, _ type: FoodTypeInfo) -> Bool {
    special.kind == .food && mentions(special.item, type.words)
}

/// The first food special that mentions this food type, if any.
public func foodSpecial(_ venue: Venue, _ type: FoodTypeInfo) -> SpecialRef? {
    allSpecials(venue).first { specialIsFood($0.special, type) }
}

public func servesFood(_ venue: Venue, _ type: FoodTypeInfo) -> Bool {
    if venue.food?.contains(type.id) == true { return true }
    return mentions(venue.category, type.words) || foodSpecial(venue, type) != nil
}

/// Food types that at least one of these venues serves, in catalog order.
public func foodTypes(in venues: [Venue], catalog: [FoodTypeInfo]) -> [FoodTypeInfo] {
    catalog.filter { type in venues.contains { servesFood($0, type) } }
}

// MARK: - Search

public enum SearchWhen: String, CaseIterable, Codable, Hashable, Sendable {
    case any, now, happy, daily

    public var label: String {
        switch self {
        case .any: "All"
        case .now: "On now"
        case .happy: "Happy hours"
        case .daily: "Daily specials"
        }
    }
}

public enum SearchSort: String, CaseIterable, Codable, Hashable, Sendable {
    case nearest, cheapest
}

/// Something picked from the browse tiles, shown as a token in the search bar.
public enum SearchToken: Hashable, Codable, Sendable, Identifiable {
    case drink(DrinkType)
    case food(FoodType)
    case place(VibeFilter)

    public var id: String {
        switch self {
        case let .drink(d): "drink-\(d.rawValue)"
        case let .food(f): "food-\(f.rawValue)"
        case let .place(p): "place-\(p.rawValue)"
        }
    }

    private enum CodingKeys: String, CodingKey { case group, id }

    public init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        switch try c.decode(String.self, forKey: .group) {
        case "drink": self = .drink(try c.decode(DrinkType.self, forKey: .id))
        case "food": self = .food(try c.decode(FoodType.self, forKey: .id))
        default: self = .place(try c.decode(VibeFilter.self, forKey: .id))
        }
    }

    public func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case let .drink(d): try c.encode("drink", forKey: .group); try c.encode(d, forKey: .id)
        case let .food(f): try c.encode("food", forKey: .group); try c.encode(f, forKey: .id)
        case let .place(p): try c.encode("place", forKey: .group); try c.encode(p, forKey: .id)
        }
    }

    var isPlace: Bool { if case .place = self { true } else { false } }
}

public struct SearchQuery: Codable, Hashable, Sendable {
    public var text: String
    public var when: SearchWhen
    /// Any of these (beer or wine).
    public var drinks: [DrinkType]
    /// Any of these (pizza or tacos).
    public var food: [FoodType]
    /// All of these (a patio and sports on TV).
    public var places: [VibeFilter]
    public var sort: SearchSort

    public init(text: String = "", when: SearchWhen = .any, drinks: [DrinkType] = [], food: [FoodType] = [], places: [VibeFilter] = [], sort: SearchSort = .nearest) {
        self.text = text
        self.when = when
        self.drinks = drinks
        self.food = food
        self.places = places
        self.sort = sort
    }

    public var tokens: [SearchToken] { drinks.map(SearchToken.drink) + food.map(SearchToken.food) + places.map(SearchToken.place) }

    public var isEmpty: Bool { text.trimmingCharacters(in: .whitespaces).isEmpty && when == .any && tokens.isEmpty }

    /// The query with the token added, or taken away if it's already there.
    public func toggling(_ token: SearchToken) -> SearchQuery {
        func flip<T: Equatable>(_ list: [T], _ item: T) -> [T] { list.contains(item) ? list.filter { $0 != item } : list + [item] }
        var q = self
        switch token {
        case let .drink(d): q.drinks = flip(drinks, d)
        case let .food(f): q.food = flip(food, f)
        case let .place(p): q.places = flip(places, p)
        }
        return q
    }
}

public struct SearchResult: Hashable, Identifiable, Sendable {
    public var ranked: RankedVenue
    /// Why it matched or what's worth knowing, e.g. "$12 Cheeseburger · Tue".
    public var note: String?
    /// On now: a live happy hour or a daily special running today.
    public var on: Bool
    /// With "Cheapest first": the cheapest special matching the drinks or food asked for.
    public var deal: PriceDeal?

    public var id: String { ranked.venue.id }
}

// MARK: Words

/// Lowercase words without accents or punctuation: "Añejo’s Café & Bar" → anejos, cafe, and, bar.
public func searchWords(_ text: String) -> [String] {
    let stripped = String(String.UnicodeScalarView(text.decomposedStringWithCanonicalMapping.unicodeScalars.filter { $0.properties.generalCategory != .nonspacingMark }))
    let lower = stripped.lowercased()
        .replacingOccurrences(of: "œ", with: "oe")
        .replacingOccurrences(of: "æ", with: "ae")
        .replacingOccurrences(of: "ß", with: "ss")
        .replacingOccurrences(of: "’", with: "")
        .replacingOccurrences(of: "'", with: "")
        .replacingOccurrences(of: "`", with: "")
        .replacingOccurrences(of: "&", with: " and ")
    var words: [String] = []
    var current = ""
    for scalar in lower.unicodeScalars {
        if ("a"..."z").contains(scalar) || ("0"..."9").contains(scalar) {
            current.unicodeScalars.append(scalar)
        } else if !current.isEmpty {
            words.append(current)
            current = ""
        }
    }
    if !current.isEmpty { words.append(current) }
    return words
}

/// Words that don't narrow anything down ("cheap beer near me" is about beer).
private let filler = Set(
    "a an and or the of at in on to for with near me my some any best good great cheap cheapest deal deals special specials happy hour hours spot spots place places bar bars food drink drinks tonight today now"
        .split(separator: " ").map(String.init))

/// Edits (add, drop or change a letter, or swap two side by side) to turn one word into another.
public func editDistance(_ a: String, _ b: String) -> Int {
    let a = Array(a.utf16), b = Array(b.utf16)
    var d = (0...a.count).map { i in (0...b.count).map { j in i == 0 ? j : j == 0 ? i : 0 } }
    if a.isEmpty || b.isEmpty { return d[a.count][b.count] }
    for i in 1...a.count {
        for j in 1...b.count {
            let cost = a[i - 1] == b[j - 1] ? 0 : 1
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
            if i > 1 && j > 1 && a[i - 1] == b[j - 2] && a[i - 2] == b[j - 1] { d[i][j] = min(d[i][j], d[i - 2][j - 2] + 1) }
        }
    }
    return d[a.count][b.count]
}

/// Typos forgiven in words nobody spells that way: none up to three letters, one from 4, two from 8.
private func typosAllowed(_ length: Int) -> Int { length >= 8 ? 2 : length >= 4 ? 1 : 0 }

/// Does a typed word match this word? The start of it ("marg"), or (with `typos`) the word
/// with a typo or two.
public func wordMatches(_ term: String, _ word: String, typos: Bool = true) -> Bool {
    if word.hasPrefix(term) { return true }
    let k = typos ? typosAllowed(term.count) : 0
    if k == 0 { return false }
    if abs(word.count - term.count) <= k && editDistance(term, word) <= k { return true }
    // A typo in a word still being typed: "margr" → "margaritas".
    return word.count > term.count && editDistance(term, String(word.prefix(term.count))) <= k
}

// MARK: Kinds of things

private struct Concept {
    var token: SearchToken
    var words: [String]
}

/// Words that mean a drink, food or kind of place (search.ts `CONCEPTS`); food words come from the catalog.
private func concepts(_ catalog: [FoodTypeInfo]) -> [Concept] {
    func food(_ f: FoodTypeInfo) -> Concept {
        var seen = Set<String>()
        let words = (searchWords(f.label) + f.words.flatMap(searchWords) + searchWords(f.id.rawValue)).filter { seen.insert($0).inserted && !filler.contains($0) }
        return Concept(token: .food(f.id), words: words)
    }
    return [
        Concept(token: .drink(.beer), words: ["beer", "beers", "pint", "pints", "lager", "ipa", "ale", "draft", "draught", "pilsner", "stout", "cider", "brewery", "brewpub", "taproom"]),
        Concept(token: .drink(.wine), words: ["wine", "wines", "vino", "rose", "sangria"]),
        Concept(token: .drink(.cocktail), words: ["cocktail", "cocktails", "martini", "martinis", "negroni", "mojito", "caesar", "caesars", "highball", "mule", "mixed"]),
        Concept(token: .drink(.tequila), words: ["tequila", "mezcal", "margarita", "margaritas", "marg", "margs", "paloma"]),
        Concept(token: .drink(.shot), words: ["shot", "shots", "shooter", "shooters"]),
        Concept(token: .drink(.bubbly), words: ["bubbly", "bubbles", "prosecco", "cava", "champagne", "sparkling", "spritz", "mimosa", "mimosas", "bellini", "aperol"]),
    ] + catalog.map(food) + [
        Concept(token: .place(.patio), words: ["patio", "patios", "outdoor", "outdoors", "outside", "terrace", "courtyard"]),
        Concept(token: .place(.liveMusic), words: ["music", "live", "band", "bands", "concert", "gig", "gigs", "jazz", "dj", "djs"]),
        Concept(
            token: .place(.sports),
            words: ["sports", "sport", "game", "games", "tv", "hockey", "basketball", "football", "soccer", "baseball", "leafs", "raptors", "jays", "ufc"]),
        Concept(token: .place(.trivia), words: ["trivia", "quiz"]),
        Concept(token: .place(.openLate), words: ["late", "latenight", "midnight"]),
        Concept(token: .place(.groups), words: ["group", "groups", "party", "parties", "birthday"]),
        Concept(token: .place(.dogs), words: ["dog", "dogs", "pup", "puppy", "pet"]),
        Concept(token: .place(.openNow), words: ["open"]),
    ]
}

/// The kinds of things a typed word means: the word, a start of three letters or more, or
/// (with `typos`) the word with typos.
public func conceptsFor(_ term: String, typos: Bool = true, catalog: [FoodTypeInfo]) -> [SearchToken] {
    let k = typos ? typosAllowed(term.count) : 0
    return concepts(catalog).filter { c in
        c.words.contains { w in w == term || (term.count >= 3 && w.hasPrefix(term)) || (k > 0 && editDistance(term, w) <= k) }
    }.map(\.token)
}

private func fits(_ venue: Venue, _ token: SearchToken, _ clock: Clock, _ catalog: [FoodTypeInfo]) -> Bool {
    switch token {
    case let .drink(d): servesDrink(venue, d)
    case let .food(f): catalog.first { $0.id == f }.map { servesFood(venue, $0) } ?? false
    case let .place(p): hasVibe(venue, p, at: clock)
    }
}

/// Does the special count as that drink or food (places have no specials)?
private func specialFits(_ special: Special, _ token: SearchToken, _ catalog: [FoodTypeInfo]) -> Bool {
    switch token {
    case let .drink(d): drinkTypesOf(special).contains(d)
    case let .food(f): catalog.first { $0.id == f }.map { specialIsFood(special, $0) } ?? false
    case .place: false
    }
}

public func tokenLabel(_ token: SearchToken, catalog: [FoodTypeInfo]) -> (label: String, emoji: String) {
    switch token {
    case let .drink(d): (d.label, d.emoji)
    case let .food(f): catalog.first { $0.id == f }.map { ($0.label, $0.emoji) } ?? (f.rawValue, "")
    case let .place(p): (p.label, p.emoji)
    }
}

// MARK: Matching

private struct VenueWords {
    var all: [String]
    var name: [String]
}

/// The venue's searchable words: names, kind of place, street, tags, food, specials.
private func wordsOf(_ venue: Venue, _ catalog: [FoodTypeInfo]) -> VenueWords {
    let food = (venue.food ?? []).flatMap { id in catalog.first { $0.id == id }.map { [$0.label] + $0.words } ?? [] }
    let daily = venue.daily.map { $0.title ?? "" }
    let names = ([venue.name] + (venue.aka ?? [])).joined(separator: " ")
    let text = ([names, venue.category, venue.address] + venue.tags + food + daily + allSpecials(venue).map(\.special.item)).joined(separator: " ")
    var seen = Set<String>()
    return VenueWords(all: searchWords(text).filter { seen.insert($0).inserted }, name: searchWords(names))
}

/// "$12 Cheeseburger · Tue": the special, with its days when it's a weekly special.
private func describe(_ ref: SpecialRef) -> String {
    guard let daily = ref.daily, daily.days.count < 7 else { return formatSpecial(ref.special) }
    return formatSpecial(ref.special) + " · " + daily.days.map { TorontoTime.dayShort[$0] }.joined(separator: ", ")
}

/// A live happy hour, or a daily special running today at a spot that might be open.
private func isOn(_ rv: RankedVenue, _ clock: Clock) -> Bool {
    rv.status.kind == .live
        || (dailyOn(rv.venue, day: clock.day).contains { dailyRunning($0, minutes: clock.minutes) } && mightBeOpen(rv.venue, at: clock))
}

private func matchesWhen(_ rv: RankedVenue, _ when: SearchWhen, _ clock: Clock) -> Bool {
    switch when {
    case .any: true
    case .now: isOn(rv, clock)
    case .happy: hasHappyHour(rv.venue)
    case .daily: !rv.venue.daily.isEmpty
    }
}

/// A word that narrows the search: not filler, not a lone letter or number (numbers only help names).
private func narrows(_ term: String) -> Bool {
    !filler.contains(term) && !term.allSatisfy(\.isNumber) && term.count > 1
}

/// Is there a drink or food to compare prices for, picked or typed ("beer")?
public func canSortByPrice(_ query: SearchQuery, catalog: [FoodTypeInfo]) -> Bool {
    !query.drinks.isEmpty || !query.food.isEmpty
        || searchWords(query.text).filter(narrows).contains { conceptsFor($0, catalog: catalog).contains { !$0.isPlace } }
}

/// Search every spot. Names first; then deals that say what was typed; then deals for what
/// was asked; then on now, any deal, the rest; nearest first within each (or cheapest first).
public func searchVenues(_ items: [RankedVenue], _ query: SearchQuery, at clock: Clock, catalog: [FoodTypeInfo]) -> [SearchResult] {
    let typed = searchWords(query.text)
    let terms = typed.filter(narrows)
    let words = Dictionary(items.map { ($0.venue.id, wordsOf($0.venue, catalog)) }, uniquingKeysWith: { a, _ in a })
    // A word spelled like one the area or the app knows ("wings") is never a typo of another ("wines").
    let vocabulary = Array(Set(concepts(catalog).flatMap(\.words) + words.values.flatMap(\.all)))
    let known = { (t: String) in vocabulary.contains { $0.hasPrefix(t) } }
    let typos = terms.map { !known($0) }
    let termConcepts = zip(terms, typos).map { conceptsFor($0, typos: $1, catalog: catalog) }
    // Names also match on numbers ("400 Brant").
    let nameWords = typed.filter { $0.count > 1 && !filler.contains($0) }
    let nameTypos = nameWords.map { !known($0) }
    let picked = query.drinks.map(SearchToken.drink) + query.food.map(SearchToken.food)
    // Specials worth naming (and pricing): ones for the drinks or food picked or typed.
    let dealTokens = picked + termConcepts.flatMap { $0 }.filter { !$0.isPlace }
    let dealFits = { (s: Special) in dealTokens.contains { specialFits(s, $0, catalog) } }

    var results: [(result: SearchResult, tier: Int)] = []
    for rv in items {
        let venue = rv.venue
        guard matchesWhen(rv, query.when, clock) else { continue }
        if !query.drinks.isEmpty && !query.drinks.contains(where: { servesDrink(venue, $0) }) { continue }
        if !query.food.isEmpty && !query.food.contains(where: { fits(venue, .food($0), clock, catalog) }) { continue }
        if !query.places.allSatisfy({ hasVibe(venue, $0, at: clock) }) { continue }

        let w = words[venue.id]!
        // Every typed word has to match: a word at the spot, or a kind of thing the spot is.
        let matchesAll = terms.indices.allSatisfy { i in
            w.all.contains { wordMatches(terms[i], $0, typos: typos[i]) } || termConcepts[i].contains { fits(venue, $0, clock, catalog) }
        }
        guard matchesAll else { continue }
        let nameMatch = !nameWords.isEmpty && nameWords.indices.allSatisfy { i in w.name.contains { wordMatches(nameWords[i], $0, typos: nameTypos[i]) } }

        // Say why it matched: a special mentioning the words typed ("oysters"), else one for the drink or food asked for.
        let specials = allSpecials(venue)
        let literal =
            terms.isEmpty
            ? nil : specials.first { ref in terms.indices.contains { i in searchWords(ref.special.item).contains { wordMatches(terms[i], $0, typos: typos[i]) } } }
        let matched = literal ?? (dealTokens.isEmpty ? nil : specials.first { dealFits($0.special) })
        let today = dailyToday(venue, at: clock)
        var note: String?
        if let matched {
            note = describe(matched)
        } else if let today, query.when == .daily || !hasHappyHour(venue) {
            note = "Today: \(dailyLabel(today))"
        } else if query.when == .daily, let first = venue.daily.first {
            note = "\(dailyLabel(first)) · \(first.days.map { TorontoTime.dayShort[$0] }.joined(separator: ", "))"
        }

        let on = isOn(rv, clock)
        let deal = query.sort == .cheapest && !dealTokens.isEmpty ? cheapestDeal(rv, matching: dealFits, at: clock) : nil
        let tier =
            (nameMatch ? 0 : 1000) + (!terms.isEmpty && literal == nil ? 100 : 0)
            + (!dealTokens.isEmpty && !specials.contains { dealFits($0.special) } ? 10 : 0) + (on ? 0 : hasDeals(venue) ? 1 : 2)
        results.append((SearchResult(ranked: rv, note: note, on: on, deal: deal), tier))
    }

    func nearest(_ a: (result: SearchResult, tier: Int), _ b: (result: SearchResult, tier: Int)) -> Bool {
        a.tier != b.tier ? a.tier < b.tier : a.result.ranked.distanceM < b.result.ranked.distanceM
    }
    func cheapest(_ a: (result: SearchResult, tier: Int), _ b: (result: SearchResult, tier: Int)) -> Bool {
        switch (a.result.deal, b.result.deal) {
        case let (x?, y?):
            if x.price != y.price { return x.price < y.price }
            if x.on != y.on { return x.on }
            return a.result.ranked.distanceM < b.result.ranked.distanceM
        case (.some, nil): return true
        case (nil, .some): return false
        case (nil, nil): return nearest(a, b)
        }
    }
    return results.stableSorted(by: query.sort == .cheapest ? cheapest : nearest).map(\.result)
}

// MARK: Browsing

public struct BrowseOption: Hashable, Identifiable, Sendable {
    public var token: SearchToken
    public var label: String
    public var emoji: String
    /// How many spots in the area it finds.
    public var count: Int

    public var id: String { token.id }
}

public struct BrowseOptions: Hashable, Sendable {
    public var drinks: [BrowseOption]
    public var food: [BrowseOption]
    public var places: [BrowseOption]
}

/// The browse tiles for these spots: drinks and places in their usual order, food with the
/// most common first. Anything nothing here matches is left out.
public func browseOptions(_ items: [RankedVenue], at clock: Clock, catalog: [FoodTypeInfo]) -> BrowseOptions {
    let venues = items.map(\.venue)
    func option(_ token: SearchToken) -> BrowseOption {
        let info = tokenLabel(token, catalog: catalog)
        return BrowseOption(token: token, label: info.label, emoji: info.emoji, count: venues.filter { fits($0, token, clock, catalog) }.count)
    }
    return BrowseOptions(
        drinks: DrinkType.allCases.map { option(.drink($0)) }.filter { $0.count > 0 },
        food: catalog.map { option(.food($0.id)) }.filter { $0.count > 0 }.stableSorted { $0.count > $1.count },
        places: VibeFilter.allCases.map { option(.place($0)) }.filter { $0.count > 0 })
}
