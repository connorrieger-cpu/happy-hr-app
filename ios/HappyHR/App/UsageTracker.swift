import Foundation
import HappyHRCore
import UIKit

/// The app's anonymous usage counts (HappyHRCore/Usage.swift): which area it opens, the
/// rough square it's opened in, and which buttons get tapped. Taps add up per area and day
/// and wait in UserDefaults until the API has them; they go out when the app opens and when
/// it goes to the background.
@MainActor
final class UsageTracker {
    private struct Batch: Codable, Equatable {
        var area: String
        var day: String
        /// Only on a batch of opens: where they happened.
        var cell: String?
        var events: [String: Int]
    }

    private static let key = "usagePending"
    private var pending: [Batch] = {
        guard let data = UserDefaults.standard.data(forKey: key) else { return [] }
        return (try? JSONDecoder().decode([Batch].self, from: data)) ?? []
    }()
    private var sending = false

    /// Counts a tap ("venue", "tile:beer", "area:guelph") in an area.
    func track(_ name: String, area: String) {
        add(name, area: area, cell: nil)
    }

    /// Counts the app opening, with the square it's in when location is on.
    func open(area: String, cell: String?) {
        add("open", area: area, cell: cell)
    }

    private func add(_ name: String, area: String, cell: String?) {
        guard isEventName(name) else { return }
        let day = torontoDate()
        if let i = pending.firstIndex(where: { $0.area == area && $0.day == day && $0.cell == cell }) {
            pending[i].events[name, default: 0] += 1
        } else {
            pending.append(Batch(area: area, day: day, cell: cell, events: [name: 1]))
        }
        save()
    }

    /// Sends what's waiting. Reports the API turns down are dropped; anything that couldn't be
    /// sent (offline, or counts not switched on yet) waits for next time.
    func flush(using client: HappyHRClient) async {
        guard !sending, !pending.isEmpty else { return }
        sending = true
        defer { sending = false }
        // The API counts anything older than two days as today, so it's dropped instead.
        let oldest = torontoDate(Date().addingTimeInterval(-2 * 86_400))
        var batches = pending.filter { $0.day >= oldest }
        pending = []
        while let batch = batches.first {
            do {
                let events = Dictionary(uniqueKeysWithValues: batch.events.sorted { $0.value > $1.value }.prefix(60).map { ($0.key, min($0.value, 500)) })
                try await client.postUsage(UsageReport(device: DeviceID.current, area: batch.area, day: batch.day, cell: batch.cell, events: events))
                batches.removeFirst()
            } catch APIError.rejected {
                batches.removeFirst()
            } catch {
                break
            }
        }
        // Taps made while sending are already in `pending`; put the unsent ones back with them.
        for batch in batches {
            if let i = pending.firstIndex(where: { $0.area == batch.area && $0.day == batch.day && $0.cell == batch.cell }) {
                pending[i].events.merge(batch.events, uniquingKeysWith: +)
            } else {
                pending.append(batch)
            }
        }
        save()
    }

    /// Sends what's waiting as the app goes to the background, with the time iOS allows for it.
    func flushInBackground(using client: HappyHRClient) {
        let task = UIApplication.shared.beginBackgroundTask(withName: "usage")
        Task {
            await flush(using: client)
            UIApplication.shared.endBackgroundTask(task)
        }
    }

    private func save() {
        UserDefaults.standard.set(try? JSONEncoder().encode(pending), forKey: Self.key)
    }
}
