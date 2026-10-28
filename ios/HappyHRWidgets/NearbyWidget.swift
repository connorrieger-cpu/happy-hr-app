import HappyHRCore
import SwiftUI
import WidgetKit

/// "On now near you": how many happy hours are on, and the best few (favourites first),
/// worked out from the same data and rules as the app. Each entry is a moment in the
/// coming hours, so the widget changes over at the right time without the app running.
struct NearbyWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "Nearby", provider: NearbyProvider()) { entry in
            NearbyView(entry: entry)
                .containerBackground(for: .widget) { WidgetBackground() }
        }
        .configurationDisplayName("Happy hours near you")
        .description("What’s on now in your area, your favourites first.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}

struct NearbyEntry: TimelineEntry {
    struct Row: Hashable, Identifiable {
        var id: String
        var name: String
        var deal: String?
        /// "till 7 PM" when it's on, "5:30 PM" when it starts later today.
        var when: String
        var live: Bool
        var favourite: Bool
        var walkMin: Int
    }

    var date: Date
    var liveCount: Int
    var rows: [Row]
    /// "Bar Poet at 12 PM" when nothing's on.
    var nextUp: String?
}

struct NearbyProvider: TimelineProvider {
    func placeholder(in context: Context) -> NearbyEntry {
        NearbyEntry(date: .now, liveCount: 3, rows: [
            .init(id: "a", name: "Bar Koukla", deal: "$6 Pints", when: "till 7 PM", live: true, favourite: true, walkMin: 3),
            .init(id: "b", name: "Manita", deal: "$1.50 Oysters", when: "till 6 PM", live: true, favourite: false, walkMin: 5),
            .init(id: "c", name: "Central", deal: "$5 Highballs", when: "till 5 PM", live: true, favourite: false, walkMin: 4),
        ], nextUp: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (NearbyEntry) -> Void) {
        completion(context.isPreview ? placeholder(in: context) : Self.entries(from: .now, count: 1).first ?? placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<NearbyEntry>) -> Void) {
        completion(Timeline(entries: Self.entries(from: .now, count: 49), policy: .atEnd))
    }

    /// Now, then every 5 minutes on the 5 (happy hours start on the hour or half hour).
    static func entries(from now: Date, count: Int) -> [NearbyEntry] {
        let data = WidgetData.load()
        let step = 5.0 * 60
        let first = (now.timeIntervalSince1970 / step).rounded(.down) * step
        return (0..<count).map { i in
            let date = i == 0 ? now : Date(timeIntervalSince1970: first + Double(i) * step)
            return data.entry(at: date)
        }
    }
}

/// The app's venue list, community deals, favourites and walking origin, from the app group.
struct WidgetData {
    var venues: [Venue]
    var favourites: Set<String>
    var origin: LatLng

    static func load() -> WidgetData {
        let payload = SharedStore.storedPayload(SharedStore.areaID)
        let venues = payload.map { SharedStore.venues($0, community: SharedStore.community.submissions) } ?? []
        let origin = SharedStore.origin ?? payload?.area.origin.location ?? LatLng(lat: 43.6496, lng: -79.4209)
        return WidgetData(venues: venues, favourites: SharedStore.favourites, origin: origin)
    }

    func entry(at date: Date) -> NearbyEntry {
        let clock = Clock(date)
        let ranked = rankVenues(venues, at: clock, from: origin)
        let favouritesFirst = { (list: [RankedVenue]) in
            list.filter { favourites.contains($0.venue.id) } + list.filter { !favourites.contains($0.venue.id) }
        }
        let live = favouritesFirst(ranked.live)
        let today = favouritesFirst(ranked.soon + ranked.later)
        let rows = (live + today).prefix(3).map { rv -> NearbyEntry.Row in
            let window = focusWindow(rv.status)
            let when: String
            switch rv.status {
            case let .live(_, _, endsAt, _): when = "till \(formatTime(endsAt, compact: true))"
            case let .soon(_, _, startsAt), let .later(_, _, startsAt): when = formatTime(startsAt, compact: true)
            case .none: when = ""
            }
            return .init(
                id: rv.venue.id, name: rv.venue.name, deal: headlineSpecial(window?.specials ?? []).map(formatSpecial), when: when,
                live: rv.status.kind == .live, favourite: favourites.contains(rv.venue.id), walkMin: rv.walkMin)
        }
        var nextUp: String?
        if rows.isEmpty {
            let next = ranked.rest.compactMap { rv -> (RankedVenue, VenueStatus.Next)? in
                if case let .none(next?) = rv.status { (rv, next) } else { nil }
            }
            .min { a, b in
                let ahead = { (n: VenueStatus.Next) in ((n.day - clock.day + 7) % 7) * TorontoTime.dayMinutes + n.startsAt }
                return ahead(a.1) < ahead(b.1)
            }
            if let (rv, n) = next {
                let day = n.day == (clock.day + 1) % 7 ? "tomorrow" : TorontoTime.dayShort[n.day]
                nextUp = "\(rv.venue.name), \(day) \(formatTime(n.startsAt, compact: true))"
            }
        }
        return NearbyEntry(date: date, liveCount: ranked.live.count, rows: Array(rows), nextUp: nextUp)
    }
}

// MARK: - Views

struct WidgetBackground: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        LinearGradient(
            colors: colorScheme == .dark ? [Color(hex: 0x2A1E0B), Color(hex: 0x120D05)] : [Color(hex: 0xFFF8E1), Color(hex: 0xFFEDB8)],
            startPoint: .top, endPoint: .bottom)
    }
}

