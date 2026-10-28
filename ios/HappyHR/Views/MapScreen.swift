import HappyHRCore
import MapKit
import SwiftUI

/// Apple Maps with Happy HR pins: glowing honey for happy hours on now, an
/// outlined dot with a time for ones starting soon, faint dots for everything
/// else. Rotated so Ossington runs straight up the screen, like the web app.
struct MapScreen: View {
    @Environment(AppModel.self) private var model
    /// Where the top bar ends and the sheet begins, in screen points. The map
    /// frames the area between them, and its buttons float just above the sheet.
    var topBarBottom: CGFloat
    var sheetTop: CGFloat?
    var covered = false

    var body: some View {
        if let area = model.area {
            AreaMap(area: area, topBarBottom: topBarBottom, sheetTop: sheetTop, covered: covered)
        } else {
            Color("AppBackground")
        }
    }
}

private struct AreaMap: View {
    @Environment(AppModel.self) private var model
    @Environment(\.colorScheme) private var colorScheme
    let area: Area
    var topBarBottom: CGFloat
    var sheetTop: CGFloat?
    var covered: Bool

    @State private var position: MapCameraPosition = .automatic
    @State private var size: CGSize = .zero
    @State private var camera: MapCamera?
    /// Screen points per unit of the Mercator world (HappyHRCore's `worldSize`) times the camera
    /// distance: constant for a given view, so it turns a zoom into a MapKit camera distance.
    @State private var scale: Double?
    @State private var framed = false
    @State private var locating = false

    var body: some View {
        let pins = pinModels(
            area: area, items: model.mapItems, selectedID: model.selectedVenueID, worldSize: worldSize,
            bearing: camera?.heading ?? heading, now: model.clock, daily: model.filter == .daily
        )
        let hidden = quietPinsUnderLabels(pins, worldSize: worldSize, bearing: camera?.heading ?? heading)

        MapReader { proxy in
            Map(position: $position) {
                // A fixed order (layer, then id): an unstable sort shuffled the ~70 same-layer pins on every
                // redraw, and MapKit re-stacked them all each time, which froze the app on iPhone.
                ForEach(pins.filter { !hidden.contains($0.id) }.sorted { ($0.zIndex, $0.id) < ($1.zIndex, $1.id) }) { pin in
                    // The pin includes its label, so tapping the deal opens the venue too; the anchor keeps the dot on the spot.
                    Annotation(pin.ranked.venue.name, coordinate: pin.ranked.venue.coordinate, anchor: VenuePin.anchor(pin)) {
                        VenuePin(pin: pin, selected: pin.id == model.selectedVenueID)
                            .onTapGesture { model.select(pin.id) }
                    }
                    .annotationTitles(.hidden)
                }
                UserAnnotation()
            }
            .mapStyle(.standard(elevation: .flat, emphasis: colorScheme == .dark ? .muted : .automatic, pointsOfInterest: .excludingAll))
            .ignoresSafeArea(.keyboard)
            // Warms Apple's blue-grey dark map toward the web app's mocha map.
            .overlay {
                if colorScheme == .dark {
                    Color(hex: 0x8A5A1A).opacity(0.4).blendMode(.color).allowsHitTesting(false).ignoresSafeArea()
                }
            }
            .mapControls {}
            // MapKit centres the camera in its safe area and keeps Apple's logo and
            // Legal link inside it, so it's the space between the top bar and the sheet.
            .safeAreaPadding(EdgeInsets(top: insets.top, leading: insets.left, bottom: insets.bottom, trailing: insets.right))
            // The user's dot is blue, as on the web; the app's honey tint is for deals.
            .tint(.blue)
            .onMapCameraChange(frequency: .onEnd) { context in
                camera = context.camera
                measure(proxy, distance: context.camera.distance)
            }
        }
        .onGeometryChange(for: CGSize.self, of: \.size) { size = $0 }
        .overlay(alignment: .bottomTrailing) {
            MapButtons(topBarBottom: topBarBottom, sheetTop: sheetTop, covered: covered, height: size.height, locate: locate)
        }
        .onAppear {
            position = .camera(MapCamera(centerCoordinate: area.center.coordinate, distance: 2_600, heading: heading, pitch: 0))
        }
        .onChange(of: area) { _, _ in frameArea() }
        .onChange(of: scale != nil && sheetTop != nil) { _, ready in
            if ready && !framed { frameArea() }
        }
        .onChange(of: model.selectedVenueID) { _, id in
            guard let id, let venue = model.venues.first(where: { $0.id == id }) else { return }
            pan(to: venue.location)
        }
        .onChange(of: model.frameRequest) { _, _ in frameArea() }
        // Asked for "my location" before the phone had a fix: go there once it does.
        .onChange(of: model.location.coordinate) { _, here in
            guard locating, let here else { return }
            locating = false
            fly(to: here)
        }
    }

    // MARK: Locate

