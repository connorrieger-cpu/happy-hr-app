import ActivityKit
import Foundation
import HappyHRCore

/// A happy hour counting down on the Lock Screen and in the Dynamic Island: until it
/// starts, then until it ends. Started from the venue page; nothing needs pushing,
/// because the countdowns are timers and the switch happens at the stale date.
nonisolated struct HappyHourAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var startsAt: Date
        var endsAt: Date
        /// The headline deal, "$6 Pints".
        var deal: String?
        /// "2–5 PM" and "2 PM", on Toronto time whatever the phone's time zone.
        var hours: String
        var starts: String
    }

    var venueID: String
    var venueName: String
}

nonisolated extension HappyHourAttributes.ContentState {
    /// The happy hour that's on now, or the next one today, as real times.
    init?(_ rv: RankedVenue, now: Date = .now) {
        // The status counts whole minutes from the start of this one.
        let minute = Date(timeIntervalSince1970: (now.timeIntervalSince1970 / 60).rounded(.down) * 60)
        let window: HappyHourWindow
        switch rv.status {
        case let .live(live, minutesLeft, _, _):
            window = live
            endsAt = minute.addingTimeInterval(Double(minutesLeft) * 60)
            startsAt = endsAt.addingTimeInterval(-Double(live.end - live.start) * 60)
        case let .soon(next, startsIn, _), let .later(next, startsIn, _):
            window = next
            startsAt = minute.addingTimeInterval(Double(startsIn) * 60)
            endsAt = startsAt.addingTimeInterval(Double(next.end - next.start) * 60)
        case .none:
            return nil
        }
        deal = headlineSpecial(window.specials).map(formatSpecial)
        hours = formatRange(window)
        starts = formatTime(window.start, compact: true)
    }
}
