import HappyHRCore
import SwiftUI

/// The deals list: what's on now, starting soon, later today and this week,
/// then every other spot. The Daily specials filter switches it to a by-day view.
struct NowSheet: View {
    @Environment(AppModel.self) private var model
    @State private var showWeek = false
    @State private var showSpots = false
    @State private var showDailyWeek = false

    var body: some View {
        let now = model.rightNow
        let daily = model.filter == .daily
        let board = daily ? dailyBoard(now.all, at: model.clock) : nil

        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header(now: now, board: board)
                FilterChips()

                if let board {
                    dailyView(board)
                } else {
                    dealsView(now)
                }

                Text(
                    "Beta · Restaurants and bars that serve alcohol in \(model.area?.covers ?? model.area?.name ?? "this area"). “Reported” deals are unconfirmed, so check with the venue before you go."
                )
                .font(.caption)
                .foregroundStyle(.tertiary)
                .frame(maxWidth: .infinity)
                .multilineTextAlignment(.center)
                .padding(.top, 8)
            }
            .padding(.horizontal, 16)
            .padding(.top, 20)
            .padding(.bottom, 32)
        }
        .scrollIndicators(.hidden)
        .toolbar(.hidden, for: .navigationBar)
    }

    // MARK: Header

    @ViewBuilder
    private func header(now: RightNow, board: DailyBoard?) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Label("\(TorontoTime.dayNames[model.clock.day]) · \(formatTime(model.clock.minutes))", systemImage: "clock")
                .font(.footnote.weight(.semibold))
                .textCase(.uppercase)
                .tracking(0.6)
                .foregroundStyle(.secondary)
            Group {
                if let board {
                    Text(board.today.isEmpty ? "No daily specials left today" : "\(board.today.count) daily specials today")
                } else if now.live.isEmpty {
                    Text("Nothing on right now")
                } else {
                    let dot = Text(Image(systemName: "circle.fill")).font(.system(size: 12)).foregroundStyle(Color.honeyAccent)
                    Text("\(dot) \(now.live.count) happy hour\(now.live.count == 1 ? "" : "s") on now")
                }
            }
            .font(.display(26))
            Text(subtitle(now: now, daily: board != nil))
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    private func subtitle(now: RightNow, daily: Bool) -> String {
        if daily { return "Deals by day of the week · walking from \(model.originLabel)" }
        if !now.live.isEmpty { return "Nearest first · walking from \(model.originLabel)" }
        if let next = now.soon.first ?? now.later.first, case let .soon(_, _, at) = next.status {
            return "Next up: \(next.venue.name) at \(formatTime(at, compact: true))"
        }
        if let next = now.later.first, case let .later(_, _, at) = next.status {
            return "Next up: \(next.venue.name) at \(formatTime(at, compact: true))"
        }
        return "Nearest first · walking from \(model.originLabel)"
    }

    // MARK: Happy hours

    @ViewBuilder
    private func dealsView(_ now: RightNow) -> some View {
        // "Your spots": starred places and what's on there, only when there are some (as on the web).
        let lines = model.favouriteLines
        section("Your spots", count: lines.count) {
            ScrollView(.horizontal) {
                HStack(spacing: 8) {
                    ForEach(lines) { line in
                        Button { model.select(line.id) } label: { YourSpotCard(line: line) }
                            .buttonStyle(.plain)
                    }
                }
            }
            .scrollIndicators(.hidden)
            .contentMargins(.horizontal, 16, for: .scrollContent)
            .padding(.horizontal, -16)
            if model.account == nil {
                Button("Sign in to keep these on all your devices") { model.showAccount = true }
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Color.honeyAccent)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 2)
            }
        }
        section("On now", count: now.live.count, live: true) {
            ForEach(now.live) { rv in
                Button { model.select(rv.venue.id) } label: {
                    DealCard(rv: rv, today: dailyToday(rv.venue, at: model.clock), tally: model.community.votes[rv.venue.id], favourite: model.isFavourite(rv.venue.id))
                }
                .buttonStyle(.plain)
            }
        }
        section("Starting soon", count: now.soon.count) {
            ForEach(now.soon) { rv in
                Button { model.select(rv.venue.id) } label: {
                    DealCard(rv: rv, today: dailyToday(rv.venue, at: model.clock), tally: model.community.votes[rv.venue.id], favourite: model.isFavourite(rv.venue.id))
                }
                .buttonStyle(.plain)
            }
        }
        section("Later today", count: now.later.count) {
            rows(now.later)
        }
        if !now.rest.isEmpty {
            DisclosureGroup(isExpanded: $showWeek) {
                rows(now.rest)
            } label: {
                sectionTitle("Later this week", count: now.rest.count)
            }
        }
        if !now.unlisted.isEmpty {
            DisclosureGroup(isExpanded: $showSpots) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("No happy hour listed. Tap one for directions, booking and its number.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    Button {
                        model.showSearch = true
                    } label: {
                        Label("Search by name, food or deal", systemImage: "magnifyingglass")
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(12)
                            .cardBackground(cornerRadius: 12)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.secondary)
                    VStack(spacing: 0) {
                        ForEach(now.unlisted) { rv in
                            Button { model.select(rv.venue.id) } label: {
                                SpotRow(
                                    rv: rv, today: dailyToday(rv.venue, at: model.clock), favourite: model.isFavourite(rv.venue.id),
                                    open: openLabel(openState(rv.venue, at: model.clock), today: model.clock.day))
                            }
                            .buttonStyle(.plain)
                            Divider().padding(.leading, 66)
                        }
                    }
                    .cardBackground()
                    if model.communityOn {
                        Button("Know a deal at one of these? Add it") { model.contribute = ContributeTarget(venueID: nil) }
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(Color.honeyAccent)
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding(.top, 8)
            } label: {
                sectionTitle("More spots", count: now.unlisted.count)
            }
        }
    }

    // MARK: Daily specials

    @ViewBuilder
    private func dailyView(_ board: DailyBoard) -> some View {
        section("Today", count: board.today.count, live: true) {
            VStack(spacing: 0) {
                ForEach(Array(board.today.enumerated()), id: \.offset) { _, entry in
                    Button { model.select(entry.ranked.venue.id) } label: {
                        // An all-day special isn't "On" while the venue is closed.
                        DailyRow(
                            entry: entry, dayLabel: "Today", minutes: model.clock.minutes,
                            open: mightBeOpen(entry.ranked.venue, at: model.clock))
                    }
                    .buttonStyle(.plain)
                }
            }
            .cardBackground()
        }
        if !board.week.isEmpty {
            DisclosureGroup(isExpanded: $showDailyWeek) {
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(board.week, id: \.day) { day in
                        Text(day.label).font(.footnote.weight(.semibold)).foregroundStyle(.secondary)
                        VStack(spacing: 0) {
                            ForEach(Array(day.entries.enumerated()), id: \.offset) { _, entry in
                                Button { model.select(entry.ranked.venue.id) } label: {
                                    DailyRow(entry: entry, dayLabel: day.label)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .cardBackground()
                    }
                }
                .padding(.top, 8)
            } label: {
                sectionTitle("Rest of the week", count: board.week.reduce(0) { $0 + $1.entries.count })
            }
        }
    }

    // MARK: Pieces

    @ViewBuilder
    private func section<Content: View>(_ title: String, count: Int, live: Bool = false, @ViewBuilder content: () -> Content) -> some View {
        if count > 0 {
            VStack(alignment: .leading, spacing: 8) {
                sectionTitle(title, count: count, live: live)
                content()
            }
        }
    }

    private func sectionTitle(_ title: String, count: Int, live: Bool = false) -> some View {
        HStack(spacing: 8) {
            Text(title).textCase(.uppercase)
            Text("\(count)")
                .padding(.horizontal, 7)
                .padding(.vertical, 2)
                .background(.fill.tertiary, in: .capsule)
        }
        .font(.caption.weight(.semibold))
        .foregroundStyle(live ? Color.honeyAccent : Color.textSecondary)
    }

    private func rows(_ items: [RankedVenue]) -> some View {
        VStack(spacing: 0) {
            ForEach(items) { rv in
                Button { model.select(rv.venue.id) } label: {
                    DealRow(rv: rv, today: dailyToday(rv.venue, at: model.clock), favourite: model.isFavourite(rv.venue.id))
                }
                .buttonStyle(.plain)
                Divider().padding(.leading, 66)
            }
        }
        .cardBackground()
    }
}

/// All · Drinks · Food · Ending soon · Late night · Daily specials. Glass buttons; the selected one is honey.
struct FilterChips: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) {
                ForEach(DealFilter.allCases, id: \.self) { filter in
                    let selected = model.filter == filter
                    Button(filter.label) {
                        withAnimation(.snappy) { model.filter = filter }
                    }
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(selected ? Color.onHoney : Color.text)
                    .modifier(ChipStyle(selected: selected))
                }
            }
            .padding(.vertical, 2)
        }
        .scrollIndicators(.hidden)
        // Run edge to edge, so chips scroll out under the sheet's edge instead of being cut at the margin.
        .contentMargins(.horizontal, 16, for: .scrollContent)
        .padding(.horizontal, -16)
    }
}

/// Liquid Glass buttons: prominent (tinted honey) when selected, plain glass otherwise.
struct ChipStyle: ViewModifier {
    let selected: Bool

    func body(content: Content) -> some View {
        if selected {
            content.buttonStyle(.glassProminent).tint(.honey)
        } else {
            content.buttonStyle(.glass)
        }
    }
}
