import Foundation

// Reminders for a favourite spot's deal. The web app hands people a weekly
// calendar event; the iOS app schedules local notifications from the same
// plan. A port of `reminderPlan` in src/lib/reminders.ts.

/// Alerts come this many minutes before the deal starts.
public let reminderLeadMinutes = 15

public struct ReminderPlan: Codable, Hashable, Sendable {
    public var title: String
    /// What's on, e.g. "$10 Margaritas · $6 Happy Hour Food (12 dishes)".
    public var detail: String
    public var days: [Weekday]
    /// Minutes after midnight of each of `days`, Toronto time (≥ 1440 means early the next morning); nil for an all-day special.
    public var start: Int?
    public var end: Int?

    public init(title: String, detail: String, days: [Weekday], start: Int? = nil, end: Int? = nil) {
        self.title = title
        self.detail = detail
        self.days = days
        self.start = start
        self.end = end
    }
}

public func reminderPlan(_ venue: Venue, window: HappyHourWindow) -> ReminderPlan {
    ReminderPlan(
        title: "Happy hour at \(venue.name)", detail: window.specials.prefix(3).map(formatSpecial).joined(separator: " · "),
        days: window.days.sorted(), start: window.start, end: window.end
    )
}

public func reminderPlan(_ venue: Venue, daily: DailySpecial) -> ReminderPlan {
    ReminderPlan(
        title: "\(dailyLabel(daily)) at \(venue.name)", detail: daily.specials.prefix(3).map(formatSpecial).joined(separator: " · "),
        days: daily.days.sorted(), start: daily.start, end: daily.end
    )
}

/// When each weekly alert fires: (weekday, minutes after midnight), Toronto time.
/// `lead` minutes before the start, wrapping across days and the week (a 1 AM
/// start lands on the next day; 12:05 AM lands just before midnight). All-day
/// specials alert at noon.
public func reminderTimes(_ plan: ReminderPlan, lead: Int = reminderLeadMinutes) -> [(day: Weekday, minutes: Int)] {
    let week = 7 * TorontoTime.dayMinutes
    return plan.days.map { day in
        guard let start = plan.start else { return (day, 12 * 60) }
        let at = ((day * TorontoTime.dayMinutes + start - lead) % week + week) % week
        return (at / TorontoTime.dayMinutes, at % TorontoTime.dayMinutes)
    }
}
