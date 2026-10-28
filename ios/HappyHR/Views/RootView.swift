import HappyHRCore
import SwiftUI

/// The map, a floating glass top bar, and the deals sheet over it (the Apple
/// Maps layout: the map stays usable while the sheet is at its smaller heights).
struct RootView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.scenePhase) private var scenePhase
    @State private var splashing = true
    @State private var detent: PresentationDetent = .fraction(0.45)
    /// Where the top bar ends and the sheet starts, in screen points, so the map can keep its content between them.
    /// The sheet's top only counts once it stops moving: redoing the map on every frame of a drag makes the sheet stick.
    @State private var topBarBottom: CGFloat = 120
    @State private var sheetTop: CGFloat?
    /// The sheet is (nearly) full height. The map keeps its last framing meanwhile, so it
    /// doesn't jump when the sheet comes back down.
    @State private var mapCovered = false
    @State private var settle = Debounce()
    @State private var notice: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            TopBar()
                .onGeometryChange(for: CGFloat.self, of: { $0.frame(in: .global).maxY }) { topBarBottom = $0 }
            if model.preview != nil || model.demoing {
                PreviewBanner()
                    .transition(.move(edge: .top).combined(with: .opacity))
            } else if let headsUp = model.headsUp {
                // A favourite's happy hour is about to start: tap to open it.
                Button {
                    model.select(headsUp.venueID)
                    model.dismissHeadsUp()
                } label: {
                    Text(headsUp.text)
                        .font(.subheadline.weight(.semibold))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .glassPanel(cornerRadius: 20)
                }
                .buttonStyle(.plain)
                .transition(.move(edge: .top).combined(with: .opacity))
                .task(id: headsUp.id) {
                    try? await Task.sleep(for: .seconds(8))
                    if !Task.isCancelled { withAnimation(.smooth) { model.dismissHeadsUp() } }
                }
            } else if let notice {
                Text(notice)
                    .font(.subheadline.weight(.semibold))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .glassPanel(cornerRadius: 20)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .padding(.horizontal, 12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        // The map is a background so it can never size or move the top bar. In a ZStack, a keyboard in
        // a sheet shrank this view below the map's safe-area padding; the map then grew the stack, which
        // re-centred and moved the top bar, which changed the padding: a loop that froze the iPhone.
        .background {
            MapScreen(topBarBottom: topBarBottom, sheetTop: sheetTop, covered: mapCovered)
                .ignoresSafeArea()
        }
        // A keyboard in any sheet (chat, search, forms) must not touch the map: re-laying out its
        // 84 pins for every frame of the keyboard animation froze the app on iPhone.
        .ignoresSafeArea(.keyboard)
        // Tell people once why walking times aren't from them (after the splash).
        .task(id: splashing ? nil : model.locationNote) {
            guard let note = splashing ? nil : model.locationNote else { return }
            await show(note)
        }
        .task(id: model.notice?.id) {
            guard let note = model.notice?.text else { return }
            await show(note)
        }
        .animation(.smooth, value: model.preview != nil || model.demoing)
        .animation(.smooth, value: model.headsUp)
        // Shared links (`?v=manita&meet=1050`) and venue keys (`?venuekey=…`).
        .onOpenURL { model.open($0) }
        .sheet(isPresented: .constant(!splashing)) {
            SheetRoot(detent: $detent)
                .onGeometryChange(for: CGFloat.self, of: { $0.frame(in: .global).minY }) { top in
                    settle.after(.milliseconds(150)) {
                        mapCovered = top - topBarBottom < 120
                        if !mapCovered { sheetTop = top }
                    }
                }
                .presentationDetents([.height(190), .fraction(0.45), .large], selection: $detent)
                .presentationBackgroundInteraction(.enabled(upThrough: .fraction(0.45)))
                // Swiping the list moves the sheet first, then scrolls once it's full height (like Apple Maps).
                .presentationContentInteraction(.resizes)
                .sheetBackground()
                .interactiveDismissDisabled()
        }
        .overlay {
            if splashing {
                SplashView { withAnimation(.smooth) { splashing = false } }
                    .transition(.opacity)
            }
        }
        #if DEBUG
            // `./sim.sh -confetti` shows the easter egg without ten quick taps.
            .onChange(of: splashing) { _, splashing in
                if !splashing, ProcessInfo.processInfo.arguments.contains("-confetti") { Confetti.rain() }
            }
        #endif
        .task {
            model.location.start()
            await model.refresh()
        }
        // Anonymous counts: this open (a few seconds in, once the area has settled).
        .task { await model.countOpen() }
        // The first fix this launch opens the area the person is in.
        .onChange(of: model.location.coordinate) { _, _ in model.locationChanged() }
        // Fresh deals and time when coming back to the app (instead of pull to refresh,
        // which fought with dragging the sheet down).
        .onChange(of: scenePhase) { _, phase in
            if phase == .background { model.sendUsage() }
            guard phase == .active else { return }
            model.tick()
            Task { await model.refresh() }
            Task { await model.countOpen() }
        }
        .task {
            // Keep "on now" honest: re-check the time every 30 seconds.
            while !Task.isCancelled {
                model.tick()
                try? await Task.sleep(for: .seconds(30))
            }
        }
    }

    private func show(_ note: String) async {
        withAnimation(.smooth) { notice = note }
        try? await Task.sleep(for: .seconds(4.2))
        if !Task.isCancelled { withAnimation(.smooth) { notice = nil } }
    }
}

