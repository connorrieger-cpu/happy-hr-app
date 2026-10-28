import SwiftUI

/// The opening animation: a warm glow, the smiley springs in, "Happy HR" rises,
/// then it fades to the map. About two seconds; tap to skip; a plain fade when
/// Reduce Motion is on. (The web app's version also clinks the two glasses;
/// a natural next step here is animating LogoMark's layers separately.)
struct SplashView: View {
    var onDone: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var stage = 0

    var body: some View {
        ZStack {
            Color("AppBackground").ignoresSafeArea()
            RadialGradient(colors: [Color.honey.opacity(stage >= 1 ? 0.45 : 0), .clear], center: .center, startRadius: 0, endRadius: 320)
                .ignoresSafeArea()
            VStack(spacing: 18) {
                Image("LogoMark")
                    .resizable()
                    .frame(width: 150, height: 150)
                    .scaleEffect(stage >= 1 ? 1 : 0.4)
                    .rotationEffect(.degrees(stage >= 1 ? 0 : -18))
                    .opacity(stage >= 1 ? 1 : 0)
                    .shadow(color: .honey.opacity(0.5), radius: 30)
                Text("Happy \(Text("Hr").foregroundStyle(Color.honeyAccent))")
                    .font(.display(44))
                    .offset(y: stage >= 2 ? 0 : 24)
                    .opacity(stage >= 2 ? 1 : 0)
            }
        }
        .contentShape(.rect)
        .onTapGesture(perform: onDone)
        .task {
            if reduceMotion {
                stage = 2
                try? await Task.sleep(for: .seconds(0.9))
                onDone()
                return
            }
            withAnimation(.spring(duration: 0.7, bounce: 0.45)) { stage = 1 }
            try? await Task.sleep(for: .seconds(0.55))
            withAnimation(.spring(duration: 0.6, bounce: 0.3)) { stage = 2 }
            try? await Task.sleep(for: .seconds(1.1))
            onDone()
        }
        .accessibilityLabel("Happy Hr")
    }
}
