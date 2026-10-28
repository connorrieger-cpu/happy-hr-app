import HappyHRCore
import SwiftUI
import UIKit

/// The area menu, as on the web: a glass panel hanging under the area chip, with the areas
/// (each city's neighbourhoods under its name, then the cities listed whole), then alerts,
/// chat, account, community and appearance. It opens in its own window, like the confetti,
/// so it floats over the deals sheet too.
@MainActor
enum AreaMenu {
    private static var window: UIWindow?

    /// - Parameters:
    ///   - anchor: the area chip's frame on screen; the menu hangs under its right edge.
    ///   - onClose: called once the menu has gone.
    static func show(_ model: AppModel, under anchor: CGRect, onClose: @escaping () -> Void) {
        guard window == nil,
            let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first(where: { $0.activationState == .foregroundActive }),
            let main = scene.windows.first(where: { $0.windowLevel == .normal })
        else { return }
        let room = main.bounds.height - anchor.maxY - 8 - max(main.safeAreaInsets.bottom, 12) - 8
        let menu = AreaMenuView(anchor: anchor, maxHeight: room) {
            window?.isHidden = true
            window = nil
            onClose()
        }
        let host = UIHostingController(rootView: menu.environment(model))
        host.view.backgroundColor = .clear
        let window = UIWindow(windowScene: scene)
        // Above the app's sheets, below system alerts.
        window.windowLevel = .normal + 1
        window.overrideUserInterfaceStyle = main.overrideUserInterfaceStyle
        window.rootViewController = host
        window.isHidden = false
        self.window = window
    }

    /// The menu's groups: each city's neighbourhoods under its name, then the cities listed whole.
    static func groups(_ areas: [Area]) -> [(heading: String, areas: [Area])] {
        var groups: [(heading: String, areas: [Area])] = []
        func add(_ heading: String, _ area: Area) {
            if let i = groups.firstIndex(where: { $0.heading == heading }) { groups[i].areas.append(area) } else { groups.append((heading, [area])) }
        }
        for area in areas where area.name != area.city { add(area.city, area) }
        for area in areas where area.name == area.city { add("More cities", area) }
        return groups
    }
}

private struct AreaMenuView: View {
    let anchor: CGRect
    let maxHeight: CGFloat
    let onClose: () -> Void

    @Environment(AppModel.self) private var model
    @AppStorage("appearance") private var appearance = Appearance.system
    @State private var shown = false
    @State private var closing = false
    /// The rows' full height: the panel hugs it, and scrolls only past `maxHeight`.
    @State private var contentHeight: CGFloat = 0
    @Namespace private var pill

    /// Honey text on the honey highlight: the brand honey in dark mode; in light mode a deeper
    /// amber than the web's #E0A800, which is hard to read on cream.
    private static let honeyText = Color(light: Color(hex: 0x8F6400), dark: .honey)

    var body: some View {
        GeometryReader { screen in
            ZStack(alignment: .topTrailing) {
                // A tap anywhere else closes it (including on the chip, as on the web).
                Color.clear
                    .contentShape(.rect)
                    .onTapGesture { close() }
                    .accessibilityHidden(true)

                panel
                    .frame(width: 284)
                    .glassEffect(.regular.tint(.glassTint), in: .rect(cornerRadius: 24))
                    .shadow(color: .black.opacity(0.22), radius: 24, y: 12)
                    .scaleEffect(shown ? 1 : 0.96, anchor: .topTrailing)
                    .offset(y: shown ? 0 : -6)
                    .opacity(shown ? 1 : 0)
                    .padding(.top, anchor.maxY + 8)
                    .padding(.trailing, max(screen.size.width - anchor.maxX, 12))
                    .accessibilityAddTraits(.isModal)
                    .accessibilityAction(.escape) { close() }
            }
        }
        .ignoresSafeArea()
        .onAppear { withAnimation(.snappy(duration: 0.22)) { shown = true } }
        .sensoryFeedback(.selection, trigger: appearance)
    }

    /// As tall as its rows; scrolls only when they don't fit (a small phone with community on).
    private var panel: some View {
        ScrollView {
            rows.onGeometryChange(for: CGFloat.self, of: { $0.size.height }) { contentHeight = $0 }
        }
        .scrollBounceBehavior(.basedOnSize)
        .frame(height: min(contentHeight, maxHeight))
    }

