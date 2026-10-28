import Foundation

// Opening hours: is it open right now, and when does it close or open next.
// A port of src/lib/hours.ts.

public enum OpenState: Hashable, Sendable {
    case unknown
    case open(closesAt: Int, closesIn: Int)
    case closed(opensAt: Int?, opensDay: Weekday?, opensIn: Int?)

    public var isOpen: Bool {
        if case .open = self { return true }
        return false
    }

    public var isClosed: Bool {
        if case .closed = self { return true }
        return false
    }
}

/// Closing within this many minutes reads as "Closes soon".
public let closingSoonMinutes = 60

private let dayMinutes = 1440

private struct Upcoming {
    var span: OpenSpan
    var day: Weekday
    var startsIn: Int
    var endsIn: Int
}

/// Every span from yesterday through the next 7 days, as minutes from now.
private func upcomingSpans(_ hours: [OpenSpan], _ clock: Clock) -> [Upcoming] {
    var out: [Upcoming] = []
    for span in hours {
        for offset in -1...7 {
            let day = ((clock.day + offset) % 7 + 7) % 7
            guard span.day == day else { continue }
            let startsIn = offset * dayMinutes + span.open - clock.minutes
            out.append(Upcoming(span: span, day: day, startsIn: startsIn, endsIn: startsIn + span.close - span.open))
        }
    }
    return out
}

/// Where a span really ends: one that runs to midnight carries on into the next
/// day's span when that opens at midnight (Google lists a 24-hour place as
/// midnight to midnight, every day). Minutes after midnight of the span's day.
private func runsUntil(_ hours: [OpenSpan], _ span: OpenSpan) -> Int {
    var close = span.close
    var offset = 1
    while offset <= 7 && close == offset * dayMinutes {
        guard let next = hours.first(where: { $0.day == (span.day + offset) % 7 && $0.open == 0 }) else { break }
        close = offset * dayMinutes + next.close
        offset += 1
    }
    return close
}

public func openState(_ venue: Venue, at clock: Clock) -> OpenState {
    guard let hours = venue.hours, !hours.isEmpty else { return .unknown }
    let all = upcomingSpans(hours, clock)
    if let now = all.filter({ $0.startsIn <= 0 && $0.endsIn > 0 }).stableSorted(by: { $0.endsIn > $1.endsIn }).first {
        let closesAt = runsUntil(hours, now.span)
        return .open(closesAt: closesAt, closesIn: now.endsIn + closesAt - now.span.close)
    }
    if let next = all.filter({ $0.startsIn > 0 }).stableSorted(by: { $0.startsIn < $1.startsIn }).first {
        return .closed(opensAt: next.span.open, opensDay: next.day, opensIn: next.startsIn)
    }
    return .closed(opensAt: nil, opensDay: nil, opensIn: nil)
}

/// "Open · till 2 AM", "Open 24 hours", "Closes soon · 11:30 PM", "Closed · opens 5 PM",
/// "Closed · opens Tue 5 PM", or "" when unknown.
public func openLabel(_ state: OpenState, today: Weekday) -> String {
    switch state {
    case .unknown:
        return ""
    case let .open(closesAt, closesIn):
        if closesIn >= dayMinutes { return "Open 24 hours" }
        return closesIn <= closingSoonMinutes
            ? "Closes soon · \(formatTime(closesAt, compact: true))" : "Open · till \(formatTime(closesAt, compact: true))"
    case let .closed(opensAt, opensDay, opensIn):
        guard let opensAt, let opensDay else { return "Closed" }
        let day = opensDay == today && (opensIn ?? 0) < dayMinutes ? "" : "\(TorontoTime.dayShort[opensDay]) "
        return "Closed · opens \(day)\(formatTime(opensAt, compact: true))"
    }
}

/// False only when the hours say it's closed right now. Keeps an all-day
/// special from reading "On now" at 3 AM.
public func mightBeOpen(_ venue: Venue, at clock: Clock) -> Bool {
    !openState(venue, at: clock).isClosed
}

/// The week's hours from today, e.g. [(2, "2 PM–2 AM"), (3, "Closed")].
public func weekHours(_ venue: Venue, today: Weekday) -> [(day: Weekday, text: String)] {
    (0..<7).map { i in
        let day = (today + i) % 7
        let spans = (venue.hours ?? []).filter { $0.day == day }.stableSorted { $0.open < $1.open }
        let text =
            spans.isEmpty
            ? "Closed"
            : spans.map {
                $0.close - $0.open >= dayMinutes
                    ? "Open 24 hours" : "\(formatTime($0.open, compact: true))–\(formatTime($0.close, compact: true))"
            }.joined(separator: ", ")
        return (day, text)
    }
}

/// Open at 1 AM or later on at least one night (24-hour places count).
public func isOpenLate(_ venue: Venue) -> Bool {
    let hours = venue.hours ?? []
    return hours.contains { runsUntil(hours, $0) >= dayMinutes + 60 }
}
