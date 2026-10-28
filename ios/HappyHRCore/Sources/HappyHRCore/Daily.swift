import Foundation

// Daily specials: deals tied to days of the week rather than a happy-hour
// window. They sit alongside happy hours (a pill, a filter, a section on the
// venue page) and never replace the happy-hour countdowns. A port of src/lib/daily.ts.

/// The daily specials a venue runs on a given day.
public func dailyOn(_ venue: Venue, day: Weekday) -> [DailySpecial] {
    venue.daily.filter { $0.days.contains(day) }
}

/// True when the special has hours and they've ended for the day.
public func dailyOver(_ special: DailySpecial, minutes: Int) -> Bool {
    guard let end = special.end else { return false }
    return minutes >= end
}

/// True when the special runs right now: all day, or within its hours.
public func dailyRunning(_ special: DailySpecial, minutes: Int) -> Bool {
    guard let start = special.start, let end = special.end else { return true }
    return minutes >= start && minutes < end
}

/// Today's special worth mentioning on a card: one that's on or still to come.
/// A weekly special ("Taco Tuesday") beats an every-day one ("$5 shot").
public func dailyToday(_ venue: Venue, at clock: Clock) -> DailySpecial? {
    let today = dailyOn(venue, day: clock.day).filter { !dailyOver($0, minutes: clock.minutes) }
    let weekly = today.filter { $0.days.count < 7 }
    return weekly.first { $0.title != nil } ?? weekly.first ?? today.first
}

/// Short label, e.g. "Taco Tuesday" or "$12 cheeseburger" (the first special listed leads).
public func dailyLabel(_ special: DailySpecial) -> String {
    special.title ?? special.specials.first.map(formatSpecial) ?? "Daily special"
}

/// Everything on special, e.g. "$20 any 3 tacos · $10 margaritas".
public func dailyDetail(_ special: DailySpecial) -> String {
    special.specials.map(formatSpecial).joined(separator: " · ")
}

/// "4–10 PM", or "All day" when the special has no hours.
public func dailyHours(_ special: DailySpecial) -> String {
    guard let start = special.start, let end = special.end else { return "All day" }
    return formatRange(start: start, end: end)
}

/// "Mon, Tue" style day list, or "Every day".
public func dailyDays(_ special: DailySpecial) -> String {
    if special.days.count == 7 { return "Every day" }
    // Monday first.
    return special.days.sorted { ($0 + 6) % 7 < ($1 + 6) % 7 }.map { TorontoTime.dayShort[$0] }.joined(separator: ", ")
}

public struct DailyEntry: Hashable, Sendable {
    public var ranked: RankedVenue
    public var special: DailySpecial
}

public struct DailyDay: Hashable, Sendable {
    public var day: Weekday
    /// "Tomorrow", "Wednesday"…
    public var label: String
    public var entries: [DailyEntry]
}

public struct DailyBoard: Hashable, Sendable {
    public var today: [DailyEntry]
    public var week: [DailyDay]
}

/// The week of daily specials, starting today. Today lists what's on now first,
/// then what's still to come, nearest first; finished specials drop off.
public func dailyBoard(_ items: [RankedVenue], at clock: Clock) -> DailyBoard {
    let entries = { (day: Weekday) in
        items.flatMap { rv in dailyOn(rv.venue, day: day).map { DailyEntry(ranked: rv, special: $0) } }
    }
    let rank = { (e: DailyEntry) in
        (dailyRunning(e.special, minutes: clock.minutes) ? 0 : 1, e.special.days.count == 7 ? 1 : 0, e.ranked.distanceM)
    }
    let today = entries(clock.day)
        .filter { !dailyOver($0.special, minutes: clock.minutes) }
        .stableSorted { rank($0) < rank($1) }

    var week: [DailyDay] = []
    for offset in 1..<7 {
        let day = (clock.day + offset) % 7
        // Every-day specials were already listed under today.
        let list = entries(day).filter { $0.special.days.count < 7 }.stableSorted { $0.ranked.distanceM < $1.ranked.distanceM }
        if !list.isEmpty {
            week.append(DailyDay(day: day, label: offset == 1 ? "Tomorrow" : TorontoTime.dayNames[day], entries: list))
        }
    }
    return DailyBoard(today: today, week: week)
}
