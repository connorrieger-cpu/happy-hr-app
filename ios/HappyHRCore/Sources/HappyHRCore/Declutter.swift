import Foundation

// Map pins and their labels. A port of src/lib/declutter.ts, the projection in
// src/lib/mapMath.ts, and the pin rules in src/map/usePinLabels.ts.
//
// Venues on Ossington sit a few metres apart, so pin labels collide constantly.
// Labels are placed greedily in priority order, beside their pin on the
// preferred side (away from the street), then the other side, and otherwise
// dropped so that only the pin's dot shows.

public enum LabelSide: String, Hashable, Sendable {
    case left, right
}

public struct ScreenPoint: Hashable, Sendable {
    public var x: Double
    public var y: Double

    public init(x: Double, y: Double) {
        self.x = x
        self.y = y
    }
}

// MARK: - Projection

/// Web Mercator. worldSize is the width of the whole world in screen points at the current zoom.
public func project(_ p: LatLng, worldSize: Double) -> ScreenPoint {
    let sinLat = sin(p.lat * .pi / 180)
    return ScreenPoint(
        x: (p.lng + 180) / 360 * worldSize,
        y: (0.5 - log((1 + sinLat) / (1 - sinLat)) / (4 * .pi)) * worldSize
    )
}

public func unproject(_ p: ScreenPoint, worldSize: Double) -> LatLng {
    let n = Double.pi - 2 * .pi * p.y / worldSize
    return LatLng(lat: atan(sinh(n)) * 180 / .pi, lng: p.x / worldSize * 360 - 180)
}

/// Rotates world points into screen orientation for a map rotated to `bearing` degrees.
public func toScreen(_ p: LatLng, worldSize: Double, bearing: Double) -> ScreenPoint {
    let w = project(p, worldSize: worldSize)
    let t = -bearing * .pi / 180
    return ScreenPoint(x: w.x * cos(t) - w.y * sin(t), y: w.x * sin(t) + w.y * cos(t))
}

/// The map centre that puts `p` at a point shifted (dx, dy) screen points from the
/// viewport centre. Used to keep a pin clear of the top bar and the sheet.
public func centerFor(_ p: LatLng, dx: Double, dy: Double, worldSize: Double, bearing: Double) -> LatLng {
    let t = bearing * .pi / 180
    let wx = dx * cos(t) - dy * sin(t)
    let wy = dx * sin(t) + dy * cos(t)
    let w = project(p, worldSize: worldSize)
    return unproject(ScreenPoint(x: w.x - wx, y: w.y - wy), worldSize: worldSize)
}

// MARK: - Label placement

public struct LabelRequest: Hashable, Sendable {
    public var id: String
    public var point: LatLng
    public var text: String
    public var preferred: LabelSide

    public init(id: String, point: LatLng, text: String, preferred: LabelSide) {
        self.id = id
        self.point = point
        self.text = text
        self.preferred = preferred
    }
}

private struct Rect {
    var x1, y1, x2, y2: Double

    func overlaps(_ b: Rect) -> Bool { x1 < b.x2 && x2 > b.x1 && y1 < b.y2 && y2 > b.y1 }
}

private let labelHeight = 28.0
private let dotGap = 11.0
private let charWidth = 7.1
private let labelPadding = 22.0
private let dotRadius = 8.0

public func labelWidth(_ text: String) -> Double {
    // UTF-16 length, like JavaScript's string length.
    Double(text.utf16.count) * charWidth + labelPadding
}

private func labelRect(at p: ScreenPoint, text: String, side: LabelSide) -> Rect {
    let w = labelWidth(text)
    return side == .right
        ? Rect(x1: p.x + dotGap, y1: p.y - labelHeight / 2, x2: p.x + dotGap + w, y2: p.y + labelHeight / 2)
        : Rect(x1: p.x - dotGap - w, y1: p.y - labelHeight / 2, x2: p.x - dotGap, y2: p.y + labelHeight / 2)
}

private func dotRect(at p: ScreenPoint) -> Rect {
    Rect(x1: p.x - dotRadius, y1: p.y - dotRadius, x2: p.x + dotRadius, y2: p.y + dotRadius)
}

public func placeLabels(_ requests: [LabelRequest], dots: [LatLng], worldSize: Double, bearing: Double = 0) -> [String: LabelSide] {
    var taken = dots.map { dotRect(at: toScreen($0, worldSize: worldSize, bearing: bearing)) }
    var placed: [String: LabelSide] = [:]

    for req in requests {
        let p = toScreen(req.point, worldSize: worldSize, bearing: bearing)
        let other: LabelSide = req.preferred == .left ? .right : .left
        for side in [req.preferred, other] {
            let rect = labelRect(at: p, text: req.text, side: side)
            // Ignore the label's own dot, which sits just outside the rect anyway.
            if !taken.contains(where: { $0.overlaps(rect) }) {
                taken.append(rect)
                placed[req.id] = side
                break
            }
        }
    }
    return placed
}

