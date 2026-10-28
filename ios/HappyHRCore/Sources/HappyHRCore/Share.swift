import Foundation

// Shareable links: a venue (`?v=manita`) or a plan to meet there
// (`?v=manita&meet=1050`, minutes after midnight). The same links can open
// the iOS app as universal links. A port of src/lib/share.ts.

public struct SharedLink: Hashable, Sendable {
    public var venueId: String?
    /// Suggested meeting time, minutes after midnight, Toronto time.
    public var meet: Int?
    /// A venue owner's key, from the link the owner sends after approving a claim.
    public var venueKey: String?
    /// The spot's area (`a=guelph`); links from before areas have none and mean Ossington.
    public var areaId: String?

    public init(venueId: String? = nil, meet: Int? = nil, venueKey: String? = nil, areaId: String? = nil) {
        self.venueId = venueId
        self.meet = meet
        self.venueKey = venueKey
        self.areaId = areaId
    }
}

/// Reads a link's query ("?v=manita&meet=1050" or "v=manita"); anything malformed reads as absent.
public func parseLink(query: String) -> SharedLink {
    let trimmed = query.hasPrefix("?") ? String(query.dropFirst()) : query
    var params: [String: String] = [:]
    // Like URLSearchParams#get: the first value wins, and "+" means a space.
    for pair in trimmed.split(separator: "&", omittingEmptySubsequences: true) {
        let parts = pair.split(separator: "=", maxSplits: 1, omittingEmptySubsequences: false)
        let decode = { (s: Substring) in String(s).replacingOccurrences(of: "+", with: " ").removingPercentEncoding ?? String(s) }
        let key = decode(parts[0])
        if params[key] == nil { params[key] = parts.count > 1 ? decode(parts[1]) : "" }
    }
    let venueId = params["v"].flatMap { (try? /^[a-z0-9-]{1,80}$/.wholeMatch(in: $0)) != nil ? $0 : nil }
    let meet = params["meet"].flatMap(Int.init).flatMap { $0 > 0 && $0 < TorontoTime.dayMinutes ? $0 : nil }
    let venueKey = params["venuekey"].flatMap { isVenueKey($0) ? $0 : nil }
    let areaId = params["a"].flatMap { (try? /^[a-z0-9-]{1,40}$/.wholeMatch(in: $0)) != nil ? $0 : nil }
    return SharedLink(venueId: venueId, meet: meet, venueKey: venueKey, areaId: areaId)
}

/// The base URL without its query or fragment, then `?a={area}`, `&v={id}` and `&meet={m}`.
public func venueLink(base: URL, venueId: String, meet: Int? = nil, areaId: String? = nil) -> URL {
    var components = URLComponents(url: base, resolvingAgainstBaseURL: false)!
    components.fragment = nil
    if components.path.isEmpty { components.path = "/" }
    components.queryItems = (areaId.map { [URLQueryItem(name: "a", value: $0)] } ?? [])
        + [URLQueryItem(name: "v", value: venueId)]
        + (meet.map { [URLQueryItem(name: "meet", value: String($0))] } ?? [])
    return components.url!
}

/// A line about the deal worth sharing, e.g. "$2.50 Oysters till 6 PM" or "Taco Tuesday today".
public func dealLine(_ rv: RankedVenue, at clock: Clock) -> String? {
    let lead = headlineSpecial(focusWindow(rv.status)?.specials ?? [])
    switch rv.status {
    case let .live(_, _, endsAt, _):
        if let lead { return "\(formatSpecial(lead)) till \(formatTime(endsAt, compact: true))" }
    case let .soon(window, _, _), let .later(window, _, _):
        if let lead { return "\(formatSpecial(lead)), \(formatRange(window)) today" }
    case .none:
        break
    }
    return dailyToday(rv.venue, at: clock).map { "\(dailyLabel($0)) today" }
}

/// The message that goes with a shared link.
public func shareMessage(_ rv: RankedVenue, at clock: Clock, meet: Int? = nil) -> String {
    let deal = dealLine(rv, at: clock)
    if let meet {
        return "Meet at \(rv.venue.name) at \(formatTime(meet, compact: true))?\(deal.map { " \($0)." } ?? "")"
    }
    return "\(rv.venue.name) on \(rv.venue.address)\(deal.map { ": \($0)" } ?? "")"
}

/// Meeting times to offer, all later today: the next few half hours (from when
/// it opens, if it's closed now), only while it's open when the hours are
/// known, plus the start of today's happy hour when it's coming up.
public func meetOptions(_ rv: RankedVenue, at clock: Clock) -> [Int] {
    let roundUp = { (m: Int) in Int((Double(m) / 30).rounded(.up)) * 30 }
    let soonest = roundUp(clock.minutes + 15)
    var first = soonest
    // Closed now but opening later today: start from the opening time.
    if case let .closed(opensAt?, opensDay?, _) = openState(rv.venue, at: clock), opensDay == clock.day, opensAt > clock.minutes {
        first = max(soonest, roundUp(opensAt))
    }
    let isOpenAt = { (m: Int) in !openState(rv.venue, at: Clock(day: clock.day, minutes: m)).isClosed }
    var times = [first, first + 30, first + 60, first + 90].filter { $0 < TorontoTime.dayMinutes && isOpenAt($0) }
    switch rv.status {
    case let .soon(_, _, startsAt), let .later(_, _, startsAt):
        if startsAt < TorontoTime.dayMinutes && !times.contains(startsAt) { times.append(startsAt) }
    default:
        break
    }
    return Array(times.sorted().prefix(5))
}

/// A summary for link previews, true whatever the time:
/// "Happy hour Mon–Fri 3–6 PM: $6 Pints, $2.50 Oysters. 1100 Queen St W."
public func previewText(_ venue: Venue) -> String {
    var deal = ""
    if let window = venue.happyHours.first {
        deal = "Happy hour \(formatDays(window.days)) \(formatRange(window)): \(window.specials.prefix(2).map(formatSpecial).joined(separator: ", ")). "
    } else if let daily = venue.daily.first {
        deal = "\(formatDays(daily.days)): \(dailyLabel(daily)). "
    }
    return "\(deal)\(venue.address)."
}
