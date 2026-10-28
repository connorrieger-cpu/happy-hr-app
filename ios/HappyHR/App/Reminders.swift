import Foundation
import HappyHRCore
import Observation
import UserNotifications

/// Weekly reminders for a deal, as local notifications on Toronto time (the
/// web app offers a calendar file instead). A bell on the venue page turns one
/// on or off, and starring a spot alerts you before all of its deals.
@Observable
final class Reminders {
    /// iOS keeps at most this many pending notifications.
    static let systemLimit = 64

    /// The reminder ids ("reminder.manita.happy-hour.0") that have notifications scheduled.
    private(set) var active: Set<String> = []

    private let center = UNUserNotificationCenter.current()

    /// "reminder.{venueId}.{happy-hour|daily}.{index}"; each weekday's notification adds ".{day}".
    static func id(venueID: String, kind: String, index: Int) -> String { "reminder.\(venueID).\(kind).\(index)" }

    func isOn(_ id: String) -> Bool { active.contains(id) }

    /// Reads what's scheduled, e.g. after launch.
    func refresh() async {
        let pending = await center.pendingNotificationRequests()
        active = Set(pending.compactMap { request in
            let parts = request.identifier.split(separator: ".")
            return parts.count == 5 ? parts.prefix(4).joined(separator: ".") : nil
        })
    }

    /// Turns a reminder on or off. Returns a message to show when it can't be turned on.
    func toggle(_ id: String, plan: ReminderPlan, venueID: String) async -> String? {
        if isOn(id) {
            let ids = plan.days.map { "\(id).\($0)" }
            center.removePendingNotificationRequests(withIdentifiers: ids)
            active.remove(id)
            return nil
        }
        // Ask the first time someone taps a bell, not at launch.
        let granted = (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false
        guard granted else { return "Notifications are off for Happy Hr. Turn them on in Settings to get reminders." }

        let pending = await center.pendingNotificationRequests()
        // A favourite's alert for the same deal makes way for the bell.
        let favourite = pending.map(\.identifier).filter { $0.hasPrefix(Self.favouriteID(id) + ".") }
        center.removePendingNotificationRequests(withIdentifiers: favourite)
        if pending.count - favourite.count + plan.days.count > Self.systemLimit {
            return "That’s more reminders than iPhone allows at once. Turn one off first."
        }

        await schedule(id, plan: plan, venueID: venueID, title: plan.title, body: plan.detail)
        active.insert(id)
        return nil
    }

    // MARK: Favourites

    /// "fav.manita.happy-hour.0" for the bell id "reminder.manita.happy-hour.0".
    private static func favouriteID(_ reminderID: String) -> String { "fav." + reminderID.dropFirst("reminder.".count) }

    /// Alerts for every favourite, at most one a day each: 15 minutes before the day's first happy
    /// hour or, on a day without one, before that day's special (at noon when it runs all day).
    /// Specials on every day of the week don't count as news. Replaces the last set; a deal with its
    /// bell on keeps the bell's reminder. Returns a message when iPhone's limit leaves some out.
    func syncFavourites(_ venues: [Venue], enabled: Bool) async -> String? {
        let pending = await center.pendingNotificationRequests()
        let old = pending.map(\.identifier).filter { $0.hasPrefix("fav.") }
        center.removePendingNotificationRequests(withIdentifiers: old)
        let wanted = venues.filter { hasDeals($0) && $0.deals != .sample }
        guard enabled, !wanted.isEmpty else { return nil }
        // Asks the first time someone stars a spot; after that this just reads the answer.
        guard (try? await center.requestAuthorization(options: [.alert, .sound])) == true else { return nil }

        var room = Self.systemLimit - (pending.count - old.count)
        for venue in wanted {
            for day in 0..<7 {
                let window = venue.happyHours.enumerated().filter { $0.element.days.contains(day) }.min { $0.element.start < $1.element.start }
                let special = venue.daily.enumerated().first { $0.element.days.contains(day) && $0.element.days.count < 7 }
                var item: (kind: String, index: Int, plan: ReminderPlan)
                if let window {
                    item = ("happy-hour", window.offset, reminderPlan(venue, window: window.element))
                } else if let special {
                    item = ("daily", special.offset, reminderPlan(venue, daily: special.element))
                } else {
                    continue
                }
                if isOn(Self.id(venueID: venue.id, kind: item.kind, index: item.index)) { continue }
                guard room > 0 else { return "iPhone allows 64 alerts at once, so some of your spots won’t get one." }
                room -= 1
                item.plan.days = [day]
                let body = item.plan.start.map { "Starts at \(formatTime($0, compact: true)) · \(item.plan.detail)" } ?? "On today · \(item.plan.detail)"
                await schedule(
                    Self.favouriteID(Self.id(venueID: venue.id, kind: item.kind, index: item.index)), plan: item.plan, venueID: venue.id,
                    title: "⭐ \(item.plan.title)", body: body)
            }
        }
        return nil
    }

    /// One repeating notification per day of the plan, `{id}.{day}`, on Toronto time.
    private func schedule(_ id: String, plan: ReminderPlan, venueID: String, title: String, body: String) async {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TorontoTime.timeZone
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.userInfo = ["venueID": venueID]

        for (day, (alertDay, minutes)) in zip(plan.days, reminderTimes(plan)) {
            var when = DateComponents()
            when.calendar = calendar
            when.timeZone = TorontoTime.timeZone
            // Calendar counts Sunday as 1; the app counts it as 0.
            when.weekday = alertDay + 1
            when.hour = minutes / 60
            when.minute = minutes % 60
            let trigger = UNCalendarNotificationTrigger(dateMatching: when, repeats: true)
            try? await center.add(UNNotificationRequest(identifier: "\(id).\(day)", content: content, trigger: trigger))
        }
    }
}