/// Which side of a street (given as two points along it) a point lies on.
public func sideOfLine(_ p: LatLng, _ line: [LatLng]) -> LabelSide {
    let a = line[0]
    let b = line[1]
    let cross = (b.lng - a.lng) * (p.lat - a.lat) - (b.lat - a.lat) * (p.lng - a.lng)
    return cross > 0 ? .left : .right
}

// MARK: - Pins

public struct PinModel: Hashable, Identifiable, Sendable {
    public var ranked: RankedVenue
    public var label: String?
    public var side: LabelSide?
    public var zIndex: Int
    /// No happy hour (outside the Daily specials view): drawn as a faint dot.
    public var quiet: Bool
    /// A quiet spot with a daily special today: a faint honey ring.
    public var special: Bool
    /// In the Daily specials view.
    public var daily: Bool

    public var id: String { ranked.venue.id }

    // SwiftUI compares the pin list on every redraw; comparing each venue's whole
    // record (menus, sources, hours…) made that slow enough to freeze an iPhone.
    // Two pins are the same when they'd be drawn the same.
    public static func == (a: PinModel, b: PinModel) -> Bool {
        a.id == b.id && a.label == b.label && a.side == b.side && a.zIndex == b.zIndex && a.quiet == b.quiet && a.special == b.special
            && a.daily == b.daily && a.ranked.status.kind == b.ranked.status.kind
    }

    public func hash(into hasher: inout Hasher) {
        hasher.combine(id)
        hasher.combine(label)
        hasher.combine(zIndex)
    }
}

private func rank(_ kind: VenueStatus.Kind) -> Int {
    switch kind {
    case .live: 3
    case .soon: 2
    case .later: 1
    case .none: 0
    }
}

/// Decides which pins get a label and on which side, for the current zoom.
/// `bearing` is the map's current rotation; labels are placed in screen space.
/// `now` is the time shown in the app, for daily specials; `daily` is the Daily
/// specials view, where pins are labelled with today's special.
public func pinModels(
    area: Area, items: [RankedVenue], selectedID: String?, worldSize: Double, bearing: Double, now: Clock?, daily: Bool = false
) -> [PinModel] {
    // Labels only need re-placing when the zoom moves noticeably.
    let bucket = (log2(worldSize) * 20).rounded()
    let todays = { (rv: RankedVenue) in now.flatMap { dailyToday(rv.venue, at: $0) } }
    let textFor = { (rv: RankedVenue) -> String? in
        if daily { return todays(rv).map { shortLabel(dailyLabel($0)) } }
        switch rv.status {
        case .live: return pinLabel(focusWindow(rv.status))
        case let .soon(_, _, startsAt): return formatTime(startsAt, compact: true)
        default: return nil
        }
    }

    let prioritized = items.stableSorted { a, b in
        if a.venue.id == selectedID { return b.venue.id != selectedID }
        if b.venue.id == selectedID { return false }
        let ra = rank(a.status.kind)
        let rb = rank(b.status.kind)
        return ra != rb ? ra > rb : a.distanceM < b.distanceM
    }

    let requests = prioritized.compactMap { rv in
        textFor(rv).map { LabelRequest(id: rv.venue.id, point: rv.venue.location, text: $0, preferred: sideOfLine(rv.venue.location, area.spine)) }
    }
    // Quiet dots (no happy hour) are faint enough for labels to sit over them.
    let dots = items.filter { daily || !$0.venue.happyHours.isEmpty }.map(\.venue.location)
    let sides = placeLabels(requests, dots: dots, worldSize: pow(2, bucket / 20), bearing: bearing)

    return items.map { rv in
        let side = sides[rv.venue.id]
        let selected = rv.venue.id == selectedID
        let quiet = !daily && rv.venue.happyHours.isEmpty
        return PinModel(
            ranked: rv,
            label: side != nil ? textFor(rv) : nil,
            side: side,
            zIndex: selected ? 100 : (daily ? 2 : rank(rv.status.kind)) * 10 + (side != nil ? 5 : 0),
            quiet: quiet,
            special: quiet && todays(rv) != nil,
            daily: daily
        )
    }
}

/// The quiet pins that sit under another pin's label. Not in the web app: there
/// labels are drawn above quiet dots, but MapKit can't layer annotations, so
/// the app hides these dots instead of letting them show through the label.
public func quietPinsUnderLabels(_ pins: [PinModel], worldSize: Double, bearing: Double) -> Set<String> {
    let bucket = (log2(worldSize) * 20).rounded()
    let size = pow(2, bucket / 20)
    let labels = pins.compactMap { pin -> Rect? in
        guard let label = pin.label, let side = pin.side else { return nil }
        return labelRect(at: toScreen(pin.ranked.venue.location, worldSize: size, bearing: bearing), text: label, side: side)
    }
    return Set(
        pins.filter { pin in
            pin.quiet && pin.label == nil
                && labels.contains { $0.overlaps(dotRect(at: toScreen(pin.ranked.venue.location, worldSize: size, bearing: bearing))) }
        }.map(\.id)
    )
}
