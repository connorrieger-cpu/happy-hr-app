import HappyHRCore
import SwiftUI

// The list's building blocks, matching the web app's cards and rows
// (web/src/components/DealCard.tsx and status.tsx).

/// Countdown ring: the honey arc is the share of happy hour that's left.
struct StatusRing: View {
    let status: VenueStatus
    var size: CGFloat = 52

    var body: some View {
        let stroke: CGFloat = size > 60 ? 5 : 4
        ZStack {
            if status.kind == .soon {
                // Starting soon: a dashed honey track, no arc yet.
                Circle()
                    .inset(by: stroke / 2)
                    .stroke(Color.honey.opacity(0.8), style: StrokeStyle(lineWidth: stroke, dash: [3, 4]))
            } else {
                Circle().inset(by: stroke / 2).stroke(.quaternary, lineWidth: stroke)
            }
            if case let .live(_, _, _, progress) = status {
                Circle()
                    .inset(by: stroke / 2)
                    .trim(from: 0, to: 1 - progress)
                    .stroke(isEndingSoon(status) ? Color.ember : Color.honey, style: StrokeStyle(lineWidth: stroke, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .shadow(color: .honey.opacity(0.5), radius: 4)
            }
            VStack(spacing: 0) {
                Text(text.big)
                    .font(.display(size * (text.big.count > 3 ? 0.27 : 0.33)))
                    .monospacedDigit()
                if !text.small.isEmpty {
                    Text(text.small)
                        .font(.system(size: max(7.5, size * 0.145), weight: .semibold))
                        .foregroundStyle(.secondary)
                        .textCase(.uppercase)
                        .lineLimit(1)
                        // "MIN LEFT" stays inside the ring.
                        .minimumScaleFactor(0.6)
                        .frame(maxWidth: size - 2 * stroke - 8)
                }
            }
            .foregroundStyle(isEndingSoon(status) ? Color.ember : status.kind == .live ? Color.honeyAccent : Color.text)
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }

    private var text: (big: String, small: String) {
        switch status {
        case let .live(_, left, _, _):
            left < 60 ? ("\(left)", "min left") : ("\(left / 60):\(String(format: "%02d", left % 60))", "left")
        case let .soon(_, _, startsAt), let .later(_, _, startsAt):
            splitTime(startsAt)
        case let .none(next):
            next.map { (TorontoTime.dayShort[$0.day], formatTime($0.startsAt, compact: true)) } ?? ("—", "")
        }
    }

    private func splitTime(_ minutes: Int) -> (String, String) {
        let parts = formatTime(minutes, compact: true).split(separator: " ")
        return (String(parts.first ?? ""), String(parts.last ?? ""))
    }
}

struct SpecialPill: View {
    let special: Special

    var body: some View {
        Text(formatSpecial(special))
            .font(.system(size: 12.5, weight: .semibold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(special.kind == .drink ? Color.honey.opacity(0.16) : Color.ember.opacity(0.14), in: .capsule)
    }
}

/// Today's daily special: a quiet dashed note, never a timer.
struct TodayPill: View {
    let special: DailySpecial

    var body: some View {
        Text("Today · \(dailyLabel(special))")
            .font(.system(size: 11.5, weight: .semibold))
            .foregroundStyle(Color.honeyAccent)
            .lineLimit(1)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Color.honey.opacity(0.07), in: .capsule)
            .overlay(Capsule().strokeBorder(Color.honey.opacity(0.38), style: StrokeStyle(lineWidth: 1, dash: [3, 2])))
    }
}

struct WalkLabel: View {
    let minutes: Int

    var body: some View {
        Label("\(minutes) min", systemImage: "figure.walk")
            .font(.system(size: 12.5, weight: .semibold))
            .foregroundStyle(.secondary)
            .labelStyle(.titleAndIcon)
    }
}

/// A happy hour that's on or starting soon.
struct DealCard: View {
    let rv: RankedVenue
    let today: DailySpecial?
    var tally: VoteTally?
    var favourite = false

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            StatusRing(status: rv.status)
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(rv.venue.name).font(.headline).lineLimit(1)
                    if favourite { FavouriteStar() }
                    Spacer(minLength: 4)
                    WalkLabel(minutes: rv.walkMin)
                }
                Text("\(rv.venue.category) · \(statusLine(rv.status))")
                    .font(.subheadline)
                    .foregroundStyle(isEndingSoon(rv.status) ? Color.ember : Color.textSecondary)
                    .lineLimit(1)
                let specials = Array((focusWindow(rv.status)?.specials ?? []).prefix(3))
                if !specials.isEmpty {
                    FlowLayout(spacing: 5, lineSpacing: 5) {
                        ForEach(specials, id: \.self) { SpecialPill(special: $0) }
                        if rv.venue.deals == .community { Tag("Community") }
                        VoteBadge(tally: tally)
                        // Old and nobody has confirmed it lately.
                        if voteSummary(tally).mood == .none, freshness(rv.venue, tally: tally)?.stale == true {
                            Tag("May be out of date", tint: .amber, dashed: true)
                        }
                    }
                    .padding(.top, 2)
                }
                if let today { TodayPill(special: today).padding(.top, 2) }
            }
        }
        .padding(12)
        .cardBackground(highlighted: rv.status.kind == .live)
        .contentShape(.rect)
    }
}

