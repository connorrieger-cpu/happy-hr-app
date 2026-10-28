import SwiftUI

// Liquid Glass (iOS 26), in one place so the look can be tuned app-wide.
//
// Apple's guidance, which the app follows: glass is for the layer that floats
// over content (the top bar, map buttons, map pins, the bottom sheet), not for
// the content itself. Cards inside the sheet use quiet fills instead, so glass
// never sits on glass. Plain glass is tinted with the web's mocha (dark) or
// cream (light), so the app keeps the web app's warm colour.

extension View {
    /// A floating glass capsule, tinted honey for things that are "on".
    func glassCapsule(tint: Color? = nil, interactive: Bool = false) -> some View {
        glassEffect(.regular.tint(tint ?? .glassTint).interactive(interactive), in: .capsule)
    }

    /// A floating glass circle, for icon buttons over the map.
    func glassCircle(tint: Color? = nil, interactive: Bool = true) -> some View {
        glassEffect(.regular.tint(tint ?? .glassTint).interactive(interactive), in: .circle)
    }

    /// A floating glass panel with rounded corners.
    func glassPanel(cornerRadius: CGFloat = 22, tint: Color? = nil) -> some View {
        glassEffect(.regular.tint(tint ?? .glassTint), in: .rect(cornerRadius: cornerRadius))
    }

    /// The quiet fill for cards inside the sheet (content, not chrome: no glass), with the web's hairline.
    func cardBackground(cornerRadius: CGFloat = 20, highlighted: Bool = false) -> some View {
        background {
            RoundedRectangle(cornerRadius: cornerRadius)
                .fill(Color.cardFill)
                .overlay {
                    if highlighted {
                        RoundedRectangle(cornerRadius: cornerRadius)
                            .fill(LinearGradient(colors: [Color.honey.opacity(0.12), .clear], startPoint: .leading, endPoint: UnitPoint(x: 0.55, y: 0.5)))
                    }
                }
                .overlay(RoundedRectangle(cornerRadius: cornerRadius).strokeBorder(Color.hairline))
        }
    }

    /// Sheets get the web's strong glass: a blur under mocha (dark) or cream (light).
    func sheetBackground() -> some View {
        presentationBackground { SheetFill() }
    }
}

/// The web's `glass--strong`: a blur under mocha (dark) or cream (light).
struct SheetFill: View {
    var body: some View {
        Rectangle().fill(.ultraThinMaterial).overlay(Color.sheetFill)
    }
}
