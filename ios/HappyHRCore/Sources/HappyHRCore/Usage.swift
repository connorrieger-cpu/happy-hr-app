import Foundation

// Anonymous usage counts for the owner: which area the app opens, a rough square of the map
// it's opened in, and which buttons get tapped. Nothing is tied to a person or an account:
// the server keeps daily totals, plus a hashed device id for 90 days to count phones.
// A port of src/lib/usage.ts.

public struct CellSize: Codable, Hashable, Sendable {
    public var lat: Double
    public var lng: Double
}

/// Near one of the areas, a square about 550 m across; anywhere else, about 5.5 km.
public let fineCell = CellSize(lat: 0.005, lng: 0.007)
public let coarseCell = CellSize(lat: 0.05, lng: 0.07)

private func round4(_ n: Double) -> Double { (n * 10_000).rounded() / 10_000 }

private func snap(_ p: LatLng, _ size: CellSize) -> LatLng {
    LatLng(lat: round4(((p.lat / size.lat).rounded(.down) + 0.5) * size.lat), lng: round4(((p.lng / size.lng).rounded(.down) + 0.5) * size.lng))
}

/// The centre of the square around `p` (a fine one near an area, else a coarse one): never the exact spot.
public func usageCell(_ p: LatLng, _ areas: [Area]) -> LatLng {
    snap(p, areaAt(p, areas) != nil ? fineCell : coarseCell)
}

/// How a square is sent and stored: "43.6475,-79.4185".
public func cellKey(_ c: LatLng) -> String {
    String(format: "%.4f,%.4f", c.lat, c.lng)
}

private func onGrid(_ value: Double, _ step: Double) -> Bool {
    let k = value / step - 0.5
    return abs(k - k.rounded()) < 1e-6
}

/// The size of the square a centre belongs to (fine near the areas, coarse elsewhere).
public func cellSize(_ c: LatLng) -> CellSize {
    onGrid(c.lat, fineCell.lat) && onGrid(c.lng, fineCell.lng) ? fineCell : coarseCell
}

/// A square's centre from its key, or nil unless it's the centre of a fine or coarse square.
public func parseCell(_ key: String) -> LatLng? {
    guard key.wholeMatch(of: /-?\d{1,2}\.\d{4},-?\d{1,3}\.\d{4}/) != nil else { return nil }
    let parts = key.split(separator: ",").compactMap { Double($0) }
    guard parts.count == 2, abs(parts[0]) <= 90, abs(parts[1]) <= 180 else { return nil }
    let c = LatLng(lat: parts[0], lng: parts[1])
    let fits = { (size: CellSize) in onGrid(c.lat, size.lat) && onGrid(c.lng, size.lng) }
    return fits(fineCell) || fits(coarseCell) ? c : nil
}

/// What each event means, for the owner's Usage screen (usage.ts `EVENT_LABELS`).
public let eventLabels: [String: String] = [
    "open": "Opened the app",
    "venue": "Opened a spot",
    "search": "Opened search",
    "tile": "Search tile",
    "when": "Search: when",
    "sort": "Search: sort",
    "filter": "Filter chip",
    "favourite": "Starred a spot",
    "unfavourite": "Unstarred a spot",
    "share": "Shared a spot",
    "meet": "Sent a “meet at”",
    "directions": "Directions",
    "book": "Booking link",
    "google-maps": "Google Maps",
    "call": "Called",
    "website": "Website",
    "menu": "Menu",
    "instagram": "Instagram",
    "live-activity": "Live Activity",
    "check-in": "Checked a deal",
    "contribute": "Added a deal",
    "claim": "Claimed a spot",
    "chat": "Opened chat",
    "chat-send": "Sent a chat message",
    "area-menu": "Opened the area menu",
    "area": "Switched area",
    "time-preview": "Time preview",
    "locate": "Locate me",
    "sign-in": "Signed in",
    "account": "Opened account",
    "favourites-strip": "Your spots strip",
    "link": "Opened a shared link",
]

/// "tile:beer" → "Search tile: beer"; unknown names show as they are.
public func eventLabel(_ name: String) -> String {
    let parts = name.split(separator: ":", maxSplits: 1).map(String.init)
    let label = eventLabels[parts[0]] ?? parts[0]
    return parts.count > 1 ? "\(label): \(parts[1].replacingOccurrences(of: "-", with: " "))" : label
}

/// A tap worth counting (usage.ts `EVENT_NAME`): a short name, optionally ":" and what was picked.
public func isEventName(_ name: String) -> Bool {
    name.wholeMatch(of: /[a-z][a-z0-9-]{0,31}(:[a-z0-9-]{1,40})?/) != nil
}

/// One area's taps on one day, as the app sends them to `POST /api/usage`.
public struct UsageReport: Codable, Hashable, Sendable {
    public var platform = "ios"
    public var device: String?
    public var area: String
    /// Toronto date of the taps (YYYY-MM-DD).
    public var day: String
    /// The square the app was opened in, only with an "open".
    public var cell: String?
    public var events: [String: Int]

    public init(device: String?, area: String, day: String, cell: String? = nil, events: [String: Int]) {
        self.device = device
        self.area = area
        self.day = day
        self.cell = cell
        self.events = events
    }
}

/// The owner's Usage screen, from `GET /api/owner-usage?days=`.
public struct UsageSummary: Codable, Hashable, Sendable {
    public struct Totals: Codable, Hashable, Sendable {
        public var opens: Int
        public var people: Int
        public var taps: Int
    }
    public struct Day: Codable, Hashable, Sendable {
        public var day: String
        public var opens: Int
        public var people: Int
    }
    public struct AreaCount: Codable, Hashable, Sendable {
        public var area: String
        public var opens: Int
        public var people: Int
    }
    public struct Platform: Codable, Hashable, Sendable {
        public var platform: String
        public var opens: Int
    }
    public struct Cell: Codable, Hashable, Sendable {
        public var area: String
        public var lat: Double
        public var lng: Double
        public var opens: Int
    }
    public struct Event: Codable, Hashable, Sendable {
        public var name: String
        public var label: String
        public var count: Int
    }

    public var days: Int
    public var from: String
    public var to: String
    public var totals: Totals
    public var byDay: [Day]
    public var areas: [AreaCount]
    public var platforms: [Platform]
    public var cells: [Cell]
    public var events: [Event]
}
