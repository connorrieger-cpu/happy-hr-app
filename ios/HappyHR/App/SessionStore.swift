import Foundation
import HappyHRCore
import Security

/// The signed-in session (token and account), kept in the Keychain on this
/// device only. Like DeviceID, it survives app updates; signing out removes it.
enum SessionStore {
    private static let service = "app.happyhr.session"

    static func load() -> SignIn? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess, let data = item as? Data else { return nil }
        return try? JSONDecoder().decode(SignIn.self, from: data)
    }

    static func save(_ signIn: SignIn) {
        clear()
        guard let data = try? JSONEncoder().encode(signIn) else { return }
        let attributes: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
            kSecValueData as String: data,
        ]
        SecItemAdd(attributes as CFDictionary, nil)
    }

    static func clear() {
        SecItemDelete([kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service] as CFDictionary)
    }
}
