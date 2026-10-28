import Foundation

// Areas: which one someone is in, and which spots belong to one. A port of src/lib/areas.ts.

public enum Areas {
    /// How far past a neighbourhood's outline a spot still belongs to it (both sides of its boundary streets).
    public static let edgeMeters = 45.0
    /// Someone outside every area gets the nearest one within this distance; further away, none.
    public static let nearMeters = 3000.0
}

private let earthRadius = 6_371_000.0
private func rad(_ d: Double) -> Double { d * .pi / 180 }

/// Metres east and north of `origin`: flat enough for a city.
private func local(_ p: LatLng, _ origin: LatLng) -> (Double, Double) {
    (rad(p.lng - origin.lng) * cos(rad(origin.lat)) * earthRadius, rad(p.lat - origin.lat) * earthRadius)
}

/// Is the point inside the outline?
public func inRegion(_ p: LatLng, _ region: [LatLng]) -> Bool {
    var inside = false
    var j = region.count - 1
    for i in region.indices {
        let a = region[i], b = region[j]
        if (a.lat > p.lat) != (b.lat > p.lat), p.lng < (b.lng - a.lng) * (p.lat - a.lat) / (b.lat - a.lat) + a.lng { inside.toggle() }
        j = i
    }
    return inside
}

/// Metres from the point to the outline; 0 inside it.
public func metersToRegion(_ p: LatLng, _ region: [LatLng]) -> Double {
    if region.isEmpty { return .infinity }
    if inRegion(p, region) { return 0 }
    var best = Double.infinity
    var j = region.count - 1
    for i in region.indices {
        let (ax, ay) = local(region[j], p)
        let (bx, by) = local(region[i], p)
        let dx = bx - ax, dy = by - ay
        let length = dx * dx + dy * dy
        let t = max(0, min(1, -(ax * dx + ay * dy) / (length == 0 ? 1 : length)))
        best = min(best, hypot(ax + t * dx, ay + t * dy))
        j = i
    }
    return best
}

/// The outline's size, to prefer a neighbourhood over a city around it.
private func regionSize(_ region: [LatLng]) -> Double {
    var sum = 0.0
    var j = region.count - 1
    for i in region.indices {
        sum += region[j].lng * region[i].lat - region[i].lng * region[j].lat
        j = i
    }
    return abs(sum) / 2
}

/// Does a spot at `p` belong to the area? Neighbourhoods keep both sides of their boundary streets.
public func inArea(_ p: LatLng, _ area: Area) -> Bool {
    metersToRegion(p, area.region) <= (area.addressCity == nil ? Areas.edgeMeters : 0)
}

/// The area someone at `p` is in: the one whose outline contains them (the smallest, if
/// outlines overlap), else the nearest within `Areas.nearMeters`, else none.
public func areaAt(_ p: LatLng, _ areas: [Area]) -> Area? {
    let containing = areas.filter { inRegion(p, $0.region) }.sorted { regionSize($0.region) < regionSize($1.region) }
    if let first = containing.first { return first }
    var nearest: Area?
    var best = Areas.nearMeters
    for a in areas {
        let d = metersToRegion(p, a.region)
        if d <= best {
            best = d
            nearest = a
        }
    }
    return nearest
}