    private func locate() {
        model.track("locate")
        model.location.start()
        guard let here = model.location.coordinate else {
            if model.location.denied {
                model.say("Location is off. Turn it on in Settings › Happy Hr to see where you are.")
            } else {
                locating = true
                model.say("Finding you…")
            }
            return
        }
        fly(to: here)
    }

    private func fly(to point: LatLng) {
        if distanceMeters(point, area.center) >= 3_000 {
            model.say("You’re not near \(area.name) yet. Tap \(area.name) at the top to go back.")
        }
        let distance = min(camera?.distance ?? 1_500, 1_500)
        withAnimation(.smooth) {
            position = .camera(MapCamera(centerCoordinate: point.coordinate, distance: distance, heading: camera?.heading ?? heading, pitch: 0))
        }
    }

    // MARK: Camera

    /// The web app's bearing (-14.4°) as a MapKit heading.
    private var heading: CLLocationDirection { (area.bearing + 360).truncatingRemainder(dividingBy: 360) }

    private var worldSize: Double {
        guard let scale, let camera else { return 256 * pow(2, 16.5) }
        return scale / camera.distance
    }

    /// Screen space the top bar and the sheet cover, kept clear when framing and panning (as on the web).
    /// Capped so a full-height sheet still leaves the map a sensible safe area.
    private var insets: (top: Double, right: Double, bottom: Double, left: Double) {
        let top = topBarBottom + 8
        let bottom = sheetTop.map { size.height - $0 + 12 } ?? 0
        return (top, 24, min(max(bottom, 0), max(size.height - top - 120, 0)), 24)
    }

    private func measure(_ proxy: MapProxy, distance: Double) {
        let b = area.bounds
        let sw = LatLng(lat: b.south, lng: b.west)
        let ne = LatLng(lat: b.north, lng: b.east)
        guard let a = proxy.convert(sw.coordinate, to: .local), let c = proxy.convert(ne.coordinate, to: .local) else { return }
        let ua = project(sw, worldSize: 1)
        let uc = project(ne, worldSize: 1)
        let unit = hypot(ua.x - uc.x, ua.y - uc.y)
        guard unit > 0 else { return }
        scale = hypot(a.x - c.x, a.y - c.y) / unit * distance
    }

    /// Fits the area's bounds between the top bar and the sheet, like the web's fitBounds with insets.
    private func frameArea() {
        guard let scale, size != .zero else { return }
        framed = true
        let b = area.bounds
        let corners = [(b.south, b.west), (b.south, b.east), (b.north, b.west), (b.north, b.east)]
            .map { toScreen(LatLng(lat: $0.0, lng: $0.1), worldSize: 1, bearing: heading) }
        let width = (corners.map(\.x).max() ?? 0) - (corners.map(\.x).min() ?? 0)
        let height = (corners.map(\.y).max() ?? 0) - (corners.map(\.y).min() ?? 0)
        let i = insets
        let fit = min((size.width - i.left - i.right) / width, (size.height - i.top - i.bottom) / height)
        guard fit.isFinite, fit > 0 else { return }
        let middle = LatLng(lat: (b.south + b.north) / 2, lng: (b.west + b.east) / 2)
        withAnimation(.smooth) {
            position = .camera(MapCamera(centerCoordinate: middle.coordinate, distance: scale / fit, heading: heading, pitch: 0))
        }
    }

    /// Pans (keeping the zoom) so `point` sits in the middle of the map that's showing.
    private func pan(to point: LatLng) {
        guard let camera else { return }
        withAnimation(.smooth) {
            position = .camera(MapCamera(centerCoordinate: point.coordinate, distance: camera.distance, heading: camera.heading, pitch: 0))
        }
    }
}

/// Chat, locate and "Preview a time", just above the sheet: stacked when there's room, side by side
/// when it's tight, hidden once the sheet covers the map (as on the web). Its own view, so the chat's
/// "new messages" dot and the preview state never redraw the map and its pins.
private struct MapButtons: View {
    @Environment(AppModel.self) private var model
    var topBarBottom: CGFloat
    var sheetTop: CGFloat?
    var covered: Bool
    var height: CGFloat
    var locate: () -> Void

    var body: some View {
        if let sheetTop, !covered {
            let room = sheetTop - topBarBottom - 2 * 16
            let layout = room >= 46 * 3 + 20 ? AnyLayout(VStackLayout(spacing: 10)) : AnyLayout(HStackLayout(spacing: 10))
            if room >= 46 {
                layout {
                    mapButton("bubble.left.and.bubble.right", label: model.chatUnread ? "Group chat, new messages" : "Group chat") {
                        model.openChat()
                    }
                    .overlay(alignment: .topTrailing) {
                        if model.chatUnread {
                            Circle().fill(.honeyFill).frame(width: 12, height: 12).overlay(Circle().stroke(Color.ink, lineWidth: 2)).offset(x: 1, y: -1)
                        }
                    }
                    mapButton("location", label: "Show my location", action: locate)
                    mapButton("clock", label: "Preview a different time", on: model.preview != nil) { model.showTimePreview = true }
                }
                .padding(.trailing, 16)
                // A little clear of the sheet, so its drag area never takes the tap.
                .padding(.bottom, height - sheetTop + 16)
                .animation(.smooth, value: sheetTop)
            }
        }
    }

