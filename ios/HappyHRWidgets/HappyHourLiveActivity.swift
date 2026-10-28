import ActivityKit
import SwiftUI
import WidgetKit

/// The happy-hour countdown on the Lock Screen and in the Dynamic Island. Before it
/// starts it counts down to the start; at the start the activity goes stale (its stale
/// date), the system redraws it, and it counts down to the end instead.
struct HappyHourLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: HappyHourAttributes.self) { context in
            LockScreenView(context: context)
                .activityBackgroundTint(Color(hex: 0x1A1307).opacity(0.85))
                .activitySystemActionForegroundColor(.honey)
                .widgetURL(URL(string: "happyhr://?v=\(context.attributes.venueID)"))
        } dynamicIsland: { context in
            let phase = Phase(context.state)
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label { Text(context.attributes.venueName).lineLimit(1) } icon: { Text("🍻") }
                        .font(.headline)
                        .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    CountdownText(state: context.state, phase: phase)
                        .font(.headline.monospacedDigit())
                        .foregroundStyle(Color.honey)
                        .padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(phase.caption(context.state)).font(.subheadline).foregroundStyle(.secondary)
                        if let deal = context.state.deal { Text(deal).font(.subheadline.weight(.semibold)) }
                        if phase == .on {
                            ProgressView(timerInterval: context.state.startsAt...context.state.endsAt, countsDown: true) { EmptyView() } currentValueLabel: { EmptyView() }
                                .tint(.honey)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 4)
                }
            } compactLeading: {
                Text("🍻")
            } compactTrailing: {
                // Before it starts, the start time: a countdown of hours doesn't fit.
                Group {
                    if phase == .before { Text(context.state.starts) } else { CountdownText(state: context.state, phase: phase) }
                }
                .font(.caption.monospacedDigit().weight(.semibold))
                .foregroundStyle(Color.honey)
                .frame(maxWidth: 58)
            } minimal: {
                Text("🍻")
            }
            .widgetURL(URL(string: "happyhr://?v=\(context.attributes.venueID)"))
            .keylineTint(.honey)
        }
    }
}

/// Where the happy hour is when the view is drawn (at start, at the stale date, and on updates).
enum Phase: Equatable {
    case before, on, over

    init(_ state: HappyHourAttributes.ContentState, now: Date = .now) {
        self = now < state.startsAt ? .before : now < state.endsAt ? .on : .over
    }

    func caption(_ state: HappyHourAttributes.ContentState) -> String {
        self == .over ? "Happy hour’s over" : "Happy hour \(state.hours)"
    }
}

private struct CountdownText: View {
    let state: HappyHourAttributes.ContentState
    let phase: Phase

    var body: some View {
        switch phase {
        case .before: Text(timerInterval: Date.now...state.startsAt, countsDown: true).multilineTextAlignment(.trailing)
        case .on: Text(timerInterval: state.startsAt...state.endsAt, countsDown: true).multilineTextAlignment(.trailing)
        case .over: Text("Over")
        }
    }
}

private struct LockScreenView: View {
    let context: ActivityViewContext<HappyHourAttributes>

    var body: some View {
        let phase = Phase(context.state)
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                Image("LogoMark").resizable().frame(width: 28, height: 28)
                Text(context.attributes.venueName).font(.headline).foregroundStyle(Color.cream).lineLimit(1)
                Spacer(minLength: 8)
                Text(phase == .before ? "Starts in" : phase == .on ? "Ends in" : "")
                    .font(.caption2.weight(.semibold))
                    .textCase(.uppercase)
                    .foregroundStyle(Color.cream.opacity(0.7))
            }
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    if let deal = context.state.deal {
                        Text(deal).font(.subheadline.weight(.semibold)).foregroundStyle(Color.honey).lineLimit(2)
                    }
                    Text(phase.caption(context.state)).font(.caption).foregroundStyle(Color.cream.opacity(0.7)).lineLimit(1)
                }
                Spacer(minLength: 8)
                CountdownText(state: context.state, phase: phase)
                    .font(.title2.monospacedDigit().weight(.bold))
                    .foregroundStyle(Color.honey)
                    .frame(maxWidth: 120, alignment: .trailing)
            }
            if phase == .on {
                ProgressView(timerInterval: context.state.startsAt...context.state.endsAt, countsDown: true) { EmptyView() } currentValueLabel: { EmptyView() }
                    .tint(.honey)
            }
        }
        .padding(16)
    }
}