/// The sheet's navigation: the deals list, with venue pages pushed on top.
/// Search and the add-a-deal form are presented from here (a sheet can't be
/// presented from the root while this one is up).
private struct SheetRoot: View {
    @Environment(AppModel.self) private var model
    @Binding var detent: PresentationDetent

    var body: some View {
        @Bindable var model = model
        NavigationStack {
            NowSheet()
                .navigationDestination(item: $model.selectedVenueID) { id in
                    VenueDetailView(venueID: id)
                }
        }
        .onChange(of: model.selectedVenueID) { _, id in
            if id != nil, detent == .height(190) { detent = .fraction(0.45) }
        }
        .sheet(isPresented: $model.showSearch) {
            SearchView().sheetBackground()
        }
        .sheet(item: $model.contribute) { target in
            ContributeView(target: target).sheetBackground()
        }
        .sheet(isPresented: $model.showAccount) {
            AccountView()
                .presentationDetents([.large])
                .sheetBackground()
        }
        .sheet(isPresented: $model.showTimePreview) {
            TimePreviewView()
                .sheetBackground()
        }
        .sheet(item: Binding(get: { model.sharing }, set: { if $0 == nil { model.sharingID = nil } })) { rv in
            ShareView(rv: rv)
                .presentationDetents([.medium])
                .sheetBackground()
        }
        .sheet(item: $model.claiming) { venue in
            ClaimView(venue: venue).sheetBackground()
        }
        .sheet(isPresented: $model.showVenueKey) {
            VenueKeyView().sheetBackground()
        }
        .sheet(isPresented: $model.showChat) {
            ChatView()
                .presentationDetents([.large])
                .sheetBackground()
        }
        .sheet(isPresented: $model.showUsage) {
            UsageView()
                .presentationDetents([.large])
                .sheetBackground()
        }
    }
}

/// Logo on the left; search and the area menu on the right. All floating glass.
private struct TopBar: View {
    @Environment(AppModel.self) private var model
    @State private var menuOpen = false
    /// Where the area chip is on screen, so the menu hangs under it.
    @State private var chipFrame = CGRect.zero
    /// Quick taps on the logo; the tenth makes it rain drinks.
    @State private var logoTaps: [Date] = []
    @State private var cheers = 0

