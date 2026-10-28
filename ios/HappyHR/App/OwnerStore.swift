import Foundation
import Security

/// The owner password on this phone (the same `OWNER_TOKEN` as the web's `?owner` page), so
/// the owner can open the Usage screen. Kept in the Keychain like the venue keys; never shown.
enum OwnerStore {
    private static let service = "app.happyhr.owner"
    private static let account = "ownerToken"

    private static var base: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: account]
    }

    static func load() -> String? {
        var query = base
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess, let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func save(_ token: String?) {
        SecItemDelete(base as CFDictionary)
        guard let token else { return }
        var attributes = base
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        attributes[kSecValueData as String] = Data(token.utf8)
        SecItemAdd(attributes as CFDictionary, nil)
    }
}
