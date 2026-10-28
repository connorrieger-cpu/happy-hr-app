import HappyHRCore
import SwiftUI

/// Pick any day and time to see what's on then, and switch demo data on or off.
/// Opened from the clock button over the map (the web's TimePreview).
struct TimePreviewView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @Namespace private var pill
    @State private var day: Weekday = 0
    @State private var minutes = 0.0
    @State private var height: CGFloat = 560

    private static let lastSlot = Double(24 * 60 - 15)
    private static let presets: [(label: String, clock: TorontoClock)] = [
        ("Fri after work", TorontoClock(day: 5, minutes: 17 * 60 + 30)),
        ("Sat late night", TorontoClock(day: 6, minutes: 23 * 60 + 30)),
        ("Sun afternoon", TorontoClock(day: 0, minutes: 15 * 60)),
        ("Tue 4 PM", TorontoClock(day: 2, minutes: 16 * 60)),
    ]

    var body: some View {
        @Bindable var model = model
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Preview a time").font(.display(24))
                        Text("See what’s on at any hour").font(.subheadline).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 15, weight: .semibold))
                            .frame(width: 36, height: 36)
                    }
                    .buttonStyle(.plain)
                    .glassCircle()
                    .accessibilityLabel("Close")
                }

                days

                Text(formatTime(Int(minutes)))
                    .font(.display(40))
                    .monospacedDigit()
                    .contentTransition(.numericText())
                    .frame(maxWidth: .infinity)
                Slider(value: $minutes, in: 0...Self.lastSlot, step: 15)
                    .accessibilityLabel("Time of day")

                FlowLayout(spacing: 8) {
                    ForEach(Self.presets, id: \.label) { preset in
                        Button(preset.label) { apply(preset.clock) }
                            .font(.subheadline.weight(.semibold))
                            .modifier(ChipStyle(selected: false))
                    }
                }

                // Only Ossington has demo data.
                if model.areaID == SharedStore.defaultAreaID {
                    // The whole row is the switch, so it's an easy target.
                    Button {
                        withAnimation(.snappy) { model.demo.toggle() }
                    } label: {
                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Demo data").font(.body.weight(.semibold))
                                Text("Fill every venue with sample deals. Not real.").font(.footnote).foregroundStyle(.secondary)
                            }
                            Spacer(minLength: 0)
                            Toggle("Demo data", isOn: $model.demo)
                                .labelsHidden()
                                .tint(.honey)
                                .allowsHitTesting(false)
                        }
                        .padding(14)
                        .contentShape(.rect)
                    }
                    .buttonStyle(.plain)
                    .cardBackground(cornerRadius: 16)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("Demo data")
                    .accessibilityValue(model.demo ? "On" : "Off")
                    .accessibilityAddTraits(.isToggle)
                }

                HStack(spacing: 10) {
                    Button {
                        model.preview = nil
                        dismiss()
                    } label: {
                        Text("Back to now").frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.glass)
                    .disabled(model.preview == nil)

                    Button {
                        apply(TorontoClock(day: day, minutes: Int(minutes)))
                    } label: {
                        Text("Preview").frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.glassProminent)
                    .tint(.honey)
                    .foregroundStyle(Color.onHoney)
                }
                .font(.body.weight(.semibold))
                .controlSize(.large)
            }
            .padding(20)
            .onGeometryChange(for: CGFloat.self, of: \.size.height) { height = $0 }
        }
        .scrollBounceBehavior(.basedOnSize)
        // Just tall enough for everything, plus room for the grabber.
        .presentationDetents([.height(height + 16)])
        .onAppear {
            // Start from the time on show, to the nearest quarter hour.
            day = model.clock.day
            minutes = min((Double(model.clock.minutes) / 15).rounded() * 15, Self.lastSlot)
        }
    }

    /// Su Mo Tu We Th Fr Sa, with a honey pill on the chosen day.
    private var days: some View {
        HStack(spacing: 2) {
            ForEach(0..<7, id: \.self) { d in
                Button {
                    withAnimation(.snappy) { day = d }
                } label: {
                    Text(TorontoTime.dayShort[d].prefix(2))
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(day == d ? Color.onHoney : Color.text)
                        .frame(maxWidth: .infinity, minHeight: 34)
                        .background {
                            if day == d { Capsule().fill(.honeyFill).matchedGeometryEffect(id: "day", in: pill) }
                        }
                        .contentShape(.capsule)
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(day == d ? .isSelected : [])
            }
        }
        .padding(4)
        .background(Color.cardFill, in: .capsule)
        .overlay(Capsule().strokeBorder(Color.hairline))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Day")
    }

    private func apply(_ clock: TorontoClock) {
        model.preview = clock
        dismiss()
    }
}