    /// A Liquid Glass circle button (honey when it's on), using the system glass button styles.
    private func mapButton(_ symbol: String, label: String, on: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 18, weight: .semibold))
                .frame(width: 30, height: 30)
        }
        .foregroundStyle(on ? Color.onHoney : Color.text)
        .modifier(ChipStyle(selected: on))
        .buttonBorderShape(.circle)
        .accessibilityLabel(label)
    }
}

extension LatLng {
    var coordinate: CLLocationCoordinate2D { CLLocationCoordinate2D(latitude: lat, longitude: lng) }
}

extension Venue {
    var coordinate: CLLocationCoordinate2D { location.coordinate }
}

/// A pin: a dot on the venue with its deal beside it (HStack, so the label can be tapped too;
/// HappyHRCore's `pinModels` decides the side), and the name above it when selected.
struct VenuePin: View {
    let pin: PinModel
    let selected: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var kind: VenueStatus.Kind { pin.ranked.status.kind }
    private var isHoney: Bool { pin.daily || kind == .live }

    /// The dot's centre within the pin, as the annotation's anchor, so the dot sits on the venue.
    /// The label is `labelWidth` wide and starts 11 points from the dot's centre, as on the web.
    static func anchor(_ pin: PinModel) -> UnitPoint {
        guard let label = pin.label, let side = pin.side else { return .center }
        let width = 27 + labelWidth(label)
        return UnitPoint(x: side == .left ? (width - 16) / width : 16 / width, y: 0.5)
    }

    var body: some View {
        HStack(spacing: -5) {
            if pin.side == .left, let label = pin.label { labelView(label) }
            dotView
            if pin.side == .right, let label = pin.label { labelView(label) }
        }
        .contentShape(.rect)
        .animation(.spring(duration: 0.3), value: selected)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(pin.ranked.venue.name + (pin.label.map { ", \($0)" } ?? ""))
        .accessibilityAddTraits(.isButton)
    }

    private var dotView: some View {
        dot
            .scaleEffect(selected ? 1.45 : 1)
            .frame(width: 32, height: 32)
            .overlay {
                // The name floats just above the dot (it's about 30 points tall).
                if selected {
                    Text(pin.ranked.venue.name)
                        .font(.system(size: 13, weight: .bold))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .glassCapsule()
                        .fixedSize()
                        .offset(y: -34)
                        .transition(.opacity)
                }
            }
    }

    private func labelView(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 12.5, weight: .bold))
            .foregroundStyle(isHoney ? Color.onHoney : Color.text)
            .lineLimit(1)
            .minimumScaleFactor(0.8)
            .padding(.horizontal, 8)
            .frame(width: labelWidth(text), height: 28)
            .glassCapsule(tint: isHoney ? .honey : nil)
    }

    @ViewBuilder private var dot: some View {
        if pin.daily || kind == .soon {
            Circle()
                .fill(Color.ink800)
                .frame(width: 12, height: 12)
                .overlay(Circle().stroke(Color.honey, lineWidth: 2.5))
        } else if kind == .live {
            Circle()
                .fill(RadialGradient(colors: [Color(hex: 0xFFFBE0), .honey, .amber], center: UnitPoint(x: 0.35, y: 0.3), startRadius: 0, endRadius: 9))
                .frame(width: 14, height: 14)
                .overlay(Circle().stroke(Color(hex: 0xFFF8D6), lineWidth: 2))
                .shadow(color: .honey.opacity(0.7), radius: 8)
                .background { if !reduceMotion { Pulse() } }
        } else if pin.quiet {
            // No happy hour: present, but faint (a honey ring when there's a daily special today).
            Circle()
                .fill(pin.special ? Color.honey.opacity(0.25) : Color.cream.opacity(0.32))
                .frame(width: 7, height: 7)
                .overlay(Circle().stroke(pin.special ? Color.honey.opacity(0.8) : Color.ink.opacity(0.45), lineWidth: 1))
        } else {
            Circle()
                .fill(Color.cream.opacity(0.55))
                .frame(width: 9, height: 9)
                .overlay(Circle().stroke(Color.ink.opacity(0.6), lineWidth: 1.5))
        }
    }
}

/// The ring that pulses out of a live pin.
private struct Pulse: View {
    var body: some View {
        Circle()
            .stroke(Color.honey, lineWidth: 2)
            .frame(width: 18, height: 18)
            .phaseAnimator([false, true]) { ring, expanded in
                ring.scaleEffect(expanded ? 3.2 : 1).opacity(expanded ? 0 : 0.85)
            } animation: { expanded in
                expanded ? .easeOut(duration: 2.2) : nil
            }
    }
}