    var body: some View {
        GlassEffectContainer(spacing: 10) {
            HStack(spacing: 10) {
                HStack(spacing: 8) {
                    Image("LogoMark")
                        .resizable()
                        .frame(width: 32, height: 32)
                    Text("Happy \(Text("Hr").foregroundStyle(Color.honeyAccent))")
                        .font(.display(22))
                }
                .padding(.leading, 8)
                .padding(.trailing, 16)
                .frame(height: 50)
                // The wordmark keeps its width; a long area name gives way first.
                .fixedSize()
                .glassCapsule()
                .contentShape(.capsule)
                .onTapGesture { tapLogo() }
                // The owner's Usage screen (asks for the owner password on a new phone).
                .onLongPressGesture(minimumDuration: 1.2) { model.ownerGesture() }
                .sensoryFeedback(.success, trigger: cheers)

                Spacer(minLength: 0)

                Button {
                    model.showSearch = true
                } label: {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 18, weight: .semibold))
                        .frame(width: 44, height: 44)
                }
                .buttonStyle(.plain)
                .glassCircle()
                .accessibilityLabel("Search spots and deals")

                // The area menu (AreaMenu.swift): the web's glass dropdown, over the sheet too.
                Button {
                    menuOpen = true
                    model.track("area-menu")
                    AreaMenu.show(model, under: chipFrame) { menuOpen = false }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "mappin.and.ellipse")
                            .foregroundStyle(Color.honeyAccent)
                        Text(model.area?.name ?? "Ossington")
                            .lineLimit(1)
                        Image(systemName: "chevron.down")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(Color.textSecondary)
                            .rotationEffect(.degrees(menuOpen ? 180 : 0))
                            .animation(.snappy, value: menuOpen)
                    }
                    .font(.system(size: 15, weight: .semibold))
                    .padding(.leading, 12)
                    .padding(.trailing, 13)
                    .frame(height: 44)
                    .contentShape(.capsule)
                }
                .buttonStyle(.plain)
                .glassCapsule(interactive: true)
                .onGeometryChange(for: CGRect.self, of: { $0.frame(in: .global) }) { chipFrame = $0 }
                .accessibilityLabel("Area: \(model.area?.name ?? "Ossington")")
                .accessibilityHint("Opens the area menu")
            }
        }
    }

    /// Ten taps, each within a second of the last.
    private func tapLogo() {
        let now = Date()
        // A pause of more than a second starts the count again.
        if let last = logoTaps.last, now.timeIntervalSince(last) > 1 { logoTaps = [] }
        logoTaps.append(now)
        guard logoTaps.count >= 10 else { return }
        logoTaps = []
        cheers += 1
        Confetti.rain()
    }
}

/// "Previewing Tue 6 PM · Demo data", with a way back to each (the web's preview banner).
private struct PreviewBanner: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        HStack(spacing: 10) {
            Text(label)
                .font(.subheadline.weight(.bold))
                .lineLimit(1)
                .minimumScaleFactor(0.85)
            Spacer(minLength: 0)
            if model.preview != nil {
                Button("Back to now") { model.preview = nil }
            }
            if model.demoing {
                Button("Real deals") { model.demo = false }
            }
        }
        .font(.subheadline.weight(.semibold))
        .buttonStyle(.plain)
        .foregroundStyle(Color.onHoney)
        .padding(.leading, 16)
        .padding(.trailing, 14)
        .padding(.vertical, 10)
        .glassCapsule(tint: .honey)
    }

    private var label: String {
        var parts: [String] = []
        if let preview = model.preview { parts.append("Previewing \(TorontoTime.dayShort[preview.day]) \(formatTime(preview.minutes, compact: true))") }
        if model.demoing { parts.append("Demo data") }
        return parts.joined(separator: " · ")
    }
}

/// Runs the last action it was given once things have been quiet for a moment.
final class Debounce {
    private var task: Task<Void, Never>?

    func after(_ delay: Duration, _ action: @escaping () -> Void) {
        task?.cancel()
        task = Task {
            try? await Task.sleep(for: delay)
            if !Task.isCancelled { action() }
        }
    }
}
