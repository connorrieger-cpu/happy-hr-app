import Foundation
import HappyHRCore

/// What the app shares with its widget through their app group: each area's venue cache (the
/// server's bytes, see `VenueCache`), the area on screen, the community's deals, the favourites
/// and where walks start from.
/// The widget only reads; the app writes whenever any of it changes.
nonisolated enum SharedStore {
    static let appGroup = "group.com.happyhr.app"

    /// The app group's folder, or the app's own Caches folder if the group isn't available.
    static var directory: URL {
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup)
            ?? FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    }

    private static var defaults: UserDefaults { UserDefaults(suiteName: appGroup) ?? .standard }
    private static var communityURL: URL { directory.appendingPathComponent("community.json") }

    /// Ossington: what the app showed before areas, and the one area bundled for offline use.
    static let defaultAreaID = "ossington"

    static func venueCache(_ areaID: String) -> VenueCache { VenueCache(directory: directory, areaId: areaID) }

    /// The area the app is showing, so the widget shows the same one.
    static var areaID: String {
        get { defaults.string(forKey: "areaID") ?? defaultAreaID }
        set { defaults.set(newValue, forKey: "areaID") }
    }

    /// An area's last venue list: the cache, or for Ossington the copy bundled with the app.
    static func storedPayload(_ areaID: String) -> VenuesPayload? {
        if let cached = venueCache(areaID).load()?.payload { return cached }
        guard areaID == defaultAreaID, let url = Bundle.main.url(forResource: "venues", withExtension: "json"),
              let data = try? Data(contentsOf: url)
        else { return nil }
        return try? JSONDecoder().decode(VenuesPayload.self, from: data)
    }

    /// An area's spots with the community's additions that belong to it.
    static func venues(_ payload: VenuesPayload, community: [CommunitySubmission]) -> [Venue] {
        let area = payload.area
        let mine = submissionsForArea(community, area: area, venues: payload.venues, legacy: area.id == defaultAreaID)
        return mergeCommunity(payload.venues, mine, fallback: area.origin.location, city: area.lookupCity)
    }

    static var community: CommunityData {
        get { (try? Data(contentsOf: communityURL)).flatMap { try? JSONDecoder().decode(CommunityData.self, from: $0) } ?? CommunityData() }
        set { try? JSONEncoder().encode(newValue).write(to: communityURL, options: .atomic) }
    }

    static var favourites: Set<String> {
        get { Set(defaults.stringArray(forKey: "favourites") ?? []) }
        set { defaults.set(newValue.sorted(), forKey: "favourites") }
    }

    /// Where walking times start: the person when they're near the area, else its corner.
    static var origin: LatLng? {
        get {
            guard let pair = defaults.array(forKey: "origin") as? [Double], pair.count == 2 else { return nil }
            return LatLng(lat: pair[0], lng: pair[1])
        }
        set { defaults.set(newValue.map { [$0.lat, $0.lng] }, forKey: "origin") }
    }
}
