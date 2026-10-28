import Foundation

// How fresh a venue's deals are, so people know what to trust: when we last
// checked them, when someone last confirmed one in person, and whether they
// may have gone stale. A port of src/lib/freshness.ts.

/// A confirmation this recent counts as "confirmed".
public let confirmedDays = 14
/// Researched deals older than this without a confirmation may be out of date.
public let staleCheckedDays = 120
/// A reported deal whose newest source is older than this may be out of date.
public let staleSourceDays = 365

public struct Freshness: Codable, Hashable, Sendable {
    /// "✓ Confirmed 2 days ago", "Checked Oct 26", "Added 3 days ago".
    public var label: String
    public var confirmed: Bool
    /// Old enough that people should double-check.
    public var stale: Bool

    public init(label: String, confirmed: Bool, stale: Bool) {
        self.label = label
        self.confirmed = confirmed
        self.stale = stale
    }
}

private let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
private let utc: Calendar = {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = TimeZone(identifier: "UTC")!
    return calendar
}()

/// "2026-10-26" or "2026-10" → noon UTC that day (so the calendar day never shifts); nil for "undated".
private func parseDay(_ text: String?) -> Date? {
    guard let text, let match = text.wholeMatch(of: /(\d{4})-(\d{2})(?:-(\d{2}))?.*/) else { return nil }
    let day = match.3.flatMap { Int($0) } ?? 1
    return utc.date(from: DateComponents(year: Int(match.1), month: Int(match.2), day: day, hour: 12))
}

/// ISO-8601 timestamps from the API, with or without fractional seconds.
func parseInstant(_ text: String) -> Date? {
    let plain = ISO8601DateFormatter()
    if let date = plain.date(from: text) { return date }
    let fractional = ISO8601DateFormatter()
    fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return fractional.date(from: text)
}

/// Calendar days in Toronto, so last night's check-in reads "yesterday" even if it was 20 hours ago.
private func dayNumber(_ date: Date) -> Double {
    let parts = torontoDate(date).split(separator: "-").compactMap { Int($0) }
    let midnight = utc.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))!
    return midnight.timeIntervalSince1970 / 86_400
}

private func daysSince(_ date: Date, now: Date) -> Int {
    Int((dayNumber(now) - dayNumber(date)).rounded())
}

private func ago(_ days: Int) -> String {
    if days <= 0 { return "today" }
    if days == 1 { return "yesterday" }
    if days < 30 { return "\(days) days ago" }
    // Math.round: halves go up.
    let monthsAgo = Int((Double(days) / 30).rounded(.toNearestOrAwayFromZero))
    return monthsAgo == 1 ? "a month ago" : "\(monthsAgo) months ago"
}

/// Nil for a venue with no deals, or sample deals.
public func freshness(_ venue: Venue, tally: VoteTally?, now: Date = Date()) -> Freshness? {
    let refs = venue.happyHours.map(\.community) + venue.daily.map(\.community)
    guard !refs.isEmpty, venue.deals != .sample else { return nil }

    if let tally, let lastYes = tally.lastYes.flatMap(parseInstant), daysSince(lastYes, now: now) <= confirmedDays {
        let people = tally.yes > 1 ? " by \(tally.yes) people" : ""
        return Freshness(label: "✓ Confirmed\(people) \(ago(daysSince(lastYes, now: now)))", confirmed: true, stale: false)
    }

    // Community-only deals: how long ago the newest was added.
    let added = refs.compactMap { $0.flatMap { parseInstant($0.createdAt) } }
    if venue.checked == nil, let newest = added.max() {
        let days = daysSince(newest, now: now)
        return Freshness(label: "Added \(ago(days))", confirmed: false, stale: days > staleCheckedDays)
    }

    let checked = parseDay(venue.checked)
    let newestSource = (venue.sources ?? []).compactMap { parseDay($0.date) }.max()
    let sourceStale = venue.deals == .reported && (newestSource.map { daysSince($0, now: now) > staleSourceDays } ?? true)
    let checkedStale = checked.map { daysSince($0, now: now) > staleCheckedDays } ?? true
    let label = checked.map { "Checked \(months[utc.component(.month, from: $0) - 1]) \(utc.component(.day, from: $0))" } ?? "Not checked yet"
    return Freshness(label: label, confirmed: false, stale: sourceStale || checkedStale)
}
