import SwiftUI
import UIKit
import UserNotifications

@main
struct HappyHRApp: App {
    @UIApplicationDelegateAdaptor private var delegate: AppDelegate
    @State private var model = AppModel()
    @AppStorage("appearance") private var appearance = Appearance.system

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .tint(Color.honeyAccent)
                .foregroundStyle(Color.text)
                // Set on the windows rather than with preferredColorScheme, so menus and
                // sheets that are already open switch too, both ways.
                .onChange(of: appearance, initial: true) { _, appearance in appearance.apply() }
                .onAppear { delegate.model = model }
        }
    }
}

/// Reminder notifications: shown while the app is open too, and tapping one opens its venue.
final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    weak var model: AppModel?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter, willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound]
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        guard let venueID = response.notification.request.content.userInfo["venueID"] as? String else { return }
        await MainActor.run { model?.select(venueID) }
    }
}

/// System, Light or Dark, chosen in the area menu (like the web app's Appearance switch).
enum Appearance: String, CaseIterable, Identifiable {
    case system, light, dark

    var id: String { rawValue }
    var label: String { rawValue.capitalized }
    var symbol: String {
        switch self {
        case .system: "circle.lefthalf.filled"
        case .light: "sun.max"
        case .dark: "moon"
        }
    }

    private var style: UIUserInterfaceStyle {
        switch self {
        case .system: .unspecified
        case .light: .light
        case .dark: .dark
        }
    }

    /// Applies to every window of the app, and so to everything presented in them.
    func apply() {
        for case let scene as UIWindowScene in UIApplication.shared.connectedScenes {
            for window in scene.windows { window.overrideUserInterfaceStyle = style }
        }
    }
}
