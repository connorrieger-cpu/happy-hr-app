import Charts
import HappyHRCore
import MapKit
import SwiftUI

/// The owner's sheet: how the app is used, from anonymous counts (no names, accounts or exact
/// locations). App opens and phones by day and by area, a heat map of where the app is opened,
/// and which buttons get tapped. A long press on the wordmark opens it, as does Usage in the
/// area menu once the owner password is on this phone.
struct UsageView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Group {
                if model.isOwner { UsageReportView() } else { OwnerUnlockForm() }
            }
            .navigationTitle(model.isOwner ? "Usage" : "App owner")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close", systemImage: "xmark") { dismiss() }
                }
            }
        }
    }
}

/// The owner password (the same as the web's owner page), checked with the server.
private struct OwnerUnlockForm: View {
    @Environment(AppModel.self) private var model
    @State private var password = ""
    @State private var working = false
    @State private var problem: String?
    @FocusState private var focused: Bool

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("📊").font(.system(size: 44))
                Text("See how Happy Hr is used").font(.display(26))
                Text("Only for Happy Hr’s owner, not restaurants. Enter the admin password, the same one as the web’s owner page. It stays on this phone.")
                    .foregroundStyle(.secondary)
                SecureField("Admin password", text: $password)
                    .textContentType(.password)
                    .submitLabel(.go)
                    .onSubmit(unlock)
                    .focused($focused)
                    .padding(16)
                    .cardBackground(cornerRadius: 16)
                if let problem {
                    Text(problem).font(.subheadline.weight(.semibold)).foregroundStyle(Color.ember)
                }
                Button(action: unlock) {
                    Group {
                        if working { ProgressView().tint(Color.onHoney) } else { Text("Unlock") }
                    }
                    .font(.body.weight(.semibold))
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.glassProminent)
                .tint(.honey)
                .foregroundStyle(Color.onHoney)
                .controlSize(.large)
                .disabled(working)
            }
            .padding(20)
        }
        .onAppear { focused = true }
    }

    private func unlock() {
        guard !working else { return }
        working = true
        problem = nil
        Task {
            do {
                try await model.unlockOwner(password)
            } catch {
                problem = error.localizedDescription
            }
            working = false
        }
    }
}

private struct UsageReportView: View {
    @Environment(AppModel.self) private var model
    @State private var days = 7
    @State private var summary: UsageSummary?
    @State private var problem: String?
    /// The area the heat map shows; the busiest one until another is picked.
    @State private var mapArea: String?
    @State private var allButtons = false

    private static let ranges = [(1, "Today"), (7, "7 days"), (30, "30 days"), (90, "90 days")]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Picker("Range", selection: $days) {
                    ForEach(Self.ranges, id: \.0) { Text($0.1).tag($0.0) }
                }
                .pickerStyle(.segmented)