/// "✓ 3" when people confirmed it lately, "Not working?" when they didn't.
struct VoteBadge: View {
    let tally: VoteTally?

    var body: some View {
        switch voteSummary(tally).mood {
        case .confirmed: Tag("✓ \(tally?.yes ?? 0)", tint: .green)
        case .disputed: Tag("Not working?", tint: .ember)
        case .none: EmptyView()
        }
    }
}

struct Tag: View {
    let text: String
    var tint: Color = .secondary
    var dashed = false

    init(_ text: String, tint: Color = .secondary, dashed: Bool = false) {
        self.text = text
        self.tint = tint
        self.dashed = dashed
    }

    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(tint)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .overlay(Capsule().strokeBorder(tint.opacity(0.5), style: StrokeStyle(lineWidth: 1, dash: dashed ? [3, 2] : [])))
    }
}

/// A favourite in "Your spots": its name and what's on there.
struct YourSpotCard: View {
    let line: FavouriteLine

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(line.ranked.venue.name)
                .font(.subheadline.weight(.semibold))
                .lineLimit(1)
            HStack(spacing: 5) {
                if line.tone == .live { Circle().fill(.honeyFill).frame(width: 7, height: 7) }
                Text(line.label)
                    .font(.footnote.weight(line.tone == .live ? .semibold : .regular))
                    .foregroundStyle(line.tone == .live ? Color.honeyAccent : line.tone == .quiet ? Color.textSecondary : Color.text)
                    .lineLimit(1)
            }
        }
        .frame(minWidth: 120, maxWidth: 200, alignment: .leading)
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .cardBackground(cornerRadius: 16, highlighted: line.tone == .live)
        .contentShape(.rect)
    }
}

/// A compact row for a happy hour later today or this week.
struct DealRow: View {
    let rv: RankedVenue
    let today: DailySpecial?
    var favourite = false

    var body: some View {
        HStack(spacing: 12) {
            VStack(spacing: 2) {
                if !when.day.isEmpty {
                    Text(when.day).font(.system(size: 10, weight: .semibold)).foregroundStyle(.tertiary).textCase(.uppercase)
                }
                Text(when.time).font(.display(14))
            }
            .frame(width: 54)
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 5) {
                    Text(rv.venue.name).font(.subheadline.weight(.semibold)).lineLimit(1)
                    if favourite { FavouriteStar() }
                }
                Group {
                    if let best = headlineSpecial(focusWindow(rv.status)?.specials ?? []) {
                        Text("\(rv.venue.category) · \(Text(formatSpecial(best)).foregroundStyle(Color.text))")
                    } else {
                        Text(rv.venue.category)
                    }
                }
                .font(.footnote)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                if let today { TodayPill(special: today) }
            }
            Spacer(minLength: 4)
            WalkLabel(minutes: rv.walkMin)
        }
        .padding(.vertical, 10)
        .padding(.horizontal, 8)
        .contentShape(.rect)
    }

    private var when: (day: String, time: String) {
        switch rv.status {
        case let .live(_, _, endsAt, _): ("Now", formatTime(endsAt, compact: true))
        case let .soon(_, _, startsAt), let .later(_, _, startsAt): ("", formatTime(startsAt, compact: true))
        case let .none(next): next.map { (TorontoTime.dayShort[$0.day], formatTime($0.startsAt, compact: true)) } ?? ("", "—")
        }
    }
}

