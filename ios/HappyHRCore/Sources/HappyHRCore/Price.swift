import Foundation

// Prices for search's "Cheapest first": the cheapest special at a spot that matches what
// someone picked (beer, tacos…). Only single items at one price compare; bottles,
// pitchers, "any 3 tacos" and discounts are left out so the order stays fair.
// A port of src/lib/price.ts.

/// Not one drink or plate at one price, so not comparable (price.ts `NOT_SINGLE`).
private let notSingle = #"\b(bottles?|pitchers?|buckets?|flights?|towers?|any \d|set|per person|for (two|2)|feast)\b|half-price|half price|% off|\$\d+ off|\bfree\b"#

/// The special's price when it's one comparable item at one price.
public func singlePrice(_ special: Special) -> Double? {
    guard let price = special.price, !jsRegex(notSingle).matches(special.item) else { return nil }
    return price
}

public struct PriceDeal: Hashable, Sendable {
    public var special: Special
    public var price: Double
    /// Running right now.
    public var on: Bool
    /// When it's available: "On now · till 6 PM", "Today 4–6 PM", "Mon–Fri 4–6 PM", "Tue".
    public var when: String
}

private func windowWhen(_ rv: RankedVenue, _ window: HappyHourWindow, _ clock: Clock) -> (on: Bool, when: String) {
    switch rv.status {
    case let .live(live, _, endsAt, _) where live == window:
        return (true, "On now · till \(formatTime(endsAt, compact: true))")
    case let .soon(next, _, _) where next == window, let .later(next, _, _) where next == window:
        return (false, "Today \(formatRange(window))")
    default:
        if window.days.contains(clock.day) && window.start > clock.minutes { return (false, "Today \(formatRange(window))") }
        return (false, "\(formatDays(window.days)) \(formatRange(window))")
    }
}

private func dailyWhen(_ special: DailySpecial, _ clock: Clock) -> (on: Bool, when: String) {
    let today = special.days.contains(clock.day)
    let hours = special.start.flatMap { start in special.end.map { formatRange(start: start, end: $0) } } ?? ""
    if today && dailyRunning(special, minutes: clock.minutes) {
        return (true, special.end.map { "On now · till \(formatTime($0, compact: true))" } ?? "On today")
    }
    if today, let start = special.start, start > clock.minutes { return (false, "Today \(hours)") }
    return (false, "\(special.days.count == 7 ? "Every day" : formatDays(special.days))\(hours.isEmpty ? "" : " \(hours)")")
}

/// The spot's cheapest single-priced special that `matches` accepts; on a tie, the one on
/// now, then the first listed.
public func cheapestDeal(_ rv: RankedVenue, matching matches: (Special) -> Bool, at clock: Clock) -> PriceDeal? {
    var best: PriceDeal?
    func consider(_ special: Special, _ timing: (on: Bool, when: String)) {
        guard let price = singlePrice(special), matches(special) else { return }
        if best == nil || price < best!.price || (price == best!.price && timing.on && !best!.on) {
            best = PriceDeal(special: special, price: price, on: timing.on, when: timing.when)
        }
    }
    for window in rv.venue.happyHours {
        let timing = windowWhen(rv, window, clock)
        for special in window.specials { consider(special, timing) }
    }
    // An all-day special isn't on while the venue is closed.
    let open = mightBeOpen(rv.venue, at: clock)
    for daily in rv.venue.daily {
        var timing = dailyWhen(daily, clock)
        if timing.on && !open { timing = (false, timing.when == "On today" ? "Today" : timing.when) }
        for special in daily.specials { consider(special, timing) }
    }
    return best
}