struct NearbyView: View {
    @Environment(\.widgetFamily) private var family
    let entry: NearbyEntry

    var body: some View {
        switch family {
        case .accessoryInline:
            Text(inlineText)
        case .accessoryRectangular:
            rectangular
        case .systemMedium:
            medium
        default:
            small
        }
    }

    private var headline: String {
        if entry.liveCount == 0 { return entry.rows.isEmpty ? "Nothing on now" : "Later today" }
        return entry.liveCount == 1 ? "1 on now" : "\(entry.liveCount) on now"
    }

    private var inlineText: String {
        guard let first = entry.rows.first else { return "🍻 \(headline)" }
        return first.live ? "🍻 \(headline) · \(first.name)" : "🍻 \(first.name) at \(first.when)"
    }

    private var small: some View {
        VStack(alignment: .leading, spacing: 4) {
            header
            Spacer(minLength: 0)
            if let row = entry.rows.first {
                if row.live {
                    Text("\(entry.liveCount)")
                        .font(.display(40, weight: .heavy))
                        .foregroundStyle(Color.honeyAccent)
                        .contentTransition(.numericText())
                    Text(entry.liveCount == 1 ? "happy hour on" : "happy hours on").font(.caption.weight(.semibold))
                }
                Text("\(row.favourite ? "⭐ " : "")\(row.name)").font(.subheadline.weight(.bold)).lineLimit(1)
                Text(row.live ? (row.deal.map { "\($0) · \(row.when)" } ?? row.when) : "Starts \(row.when)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            } else {
                Text("Nothing on right now").font(.subheadline.weight(.bold))
                if let nextUp = entry.nextUp { Text("Next: \(nextUp)").font(.caption).foregroundStyle(.secondary).lineLimit(2) }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .widgetURL(entry.rows.first.flatMap { URL(string: "happyhr://?v=\($0.id)") })
    }

    private var medium: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                header
                Spacer()
                Text(headline).font(.caption.weight(.bold)).foregroundStyle(entry.liveCount > 0 ? Color.honeyAccent : .secondary)
            }
            if entry.rows.isEmpty {
                Spacer(minLength: 0)
                Text("Nothing on right now").font(.headline)
                if let nextUp = entry.nextUp { Text("Next up: \(nextUp)").font(.subheadline).foregroundStyle(.secondary) }
                Spacer(minLength: 0)
            } else {
                ForEach(entry.rows) { row in
                    Link(destination: URL(string: "happyhr://?v=\(row.id)")!) { rowView(row) }
                }
                Spacer(minLength: 0)
            }
        }
    }

    private func rowView(_ row: NearbyEntry.Row) -> some View {
        HStack(spacing: 8) {
            Circle()
                .fill(row.live ? Color.honey : .clear)
                .strokeBorder(row.live ? .clear : Color.honey, lineWidth: 1.5)
                .frame(width: 8, height: 8)
            VStack(alignment: .leading, spacing: 0) {
                Text("\(row.favourite ? "⭐ " : "")\(row.name)").font(.subheadline.weight(.semibold)).lineLimit(1)
                if let deal = row.deal { Text(deal).font(.caption).foregroundStyle(.secondary).lineLimit(1) }
            }
            Spacer(minLength: 4)
            VStack(alignment: .trailing, spacing: 0) {
                Text(row.live ? row.when : "Starts \(row.when)")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(row.live ? Color.honeyAccent : .secondary)
                Text("\(row.walkMin) min walk").font(.caption2).foregroundStyle(.tertiary)
            }
        }
    }

    private var rectangular: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text("🍻 \(headline)").font(.headline).widgetAccentable()
            if let row = entry.rows.first {
                Text(row.name).font(.subheadline.weight(.semibold)).lineLimit(1)
                Text(row.live ? (row.deal.map { "\($0) · \(row.when)" } ?? row.when) : "Starts \(row.when)").font(.caption).lineLimit(1)
            } else if let nextUp = entry.nextUp {
                Text("Next: \(nextUp)").font(.caption).lineLimit(2)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .widgetURL(entry.rows.first.flatMap { URL(string: "happyhr://?v=\($0.id)") })
    }

    private var header: some View {
        HStack(spacing: 5) {
            Image("LogoMark").resizable().frame(width: 18, height: 18)
            Text("Happy \(Text("Hr").foregroundStyle(Color.honeyAccent))").font(.display(14))
        }
    }
}
