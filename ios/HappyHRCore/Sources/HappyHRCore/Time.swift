import Foundation

// Toronto time and happy-hour status. A port of src/lib/time.ts.

public enum TorontoTime {
    public static let timeZone = TimeZone(identifier: "America/Toronto")!
    public static let dayMinutes = 24 * 60
    /// A window starting within this many minutes counts as "starting soon".
    public static let soonMinutes = 120
    public static let dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    public static let dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    static var calendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        return calendar
    }
}

/// A moment as Toronto weekday + minutes after midnight.
public struct Clock: Codable, Hashable, Sendable {
    public var day: Weekday
    public var minutes: Int

    public init(day: Weekday, minutes: Int) {
        self.day = day
        self.minutes = minutes
    }

    /// Toronto wall-clock time for a real instant, whatever the device's time zone.
    public init(_ date: Date) {
        let parts = TorontoTime.calendar.dateComponents([.weekday, .hour, .minute], from: date)
        self.init(day: (parts.weekday ?? 1) - 1, minutes: (parts.hour ?? 0) * 60 + (parts.minute ?? 0))
    }

    public static var now: Clock { Clock(Date()) }
}

/// The same as `Clock`, for app code: Swift's standard library also has a `Clock` protocol.
public typealias TorontoClock = Clock

/// Today's date in Toronto, e.g. "2026-10-26".
public func torontoDate(_ date: Date = Date()) -> String {
    let parts = TorontoTime.calendar.dateComponents([.year, .month, .day], from: date)
    return String(format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
}

public enum VenueStatus: Hashable, Sendable {
    public struct Next: Hashable, Sendable {
        public var window: HappyHourWindow
        public var day: Weekday
        public var startsAt: Int
    }

    case live(window: HappyHourWindow, minutesLeft: Int, endsAt: Int, progress: Double)
    case soon(window: HappyHourWindow, startsIn: Int, startsAt: Int)
    case later(window: HappyHourWindow, startsIn: Int, startsAt: Int)
    case none(next: Next?)

    public enum Kind: String, Hashable, Sendable {
        case live, soon, later, none
    }

    public var kind: Kind {
        switch self {
        case .live: .live
        case .soon: .soon
        case .later: .later
        case .none: .none
        }
    }
}

private struct Occurrence {
    var window: HappyHourWindow
    var day: Weekday
    /// Minutes from now until it starts (negative once started).
    var startsIn: Int
    var endsIn: Int
    var dayOffset: Int
}

/// Every occurrence of a venue's windows from yesterday through the next 6 days.
private func occurrences(_ venue: Venue, _ clock: Clock) -> [Occurrence] {
    var out: [Occurrence] = []
    for window in venue.happyHours {
        for dayOffset in -1...6 {
            let day = (((clock.day + dayOffset) % 7) + 7) % 7
            guard window.days.contains(day) else { continue }
            let startsIn = dayOffset * TorontoTime.dayMinutes + window.start - clock.minutes
            out.append(Occurrence(window: window, day: day, startsIn: startsIn, endsIn: startsIn + window.end - window.start, dayOffset: dayOffset))
        }
    }
    return out
}

public func venueStatus(_ venue: Venue, at clock: Clock) -> VenueStatus {
    let all = occurrences(venue, clock)

    if let live = all.filter({ $0.startsIn <= 0 && $0.endsIn > 0 }).stableSorted(by: { $0.endsIn > $1.endsIn }).first {
        let length = live.window.end - live.window.start
        return .live(
            window: live.window,
            minutesLeft: live.endsIn,
            endsAt: live.window.end,
            progress: Double(length - live.endsIn) / Double(length)
        )
    }

    guard let upcoming = all.filter({ $0.startsIn > 0 }).stableSorted(by: { $0.startsIn < $1.startsIn }).first else {
        return .none(next: nil)
    }
    if upcoming.dayOffset == 0 {
        return upcoming.startsIn <= TorontoTime.soonMinutes
            ? .soon(window: upcoming.window, startsIn: upcoming.startsIn, startsAt: upcoming.window.start)
            : .later(window: upcoming.window, startsIn: upcoming.startsIn, startsAt: upcoming.window.start)
    }
    return .none(next: .init(window: upcoming.window, day: upcoming.day, startsAt: upcoming.window.start))
}

// MARK: - Formatting

/// "5 PM", "5:30 PM", "12:30 AM". Accepts minutes past 24h.
public func formatTime(_ minutes: Int, compact: Bool = false) -> String {
    let m = ((minutes % TorontoTime.dayMinutes) + TorontoTime.dayMinutes) % TorontoTime.dayMinutes
    let h24 = m / 60
    let min = m % 60
    let h12 = h24 % 12 == 0 ? 12 : h24 % 12
    let suffix = h24 < 12 ? "AM" : "PM"
    let time = min == 0 && compact ? "\(h12)" : "\(h12):\(String(format: "%02d", min))"
    return "\(time) \(suffix)"
}

/// "4–6 PM", "11 AM–1 PM".
public func formatRange(start: Int, end: Int) -> String {
    let half = { (m: Int) in (m % TorontoTime.dayMinutes) / 720 }
    let from = formatTime(start, compact: true)
    let to = formatTime(end, compact: true)
    if half(start) == half(end) {
        return "\(from.replacingOccurrences(of: " AM", with: "").replacingOccurrences(of: " PM", with: ""))–\(to)"
    }
    return "\(from)–\(to)"
}

public func formatRange(_ window: HappyHourWindow) -> String {
    formatRange(start: window.start, end: window.end)
}

/// "45 min", "1h 20m", "3h".
public func formatDuration(_ minutes: Int) -> String {
    if minutes < 60 { return "\(minutes) min" }
    let h = minutes / 60
    let m = minutes % 60
    return m == 0 ? "\(h)h" : "\(h)h \(m)m"
}

/// "Daily", "Mon–Fri", "Weekends", "Fri, Sat".
public func formatDays(_ days: [Weekday]) -> String {
    let sorted = days.sorted()
    if sorted.count == 7 { return "Daily" }
    let contiguous = sorted.indices.allSatisfy { $0 == 0 || sorted[$0] == sorted[$0 - 1] + 1 }
    if contiguous && sorted.count >= 3 {
        return "\(TorontoTime.dayShort[sorted[0]])–\(TorontoTime.dayShort[sorted[sorted.count - 1]])"
    }
    if sorted == [0, 6] { return "Weekends" }
    return sorted.map { TorontoTime.dayShort[$0] }.joined(separator: ", ")
}

extension Array {
    /// A sort that keeps equal elements in their original order, like JavaScript's Array#sort.
    func stableSorted(by areInIncreasingOrder: (Element, Element) -> Bool) -> [Element] {
        enumerated()
            .sorted { a, b in
                if areInIncreasingOrder(a.element, b.element) { return true }
                if areInIncreasingOrder(b.element, a.element) { return false }
                return a.offset < b.offset
            }
            .map(\.element)
    }
}
