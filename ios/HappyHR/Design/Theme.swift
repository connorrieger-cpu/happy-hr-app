import HappyHRCore
import SwiftUI
import UIKit

// Design tokens, matching the web app (web/src/styles/tokens.css) and
// shared/design/tokens.json. Honey yellow on warm ink, cream text.

extension Color {
    /// A colour that follows light and dark mode.
    init(light: Color, dark: Color) {
        self.init(UIColor { $0.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light) })
    }

    init(hex: UInt32) {
        self.init(
            .sRGB, red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255, blue: Double(hex & 0xFF) / 255, opacity: 1)
    }

    static let honey = Color(hex: 0xFFD60A)
    static let gold = Color(hex: 0xFFC300)
    static let amber = Color(hex: 0xF5A300)
    static let ember = Color(hex: 0xFF7A45)
    static let ink = Color(hex: 0x0E0B05)
    static let ink800 = Color(hex: 0x231A0C)
    static let cream = Color(hex: 0xFFF8E1)
    /// Text on honey: dark brown, readable in both themes.
    static let onHoney = Color(hex: 0x2B1D00)
    /// Honey that stays readable on the light theme's cream background (asset catalog).
    static let honeyAccent = Color("AccentColor")
    /// Text: warm brown on light, cream on dark (asset catalog). `.secondary` and
    /// `.tertiary` styles derive from it, since the app sets it as the foreground style.
    static let text = Color("Text")
    static let textSecondary = Color("TextSecondary")
    /// The web's glass fills, cards and hairlines (web/src/styles/tokens.css): mocha on dark, cream on light.
    static let sheetFill = Color("SheetFill")
    static let glassTint = Color("GlassTint")
    static let cardFill = Color("CardFill")
    static let hairline = Color("Hairline")
    /// "Open · till 2 AM": the web's open-state green, readable on mocha and cream.
    static let openGreen = Color(light: Color(hex: 0x1D8A4A), dark: Color(hex: 0x5FD68A))
}

extension ShapeStyle where Self == LinearGradient {
    /// The honey fill used for live pins, selected chips and the main button.
    static var honeyFill: LinearGradient {
        LinearGradient(colors: [Color(hex: 0xFFE45C), .honey, .gold], startPoint: .top, endPoint: .bottom)
    }
}

extension Font {
    /// The rounded display face for the wordmark and big titles (SF Pro Rounded,
    /// standing in for the web's Fredoka).
    static func display(_ size: CGFloat, weight: Font.Weight = .bold) -> Font {
        .system(size: size, weight: weight, design: .rounded)
    }
}

extension Vibe {
    var glyph: String {
        switch self {
        case .bar: "🍺"
        case .brewery: "🍻"
        case .wine: "🍷"
        case .cocktails: "🍸"
        case .restaurant: "🍽️"
        case .casual: "🥢"
        }
    }

    /// The venue page's hero gradient (the web's `.vibe--*` backgrounds, at 135°).
    var gradient: [Gradient.Stop] {
        switch self {
        case .bar: [.init(color: Color(hex: 0xFFB703), location: 0), .init(color: Color(hex: 0xC45A00), location: 0.7), .init(color: Color(hex: 0x5A2600), location: 1)]
        case .brewery: [.init(color: Color(hex: 0xFFE066), location: 0), .init(color: Color(hex: 0xF5A300), location: 0.55), .init(color: Color(hex: 0x8A5200), location: 1)]
        case .wine: [.init(color: Color(hex: 0xFFCF5C), location: 0), .init(color: Color(hex: 0xC2456E), location: 0.6), .init(color: Color(hex: 0x4B1238), location: 1)]
        case .cocktails: [.init(color: Color(hex: 0xFFE45C), location: 0), .init(color: Color(hex: 0xFF7A45), location: 0.5), .init(color: Color(hex: 0x8F1F5C), location: 1)]
        case .restaurant: [.init(color: Color(hex: 0xFFF1A8), location: 0), .init(color: Color(hex: 0xFFB000), location: 0.5), .init(color: Color(hex: 0xB85C00), location: 1)]
        case .casual: [.init(color: Color(hex: 0xF4FF8A), location: 0), .init(color: Color(hex: 0xFFC300), location: 0.5), .init(color: Color(hex: 0xD16D00), location: 1)]
        }
    }
}

extension DealProvenance {
    var title: String {
        switch self {
        case .venue: "From the venue"
        case .reported: "Reported online"
        case .community: "From the community"
        case .sample: "Sample deal"
        case .none: "No deals listed"
        }
    }
}

extension Booking.Provider {
    var label: String {
        switch self {
        case .opentable: "Book on OpenTable"
        case .resy: "Book on Resy"
        case .google: "Reserve on Google"
        }
    }
}
