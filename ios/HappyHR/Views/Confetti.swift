import SwiftUI
import UIKit

/// The easter egg: tap the logo ten times and drinks rain down the screen.
/// Shown in its own pass-through window, so it falls over the sheet too.
@MainActor
enum Confetti {
    private static var window: UIWindow?

    static func rain() {
        guard window == nil,
            let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first(where: { $0.activationState == .foregroundActive })
        else { return }
        let host = UIHostingController(rootView: ConfettiView { Confetti.stop() })
        host.view.backgroundColor = .clear
        let window = UIWindow(windowScene: scene)
        window.windowLevel = .alert + 1
        window.isUserInteractionEnabled = false
        window.rootViewController = host
        window.isHidden = false
        self.window = window
    }

    private static func stop() {
        window?.isHidden = true
        window = nil
    }
}

private struct ConfettiView: View {
    var onDone: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var start = Date()

    private static let drinks = ["🍺", "🍻", "🍷", "🍸", "🍹", "🥂", "🍾", "🥃"]
    private static let duration = 4.0

    /// Each drink's lane, size, start, speed, sway and spin, fixed when the rain starts.
    private struct Drop {
        var glyph: String
        var x: Double
        var size: Double
        var delay: Double
        var fall: Double
        var sway: Double
        var spin: Double
    }

    private let drops: [Drop] = (0..<70).map { _ in
        Drop(
            glyph: drinks.randomElement()!,
            x: .random(in: 0...1),
            size: .random(in: 24...40),
            delay: .random(in: 0...1.4),
            fall: .random(in: 1.8...2.6),
            sway: .random(in: -30...30),
            spin: .random(in: -260...260)
        )
    }

    var body: some View {
        TimelineView(.animation) { timeline in
            let t = timeline.date.timeIntervalSince(start)
            Canvas { context, size in
                for drop in reduceMotion ? Array(drops.prefix(16)) : drops {
                    let progress = (t - drop.delay) / drop.fall
                    guard progress > 0, progress < 1 else { continue }
                    var glyph = context
                    if reduceMotion {
                        // No falling or spinning: the drinks just appear and fade where they land.
                        let y = 0.2 + (drop.x * 7).truncatingRemainder(dividingBy: 0.6)
                        glyph.opacity = sin(progress * .pi)
                        glyph.draw(Text(drop.glyph).font(.system(size: drop.size)), at: CGPoint(x: drop.x * size.width, y: y * size.height))
                    } else {
                        let y = -50 + progress * (size.height + 100)
                        let x = drop.x * size.width + sin(progress * .pi * 2) * drop.sway
                        glyph.translateBy(x: x, y: y)
                        glyph.rotate(by: .degrees(drop.spin * progress))
                        glyph.draw(Text(drop.glyph).font(.system(size: drop.size)), at: .zero)
                    }
                }
            }
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .task {
            try? await Task.sleep(for: .seconds(Self.duration))
            onDone()
        }
    }
}
