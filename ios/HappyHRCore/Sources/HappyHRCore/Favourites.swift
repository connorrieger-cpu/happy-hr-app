import Foundation

// Favourite spots: the short line each shows in "Your spots", and which ones
// deserve a heads-up because their happy hour is about to start.
// A port of src/lib/favourites.ts.

public enum FavouriteTone: String, Codable, Hashable, Sendable {
    case live, soon, today, quiet

    fileprivate var order: Int {
        switch self {
        case .live: 0
        case .soon: 1
        case .today: 2
        case .quiet: 3
        }
    }
}

public struct FavouriteLine: Hashable, Identifiable, Sendable {
    public var ranked: RankedVenue
    /// "On · till 6 PM", "Starts 4 PM", "Taco Tuesday today", "Tue 4 PM", "Open · till 2 AM".
    public var label: String
    public var tone: FavouriteTone

    public var id: String { ranked.venue.id }
}

public func favouriteLines(_ items: [RankedVenue], ids: [String], at clock: Clock) -> [FavouriteLine] {
    let wanted = Set(ids)
    return items.filter { wanted.contains($0.venue.id) }
        .map { rv -> FavouriteLine in
            switch rv.status {
            case let .live(_, _, endsAt, _):
                return FavouriteLine(ranked: rv, label: "On · till \(formatTime(endsAt, compact: true))", tone: .live)
            case let .soon(_, _, startsAt), let .later(_, _, startsAt):
                return FavouriteLine(ranked: rv, label: "Starts \(formatTime(startsAt, compact: true))", tone: .soon)
            case let .none(next):
                if let daily = dailyToday(rv.venue, at: clock) {
                    return FavouriteLine(ranked: rv, label: "\(dailyLabel(daily)) today", tone: .today)
                }
                if let next {
                    return FavouriteLine(ranked: rv, label: "\(TorontoTime.dayShort[next.day]) \(formatTime(next.startsAt, compact: true))", tone: .quiet)
                }
                let open = openLabel(openState(rv.venue, at: clock), today: clock.day)
                return FavouriteLine(ranked: rv, label: open.isEmpty ? rv.venue.category : open, tone: .quiet)
            }
        }
        .stableSorted { a, b in
            a.tone.order != b.tone.order ? a.tone.order < b.tone.order : a.ranked.distanceM < b.ranked.distanceM
        }
}

/// Heads-up window: a favourite's happy hour starting within this many minutes.
public let headsUpMinutes = 15

/// Favourites whose happy hour starts within the heads-up window.
public func startingSoon(_ items: [RankedVenue], ids: [String]) -> [RankedVenue] {
    let wanted = Set(ids)
    return items.filter { rv in
        guard wanted.contains(rv.venue.id), case let .soon(_, startsIn, _) = rv.status else { return false }
        return startsIn <= headsUpMinutes
    }
}
