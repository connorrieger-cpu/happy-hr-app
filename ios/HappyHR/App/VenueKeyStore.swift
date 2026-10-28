import Foundation
import Security

/// The venue keys this phone holds (venueId → key), so its staff can post as
/// the venue. Kept in the Keychain like DeviceID; never logged or shown in full.
enum VenueKeyStore {
    private static let service = "app.happyhr.venue-keys"
    private static let account = "venueKeys"

    private static var base: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: account]
    }

    static func load() -> [String: String] {
        var query = base
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess, let data = item as? Data else { return [:] }
        return (try? JSONDecoder().decode([String: String].self, from: data)) ?? [:]
    }

    static func save(_ keys: [String: String]) {
        SecItemDelete(base as CFDictionary)
        guard !keys.isEmpty, let data = try? JSONEncoder().encode(keys) else { return }
        var attributes = base
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        attributes[kSecValueData as String] = data
        SecItemAdd(attributes as CFDictionary, nil)
    }
}