/// A spot with no known happy hour: what it is, how far, and today's special if any.
struct SpotRow: View {
    let rv: RankedVenue
    let today: DailySpecial?
    var favourite = false
    /// "Open · till 2 AM", "Closed · opens 5 PM", or "" when the hours aren't known.
    var open = ""

    var body: some View {
        HStack(spacing: 12) {
            Text(rv.venue.vibe.glyph).font(.title3).frame(width: 54)
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 5) {
                    Text(rv.venue.name).font(.subheadline.weight(.semibold)).lineLimit(1)
                    if favourite { FavouriteStar() }
                }
                Group {
                    if let today {
                        Text("\(rv.venue.category) · \(Text("Today · \(dailyLabel(today))").foregroundStyle(Color.text))")
                    } else if !open.isEmpty {
                        // Whether it's open says more than the address here.
                        Text("\(rv.venue.category) · \(Text(open).foregroundStyle(open.hasPrefix("Open") ? Color.openGreen : Color.textSecondary))")
                    } else {
                        Text("\(rv.venue.category) · \(rv.venue.address)")
                    }
                }
                .font(.footnote)
                .foregroundStyle(.secondary)
                .lineLimit(1)
            }
            Spacer(minLength: 4)
            WalkLabel(minutes: rv.walkMin)
        }
        .padding(.vertical, 10)
        .padding(.horizontal, 8)
        .contentShape(.rect)
    }
}

/// A daily special in the Daily specials view: when, where and what.
struct DailyRow: View {
    let entry: DailyEntry
    let dayLabel: String
    /// Minutes now, for today's rows: marks the ones running.
    var minutes: Int?
    /// False when the hours say the venue is closed right now.
    var open = true

    var body: some View {
        HStack(spacing: 12) {
            VStack(spacing: 2) {
                Text(when.day)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(on ? Color.honeyAccent : Color.textSecondary)
                    .textCase(.uppercase)
                Text(when.time).font(.display(13))
            }
            .frame(width: 54)
            VStack(alignment: .leading, spacing: 3) {
                Text(entry.ranked.venue.name).font(.subheadline.weight(.semibold)).lineLimit(1)
                Group {
                    if let title = entry.special.title {
                        Text("\(Text(title).foregroundStyle(Color.text)) · \(dailyDetail(entry.special))")
                    } else {
                        Text(dailyDetail(entry.special))
                    }
                }
                .font(.footnote)
                .foregroundStyle(.secondary)
                .lineLimit(2)
            }
            Spacer(minLength: 4)
            WalkLabel(minutes: entry.ranked.walkMin)
        }
        .padding(.vertical, 10)
        .padding(.horizontal, 8)
        .contentShape(.rect)
    }

    private var on: Bool { open && (minutes.map { dailyRunning(entry.special, minutes: $0) } ?? false) }

    /// Running with hours: when it ends. Otherwise when it starts, or "All day".
    private var when: (day: String, time: String) {
        let short = dayLabel == "Today" ? "Today" : String(dayLabel.prefix(3))
        guard let start = entry.special.start, let end = entry.special.end else { return (on ? "On" : short, "All day") }
        return on ? ("Till", formatTime(end, compact: true)) : (short, formatTime(start, compact: true))
    }
}

/// Marks a favourite spot next to its name.
struct FavouriteStar: View {
    var body: some View {
        Image(systemName: "star.fill")
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(Color.honeyAccent)
            .accessibilityLabel("Favourite")
    }
}

/// A vibe on the venue page ("☀️ Patio"): a little stronger than a plain tag.
struct VibeTag: View {
    let vibe: VibeFilter

    var body: some View {
        Text("\(vibe.emoji) \(vibe.label)")
            .font(.system(size: 11.5, weight: .bold))
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Color.cardFill, in: .capsule)
            .overlay(Capsule().strokeBorder(Color.hairline))
    }
}
