import Foundation

// Distances, ranking and labels. A port of src/lib/geo.ts and src/lib/deals.ts.

// MARK: - Geo

private let earthRadiusM = 6_371_000.0
/// Average city walking pace, 4.8 km/h.
private let walkMetersPerMinute = 80.0

public func distanceMeters(_ a: LatLng, _ b: LatLng) -> Double {
    let rad = { (d: Double) in d * .pi / 180 }
    let dLat = rad(b.lat - a.lat)
    let dLng = rad(b.lng - a.lng)
    let h = pow(sin(dLat / 2), 2) + cos(rad(a.lat)) * cos(rad(b.lat)) * pow(sin(dLng / 2), 2)
    return 2 * earthRadiusM * asin(h.squareRoot())
}

public func walkMinutes(_ meters: Double) -> Int {
    max(1, Int((meters / walkMetersPerMinute).rounded()))
}

/// "350 m", "1.2 km".
public func formatDistance(_ meters: Double) -> String {
    meters < 1000 ? "\(Int((meters / 10).rounded() * 10)) m" : String(format: "%.1f km", meters / 1000)
}

// MARK: - Ranking

public struct RankedVenue: Hashable, Identifiable, Sendable {
    public var venue: Venue
    public var status: VenueStatus
    public var distanceM: Double
    public var walkMin: Int

    public var id: String { venue.id }
}

/// What's on, grouped the way the main list shows it.
public struct RightNow: Hashable, Sendable {
    public var live: [RankedVenue]
    public var soon: [RankedVenue]
    public var later: [RankedVenue]
    /// Happy hours with nothing else today.
    public var rest: [RankedVenue]
    /// Spots with no known happy hour (some have daily specials), nearest first.
    public var unlisted: [RankedVenue]

    /// Venues with a happy hour, in list order.
    public var withHappyHours: [RankedVenue] { live + soon + later + rest }
    /// Every venue, the ones without a happy hour last.
    public var all: [RankedVenue] { withHappyHours + unlisted }
}

public enum DealFilter: String, CaseIterable, Hashable, Sendable {
    case all, drinks, food, ending, late, daily

    public var label: String {
        switch self {
        case .all: "All"
        case .drinks: "Drinks"
        case .food: "Food"
        case .ending: "Ending soon"
        case .late: "Late night"
        case .daily: "Daily specials"
        }
    }
}

private let endingSoonMinutes = 30
private let lateNightStart = 21 * 60

public func isEndingSoon(_ status: VenueStatus) -> Bool {
    if case let .live(_, minutesLeft, _, _) = status { return minutesLeft <= endingSoonMinutes }
    return false
}

/// The window a card talks about: the live one, else the next one.
public func focusWindow(_ status: VenueStatus) -> HappyHourWindow? {
    switch status {
    case let .live(window, _, _, _), let .soon(window, _, _), let .later(window, _, _): window
    case let .none(next): next?.window
    }
}

public func matchesFilter(_ rv: RankedVenue, _ filter: DealFilter) -> Bool {
    switch filter {
    case .all:
        return true
    case .drinks, .food:
        let kind: Special.Kind = filter == .drinks ? .drink : .food
        return focusWindow(rv.status)?.specials.contains { $0.kind == kind } ?? false
    case .ending:
        return isEndingSoon(rv.status)
    case .late:
        return rv.venue.happyHours.contains { $0.start >= lateNightStart }
    case .daily:
        return !rv.venue.daily.isEmpty
    }
}

public func hasHappyHour(_ venue: Venue) -> Bool { !venue.happyHours.isEmpty }

/// Any deal at all: a happy hour or a daily special.
public func hasDeals(_ venue: Venue) -> Bool { hasHappyHour(venue) || !venue.daily.isEmpty }

