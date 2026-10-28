import HappyHRCore
import SwiftUI

/// Share a spot, or a plan to meet there ("Meet at Bar Koukla at 5:30 PM?").
/// The link opens the web app for friends without the app.
struct ShareView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    let rv: RankedVenue
    /// Nil shares just the spot.
    @State private var meet: Int?

    var body: some View {
        let options = meetOptions(rv, at: model.clock)
        let message = shareMessage(rv, at: model.clock, meet: meet)
        let link = venueLink(base: HappyHRClient.production, venueId: rv.venue.id, meet: meet, areaId: model.areaID)

        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                Text("Share \(rv.venue.name)").font(.display(24))
                Spacer()
                Button { dismiss() } label: {
                    Image(systemName: "xmark").font(.system(size: 15, weight: .semibold)).frame(width: 36, height: 36)
                }
                .buttonStyle(.plain)
                .glassCircle()
                .accessibilityLabel("Close")
            }

            if !options.isEmpty {
                Text("Suggest a time").font(.footnote.weight(.semibold)).foregroundStyle(.secondary)
                ScrollView(.horizontal) {
                    HStack(spacing: 8) {
                        chip("Just the spot", selected: meet == nil) { meet = nil }
                        ForEach(options, id: \.self) { m in
                            chip(formatTime(m, compact: true), selected: meet == m) { meet = m }
                        }
                    }
                    .padding(.vertical, 2)
                }
                .scrollIndicators(.hidden)
                .contentMargins(.horizontal, 20, for: .scrollContent)
                .padding(.horizontal, -20)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(message).font(.body)
                Text(link.absoluteString).font(.footnote).foregroundStyle(.secondary).lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .cardBackground(cornerRadius: 16)

            ShareLink(item: link, message: Text(message)) {
                Label(meet == nil ? "Share" : "Send the plan", systemImage: "square.and.arrow.up")
                    .font(.body.weight(.semibold))
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.glassProminent)
            .tint(.honey)
            .foregroundStyle(Color.onHoney)
            .controlSize(.large)
        }
        .padding(20)
        .frame(maxHeight: .infinity, alignment: .top)
    }

    private func chip(_ title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(title) { withAnimation(.snappy) { action() } }
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(selected ? Color.onHoney : Color.text)
            .modifier(ChipStyle(selected: selected))
    }
}
