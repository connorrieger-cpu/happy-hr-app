import CoreLocation
import HappyHRCore
import Observation

/// Where the person is, for walking times and the "you are here" dot. Uses the
/// iOS 18+ async location API; asks for When In Use permission on first start.
@Observable
final class LocationService {
    private(set) var coordinate: LatLng?
    private(set) var denied = false

    /// Walking times don't need finer than this.
    private static let minimumMove = 20.0

    private var session: CLServiceSession?
    private var updates: Task<Void, Never>?

    func start() {
        guard updates == nil else { return }
        session = CLServiceSession(authorization: .whenInUse)
        updates = Task {
            do {
                for try await update in CLLocationUpdate.liveUpdates() {
                    // Only real changes: every assignment redraws the map and the list, and GPS
                    // reports about once a second even standing still.
                    let isDenied = update.authorizationDenied || update.authorizationDeniedGlobally
                    if isDenied != denied { denied = isDenied }
                    if let location = update.location {
                        let here = LatLng(lat: location.coordinate.latitude, lng: location.coordinate.longitude)
                        if coordinate.map({ distanceMeters($0, here) >= Self.minimumMove }) ?? true { coordinate = here }
                    }
                }
            } catch {
                // Updates ended; the app falls back to the area's corner for walking times.
            }
        }
    }

    func stop() {
        updates?.cancel()
        updates = nil
        session = nil
    }
}