public func rankVenues(_ venues: [Venue], at clock: Clock, from origin: LatLng, filter: DealFilter = .all) -> RightNow {
    let all = venues
        .map { venue -> RankedVenue in
            let d = distanceMeters(origin, venue.location)
            return RankedVenue(venue: venue, status: venueStatus(venue, at: clock), distanceM: d, walkMin: walkMinutes(d))
        }
        .filter { matchesFilter($0, filter) }
    let ranked = all.filter { hasHappyHour($0.venue) }
    let by = { (kind: VenueStatus.Kind) in ranked.filter { $0.status.kind == kind } }
    let startsIn = { (rv: RankedVenue) -> Int in
        switch rv.status {
        case let .soon(_, startsIn, _), let .later(_, startsIn, _): startsIn
        default: 0
        }
    }
    let minutesLeft = { (rv: RankedVenue) -> Int in
        if case let .live(_, left, _, _) = rv.status { return left }
        return 0
    }
    let nearest = { (a: RankedVenue, b: RankedVenue) in a.distanceM < b.distanceM }

    return RightNow(
        // Nearest first, since the point is "where can I walk to right now".
        live: by(.live).stableSorted { a, b in
            a.distanceM != b.distanceM ? a.distanceM < b.distanceM : minutesLeft(a) > minutesLeft(b)
        },
        soon: by(.soon).stableSorted { a, b in startsIn(a) != startsIn(b) ? startsIn(a) < startsIn(b) : a.distanceM < b.distanceM },
        later: by(.later).stableSorted { a, b in startsIn(a) != startsIn(b) ? startsIn(a) < startsIn(b) : a.distanceM < b.distanceM },
        rest: by(.none).stableSorted(by: nearest),
        unlisted: all.filter { !hasHappyHour($0.venue) }.stableSorted(by: nearest)
    )
}

// MARK: - Labels

/// "$6", "$2.50".
public func formatPrice(_ price: Double) -> String {
    price == price.rounded() ? "$\(Int(price))" : String(format: "$%.2f", price)
}

// Small words stay lowercase inside a deal's name (unless they start it), as do units.
private let minorWords: Set<String> = ["a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "nor", "of", "on", "or", "per", "the", "to", "via", "vs", "with"]
private let particles: Set<String> = ["de", "del", "dei", "des", "di", "du"]
private let units: Set<String> = ["oz", "ml", "cl", "lb", "lbs", "kg"]

/// Deals read as names: "house beer" → "House Beer", "half-price wine bottles (whole list)" →
/// "Half-Price Wine Bottles (whole list)". Words with capitals inside (OG, IPA) stay as written,
/// and so does anything in brackets.
public func formatItem(_ item: String) -> String {
    var out = ""
    var word = ""
    var depth = 0
    var first = true

    func flush() {
        guard !word.isEmpty else { return }
        defer { word = "" }
        if depth > 0 {
            out += word
            return
        }
        let isFirst = first
        first = false
        if word.dropFirst().contains(where: { $0.isASCII && $0.isUppercase }) {
            out += word
            return
        }
        let lower = word.lowercased()
        if !isFirst, minorWords.contains(lower) || particles.contains(lower) || units.contains(lower) {
            out += word
            return
        }
        // Capitalise the start of the word and of each hyphenated part.
        var previous: Character = "-"
        for character in word {
            out += previous == "-" && character.isASCII && character.isLowercase ? character.uppercased() : String(character)
            previous = character
        }
    }

    for character in item {
        if character == "(" || character == ")" || character.isWhitespace {
            flush()
            if character == "(" { depth += 1 }
            if character == ")" { depth = max(0, depth - 1) }
            out.append(character)
        } else {
            word.append(character)
        }
    }
    flush()
    return out
}

/// "$6 Pints", or the item as written when it has no price.
public func formatSpecial(_ special: Special) -> String {
    let item = formatItem(special.item)
    guard let price = special.price else { return item }
    return "\(formatPrice(price)) \(item)"
}

/// The special to lead with: the cheapest priced one, else the first.
public func headlineSpecial(_ specials: [Special]) -> Special? {
    specials.filter { $0.price != nil }.stableSorted { $0.price! < $1.price! }.first ?? specials.first
}

private let pinLabelMax = 18

/// Trims a label to fit on a map pin.
public func shortLabel(_ label: String) -> String {
    guard label.count > pinLabelMax else { return label }
    var cut = String(label.prefix(pinLabelMax - 1))
    while cut.last?.isWhitespace == true { cut.removeLast() }
    return cut + "…"
}

/// Short pin label, e.g. "$2 oysters".
public func pinLabel(_ window: HappyHourWindow?) -> String? {
    guard let window, let special = headlineSpecial(window.specials) else { return nil }
    return shortLabel(formatSpecial(special))
}

/// One-line status, e.g. "Ends 6 PM · 47 min left".
public func statusLine(_ status: VenueStatus) -> String {
    switch status {
    case let .live(_, minutesLeft, endsAt, _):
        "Ends \(formatTime(endsAt, compact: true)) · \(formatDuration(minutesLeft)) left"
    case let .soon(_, startsIn, startsAt):
        "Starts \(formatTime(startsAt, compact: true)) · in \(formatDuration(startsIn))"
    case let .later(_, _, startsAt):
        "Starts \(formatTime(startsAt, compact: true))"
    case let .none(next):
        next.map { "Next: \(TorontoTime.dayShort[$0.day]) \(formatTime($0.startsAt, compact: true))" } ?? "No happy hour listed"
    }
}