    private var rows: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(AreaMenu.groups(model.areas).enumerated()), id: \.element.heading) { index, group in
                if index > 0 { divider }
                heading(group.heading)
                ForEach(group.areas, id: \.id) { area in areaRow(area) }
            }

            divider
            Button {
                model.favouriteAlerts.toggle()
            } label: {
                HStack(spacing: 8) {
                    icon("bell.badge")
                    Text("Alerts for your spots").lineLimit(1)
                    Spacer(minLength: 4)
                    // Drawn, not interactive: the whole row is the switch, so it's an easy target.
                    Toggle("", isOn: .constant(model.favouriteAlerts))
                        .labelsHidden()
                        .tint(.honey)
                        .allowsHitTesting(false)
                        .scaleEffect(0.8, anchor: .trailing)
                        // Lay it out at its drawn size, so the label keeps the room.
                        .frame(width: 41, alignment: .trailing)
                }
            }
            .buttonStyle(MenuRowStyle())
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Alerts before your spots’ deals")
            .accessibilityHint("A notification before each starred spot’s happy hour or special")
            .accessibilityValue(model.favouriteAlerts ? "On" : "Off")
            .accessibilityAddTraits(.isToggle)

            action("Group chat", symbol: "bubble.left.and.bubble.right", dot: model.chatUnread) { model.openChat() }
            if let account = model.account {
                action(account.displayName ?? account.email ?? "Signed in with Apple", symbol: "person.crop.circle.fill") { model.showAccount = true }
            } else {
                action("Sign in", symbol: "person.crop.circle") { model.showAccount = true }
            }
            if model.isOwner {
                action("Usage", symbol: "chart.bar.xaxis") { model.showUsage = true }
            }

            if model.communityOn {
                divider
                heading("Community")
                action("Add a happy hour or special", trailing: "plus") { model.contribute = ContributeTarget(venueID: nil) }
                action("Have a venue key?", trailing: "key") { model.showVenueKey = true }
            }

            divider
            heading("Appearance")
            appearancePicker
        }
        .padding(8)
    }

    // MARK: Rows

    private func areaRow(_ area: Area) -> some View {
        let current = area.id == model.areaID
        return Button {
            close { current ? model.showArea() : model.chooseArea(area.id) }
        } label: {
            HStack(spacing: 8) {
                Text(area.name)
                    .fontWeight(current ? .semibold : .medium)
                    .foregroundStyle(current ? Self.honeyText : Color.text)
                Spacer(minLength: 8)
                if area.id == model.hereArea?.id {
                    Text("You’re here")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Self.honeyText)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(Color.honey.opacity(0.18), in: .capsule)
                }
            }
        }
        .buttonStyle(MenuRowStyle(selected: current))
        .accessibilityAddTraits(current ? .isSelected : [])
    }

    /// A row that does something elsewhere (chat, account, a form): the menu closes first.
    private func action(_ title: String, symbol: String? = nil, trailing: String? = nil, dot: Bool = false, perform: @escaping () -> Void) -> some View {
        Button {
            close(then: perform)
        } label: {
            HStack(spacing: 8) {
                if let symbol { icon(symbol) }
                Text(title).lineLimit(1)
                if dot {
                    Circle().fill(Color.honey).frame(width: 7, height: 7).accessibilityLabel("New messages")
                }
                Spacer(minLength: 8)
                if let trailing {
                    Image(systemName: trailing)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color.textSecondary)
                }
            }
        }
        .buttonStyle(MenuRowStyle())
    }

    private func icon(_ symbol: String) -> some View {
        Image(systemName: symbol)
            .font(.system(size: 15, weight: .medium))
            .foregroundStyle(Color.textSecondary)
            .frame(width: 22)
    }

    private func heading(_ text: String) -> some View {
        Text(text.uppercased())
            .font(.system(size: 11, weight: .semibold))
            .tracking(0.9)
            .foregroundStyle(Color.textSecondary.opacity(0.8))
            .padding(.horizontal, 10)
            .padding(.top, 6)
            .padding(.bottom, 4)
            .accessibilityAddTraits(.isHeader)
    }

    private var divider: some View {
        Rectangle()
            .fill(Color.hairline)
            .frame(height: 1)
            .padding(.horizontal, 6)
            .padding(.vertical, 8)
    }

    /// System, Light, Dark, with the web's honey pill sliding to the choice.
    private var appearancePicker: some View {
        HStack(spacing: 4) {
            ForEach(Appearance.allCases) { option in appearanceOption(option) }
        }
        .padding(4)
        .background(Capsule().fill(Color.cardFill).overlay(Capsule().strokeBorder(Color.hairline)))
        .padding(.horizontal, 2)
        .padding(.bottom, 2)
    }

    private func appearanceOption(_ option: Appearance) -> some View {
        let on = appearance == option
        return Button {
            withAnimation(.snappy(duration: 0.25)) { appearance = option }
        } label: {
            HStack(spacing: 5) {
                Image(systemName: option.symbol).font(.system(size: 12, weight: .semibold))
                Text(option.label).font(.system(size: 13, weight: .semibold))
            }
            .foregroundStyle(on ? Color.onHoney : Color.text)
            .frame(maxWidth: .infinity)
            .frame(height: 34)
            .background { if on { honeyPill } }
            .contentShape(.capsule)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(option.label)
        .accessibilityAddTraits(on ? .isSelected : [])
    }

    private var honeyPill: some View {
        Capsule()
            .fill(.honeyFill)
            .overlay(Capsule().strokeBorder(Color(hex: 0xFFF6C8).opacity(0.8)))
            .shadow(color: Color.honey.opacity(0.35), radius: 6, y: 2)
            .matchedGeometryEffect(id: "pill", in: pill)
    }

    // MARK: Closing

    /// Fades the menu up and away, then does what the row asked.
    private func close(then action: (() -> Void)? = nil) {
        guard !closing else { return }
        closing = true
        withAnimation(.snappy(duration: 0.16)) {
            shown = false
        } completion: {
            onClose()
            action?()
        }
    }
}

/// The web's `.area__item`: a quiet row that lights up when pressed, honey when it's the current one.
private struct MenuRowStyle: ButtonStyle {
    var selected = false

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .medium))
            .foregroundStyle(Color.text)
            .padding(.horizontal, 10)
            .frame(minHeight: 40)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background {
                RoundedRectangle(cornerRadius: 12)
                    .fill(selected ? Color.honey.opacity(0.14) : configuration.isPressed ? Color.cardFill : .clear)
            }
            .contentShape(.rect(cornerRadius: 12))
    }
}
