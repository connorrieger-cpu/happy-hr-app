import Foundation
import Security

/// An anonymous id for this install, kept in the Keychain so it survives app
/// updates. The API uses it for one-vote-per-day and rate limits; no accounts.
enum DeviceID {
    private static let service = "app.happyhr.device-id"

    static let current: String = load() ?? create()

    private static func load() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess, let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private static func create() -> String {
        let id = UUID().uuidString.lowercased()
        let attributes: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
            kSecValueData as String: Data(id.utf8),
        ]
        SecItemAdd(attributes as CFDictionary, nil)
        return id
    }
}
