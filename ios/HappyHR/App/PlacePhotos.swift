import Foundation
import UIKit

/// A venue's photo from Google Places, for the venue page hero, like the web's
/// `usePlacePhoto`. Google asks that the photographer's name is shown with it.
nonisolated struct PlacePhoto: Sendable {
    let image: UIImage
    let author: String?
    let authorURL: URL?
}

/// Loads venue photos with Places API (New) from each venue's `placeId`, once per
/// launch. Needs an iOS-restricted key in `ios/Secrets.xcconfig` (see ios/README.md);
/// without one the hero keeps its gradient.
enum PlacePhotos {
    private static let key = (Bundle.main.object(forInfoDictionaryKey: "GooglePlacesKey") as? String)
        .flatMap { $0.isEmpty || $0.hasPrefix("$(") ? nil : $0 }
    private static var loads: [String: Task<PlacePhoto?, Never>] = [:]

    static var enabled: Bool { key != nil }

    static func photo(for placeId: String) async -> PlacePhoto? {
        guard let key else { return nil }
        if let load = loads[placeId] { return await load.value }
        let load = Task { await fetch(placeId, key: key) }
        loads[placeId] = load
        let photo = await load.value
        // Try again next time after a failure (offline, say).
        if photo == nil { loads[placeId] = nil }
        return photo
    }

    nonisolated private struct Details: Decodable {
        struct Photo: Decodable {
            let name: String
            let authorAttributions: [Author]?
        }
        struct Author: Decodable {
            let displayName: String?
            let uri: String?
        }
        let photos: [Photo]?
    }

    nonisolated private struct Media: Decodable {
        let photoUri: String
    }

    @concurrent
    private static func fetch(_ placeId: String, key: String) async -> PlacePhoto? {
        do {
            let details: Details = try await get("places/\(placeId)", key: key, fields: "photos")
            guard let first = details.photos?.first else { return nil }
            // The photo's address rather than a redirect to it, so the image itself needs no key.
            let media: Media = try await get("\(first.name)/media?maxWidthPx=1200&maxHeightPx=800&skipHttpRedirect=true", key: key)
            guard let url = URL(string: media.photoUri) else { return nil }
            let (data, _) = try await URLSession.shared.data(from: url)
            guard let image = UIImage(data: data)?.preparingForDisplay() else { return nil }
            let author = first.authorAttributions?.first
            return PlacePhoto(image: image, author: author?.displayName, authorURL: author?.uri.flatMap(URL.init(string:)))
        } catch {
            return nil
        }
    }

    @concurrent
    private static func get<T: Decodable>(_ path: String, key: String, fields: String? = nil) async throws -> T {
        guard let url = URL(string: "https://places.googleapis.com/v1/\(path)") else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.setValue(key, forHTTPHeaderField: "X-Goog-Api-Key")
        // An iOS-restricted key only works with the app's bundle id alongside it.
        request.setValue(Bundle.main.bundleIdentifier, forHTTPHeaderField: "X-Ios-Bundle-Identifier")
        if let fields { request.setValue(fields, forHTTPHeaderField: "X-Goog-FieldMask") }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw URLError(.badServerResponse) }
        return try JSONDecoder().decode(T.self, from: data)
    }
}