                if let summary {
                    totals(summary)
                    byDay(summary)
                    heatMap(summary)
                    byArea(summary)
                    buttons(summary)
                    platforms(summary)
                } else if let problem {
                    Text(problem).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading).padding(16).cardBackground(cornerRadius: 16)
                } else {
                    ProgressView().frame(maxWidth: .infinity).padding(40)
                }

                Text("Counts are anonymous: no names, accounts or exact locations. Phones are counted with a scrambled id kept for 90 days.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Button("Lock Usage on this phone", role: .destructive) { model.lockOwner() }
                    .font(.footnote.weight(.semibold))
            }
            .padding(16)
        }
        .task(id: days) { await load() }
        .refreshable { await load() }
    }

    private func load() async {
        do {
            summary = try await model.usageSummary(days: days)
            problem = nil
        } catch {
            summary = nil
            problem = error.localizedDescription
        }
    }

    // MARK: Sections

    private func totals(_ s: UsageSummary) -> some View {
        HStack(spacing: 10) {
            stat("\(s.totals.opens)", "App opens")
            stat("\(s.totals.people)", s.totals.people == 1 ? "Phone" : "Phones")
            stat("\(s.totals.taps)", "Taps")
        }
    }

    private func stat(_ value: String, _ label: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value).font(.display(28)).monospacedDigit()
            Text(label).font(.footnote.weight(.semibold)).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .cardBackground(cornerRadius: 16)
    }

    @ViewBuilder
    private func byDay(_ s: UsageSummary) -> some View {
        if s.days > 1 {
            section("By day") {
                Chart(s.byDay, id: \.day) { day in
                    BarMark(x: .value("Day", Self.date(day.day), unit: .day), y: .value("Opens", day.opens))
                        .foregroundStyle(Color.honey)
                        .cornerRadius(3)
                }
                .frame(height: 170)
                .padding(14)
                .cardBackground(cornerRadius: 16)
                Text("App opens each day. The busiest day had \(s.byDay.map(\.people).max() ?? 0) \((s.byDay.map(\.people).max() ?? 0) == 1 ? "phone" : "phones").")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }

    @ViewBuilder
    private func heatMap(_ s: UsageSummary) -> some View {
        let busiest = Dictionary(grouping: s.cells, by: \.area).mapValues { $0.reduce(0) { $0 + $1.opens } }.sorted { $0.value > $1.value }.map(\.key)
        section("Where it’s opened") {
            if let shown = mapArea.flatMap({ busiest.contains($0) ? $0 : nil }) ?? busiest.first {
                if busiest.count > 1 {
                    Picker("Area", selection: Binding(get: { shown }, set: { mapArea = $0 })) {
                        ForEach(busiest, id: \.self) { Text(name(of: $0)).tag($0) }
                    }
                    .pickerStyle(.menu)
                    .tint(Color.honeyAccent)
                }
                UsageHeatMap(cells: s.cells.filter { $0.area == shown }, region: model.areas.first { $0.id == shown }?.region ?? [])
                    .id(shown)
                    .frame(height: 300)
                    .clipShape(.rect(cornerRadius: 16))
                Text("Each square is about 550 m across (5.5 km away from our areas); brighter means more opens.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                Text("No locations yet. The app only sends a rough square when location is on.")
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .cardBackground(cornerRadius: 16)
            }
        }
    }

    @ViewBuilder
    private func byArea(_ s: UsageSummary) -> some View {
        if !s.areas.isEmpty {
            let top = max(s.areas.map(\.opens).max() ?? 1, 1)
            section("By area") {
                VStack(spacing: 0) {
                    ForEach(s.areas, id: \.area) { row in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text(name(of: row.area)).font(.body.weight(.semibold))
                                Spacer()
                                Text("\(row.opens) \(row.opens == 1 ? "open" : "opens") · \(row.people) \(row.people == 1 ? "phone" : "phones")")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .monospacedDigit()
                            }
                            GeometryReader { g in
                                Capsule().fill(Color.honey).frame(width: max(6, g.size.width * CGFloat(row.opens) / CGFloat(top)))
                            }
                            .frame(height: 6)
                        }
                        .padding(.vertical, 10)
                        if row.area != s.areas.last?.area { Divider() }
                    }
                }
                .padding(.horizontal, 14)
                .cardBackground(cornerRadius: 16)
            }
        }
    }

    @ViewBuilder
    private func buttons(_ s: UsageSummary) -> some View {
        section("What people tap") {
            if s.events.isEmpty {
                Text("No taps counted yet.").foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading).padding(16).cardBackground(cornerRadius: 16)
            } else {
                let shown = allButtons ? s.events : Array(s.events.prefix(12))
                VStack(spacing: 0) {
                    ForEach(shown, id: \.name) { event in
                        HStack {
                            Text(event.label).lineLimit(1)
                            Spacer()
                            Text("\(event.count)").foregroundStyle(.secondary).monospacedDigit()
                        }
                        .padding(.vertical, 10)
                        if event.name != shown.last?.name { Divider() }
                    }
                }
                .padding(.horizontal, 14)
                .cardBackground(cornerRadius: 16)
                if s.events.count > 12 {
                    Button(allButtons ? "Show fewer" : "Show all \(s.events.count)") { withAnimation(.smooth) { allButtons.toggle() } }
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.honeyAccent)
                }
            }
        }
    }

    @ViewBuilder
    private func platforms(_ s: UsageSummary) -> some View {
        if s.platforms.count > 1 || s.platforms.first?.platform == "web" {
            section("iPhone and web") {
                HStack(spacing: 10) {
                    ForEach(s.platforms, id: \.platform) { p in
                        stat("\(p.opens)", p.platform == "ios" ? "iPhone opens" : "Web visits")
                    }
                }
            }
        }
    }

    private func section<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title).font(.title3.weight(.bold))
            content()
        }
    }

    private func name(of areaID: String) -> String {
        model.areas.first { $0.id == areaID }?.name ?? areaID
    }

    private static let dayFormat: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "America/Toronto")
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    private static func date(_ day: String) -> Date { dayFormat.date(from: day) ?? .now }
}

/// The squares the app was opened in, brighter for more opens, over the area's outline.
/// Framed on the squares and fixed in place, so it doesn't fight the page's scrolling.
private struct UsageHeatMap: View {
    let cells: [UsageSummary.Cell]
    let region: [LatLng]

    var body: some View {
        let top = Double(max(cells.map(\.opens).max() ?? 1, 1))
        Map(initialPosition: .region(framing), interactionModes: []) {
            if region.count > 2 {
                MapPolygon(coordinates: region.map { CLLocationCoordinate2D(latitude: $0.lat, longitude: $0.lng) })
                    .foregroundStyle(.clear)
                    .stroke(Color.textSecondary.opacity(0.6), style: StrokeStyle(lineWidth: 1.5, dash: [5, 4]))
            }
            ForEach(cells, id: \.self) { cell in
                MapPolygon(coordinates: Self.square(cell))
                    .foregroundStyle(Color.honey.opacity(0.18 + 0.62 * Double(cell.opens) / top))
                    .stroke(Color.amber.opacity(0.8), lineWidth: 1)
            }
        }
        .mapStyle(.standard(pointsOfInterest: .excludingAll))
    }

    /// Every square with some room around it, at least about 3 km across.
    private var framing: MKCoordinateRegion {
        let corners = cells.flatMap(Self.square)
        let lats = corners.map(\.latitude), lngs = corners.map(\.longitude)
        guard let south = lats.min(), let north = lats.max(), let west = lngs.min(), let east = lngs.max() else {
            return MKCoordinateRegion(center: CLLocationCoordinate2D(latitude: 43.65, longitude: -79.4), span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1))
        }
        return MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: (south + north) / 2, longitude: (west + east) / 2),
            span: MKCoordinateSpan(latitudeDelta: max((north - south) * 1.4, 0.03), longitudeDelta: max((east - west) * 1.4, 0.04))
        )
    }

    private static func square(_ cell: UsageSummary.Cell) -> [CLLocationCoordinate2D] {
        let size = cellSize(LatLng(lat: cell.lat, lng: cell.lng))
        let (dLat, dLng) = (size.lat / 2, size.lng / 2)
        return [(cell.lat - dLat, cell.lng - dLng), (cell.lat + dLat, cell.lng - dLng), (cell.lat + dLat, cell.lng + dLng), (cell.lat - dLat, cell.lng + dLng)]
            .map { CLLocationCoordinate2D(latitude: $0.0, longitude: $0.1) }
    }
}
