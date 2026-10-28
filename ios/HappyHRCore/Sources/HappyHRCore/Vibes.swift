import Foundation

// Vibe and amenity filters for search: some stored (patio, live music…), some
// worked out (open now and open late from hours, trivia from the specials).
// A port of src/lib/vibes.ts.

/// In display order (the fixture checks it).
public enum VibeFilter: String, Codable, CaseIterable, Hashable, Sendable {
    case openNow = "open-now"
    case patio
    case liveMusic = "live-music"
    case sports, trivia
    case openLate = "open-late"
    case groups, dogs

    public var label: String {
        switch self {
        case .openNow: "Open now"
        case .patio: "Patio"
        case .liveMusic: "Live music"
        case .sports: "Sports on TV"
        case .trivia: "Trivia"
        case .openLate: "Open late"
        case .groups: "Good for groups"
        case .dogs: "Dog-friendly"
        }
    }

    public var emoji: String {
        switch self {
        case .openNow: "🟢"
        case .patio: "☀️"
        case .liveMusic: "🎶"
        case .sports: "📺"
        case .trivia: "🧠"
        case .openLate: "🌙"
        case .groups: "👥"
        case .dogs: "🐕"
        }
    }

    /// The stored amenity this filter reads, if it's one.
    var amenity: Amenity? { Amenity(rawValue: rawValue) }
}

private func mentionsTrivia(_ venue: Venue) -> Bool {
    let texts = venue.tags + venue.daily.flatMap { [$0.title ?? "", $0.note ?? ""] }
    return texts.contains { jsRegex("trivia|quiz").matches($0) }
}

public func hasVibe(_ venue: Venue, _ vibe: VibeFilter, at clock: Clock) -> Bool {
    switch vibe {
    case .openNow: openState(venue, at: clock).isOpen
    case .openLate: isOpenLate(venue)
    case .trivia: mentionsTrivia(venue)
    default: vibe.amenity.map { venue.amenities?.contains($0) ?? false } ?? false
    }
}

/// The amenities worth showing on a venue's page, in display order (not "open now", which has its own line).
public func venueVibes(_ venue: Venue, at clock: Clock) -> [VibeFilter] {
    VibeFilter.allCases.filter { $0 != .openNow && hasVibe(venue, $0, at: clock) }
}

// MARK: - JavaScript-compatible regular expressions

/// A case-insensitive regular expression that reads `\b` the way JavaScript does:
/// a boundary between an ASCII word character [A-Za-z0-9_] and anything else.
/// (ICU counts accented letters as word characters, so "rosé" would match differently.)
struct JSRegex: @unchecked Sendable {
    let regex: NSRegularExpression

    func matches(_ text: String) -> Bool {
        regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)) != nil
    }
}

private let wordBoundary = "(?:(?<=[A-Za-z0-9_])(?![A-Za-z0-9_])|(?<![A-Za-z0-9_])(?=[A-Za-z0-9_]))"
// NSCache is thread-safe.
nonisolated(unsafe) private let regexCache = NSCache<NSString, NSRegularExpression>()

func jsRegex(_ pattern: String) -> JSRegex {
    if let cached = regexCache.object(forKey: pattern as NSString) { return JSRegex(regex: cached) }
    let translated = pattern.replacingOccurrences(of: "\\b", with: wordBoundary)
    let regex = try! NSRegularExpression(pattern: translated, options: [.caseInsensitive])
    regexCache.setObject(regex, forKey: pattern as NSString)
    return JSRegex(regex: regex)
}
