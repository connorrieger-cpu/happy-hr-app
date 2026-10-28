import HappyHRCore
import SwiftUI

/// Search every spot: type a name, a drink, a food or a kind of place (typos and accents
/// forgiven), or browse the Drinks, Food and Places tiles; picks become tokens in the
/// search bar. Results sort nearest first, or cheapest first once there's a drink or food
/// to compare. Opened from the top bar's magnifier, so it stays secondary to what's on now.
struct SearchView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    /// The tiles, shown again over results ("＋ Filter").
    @State private var adding = false

    var body: some View {
        @Bindable var model = model
        let query = model.searchQuery
        let catalog = model.foodTypes
        let browsing = query.text.trimmingCharacters(in: .whitespaces).isEmpty && query.tokens.isEmpty
        let priced = canSortByPrice(query, catalog: catalog)
        var sorted = query
        if !priced { sorted.sort = .nearest }
        let results = searchVenues(model.everything, sorted, at: model.clock, catalog: catalog)

        return NavigationStack {
            List {
                Section {
                    chipRow {
                        ForEach(SearchWhen.allCases, id: \.self) { when in
                            chip(when.label, selected: query.when == when) { model.searchQuery.when = when }
                        }
                        if !browsing {
                            Rectangle().fill(Color.hairline).frame(width: 1, height: 22)
                            Button { withAnimation(.snappy) { adding.toggle() } } label: {
                                Label("Filter", systemImage: adding ? "chevron.up" : "plus")
                            }
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Color.text)
                            .buttonStyle(.glass)
                        }
                    }
                }
                .listRowInsets(EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0))
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
                // Chips scroll edge to edge instead of being cut at the list's margins.
                .listSectionMargins(.horizontal, 0)

                if browsing || adding {
                    let options = browseOptions(model.everything, at: model.clock, catalog: catalog)
                    TileSection(title: "Drinks", options: options.drinks, picked: query.tokens, pick: pick)
                    TileSection(title: "Food", options: options.food, picked: query.tokens, pick: pick)
                    TileSection(title: "Places", options: options.places, picked: query.tokens, pick: pick)
                }

                Section {
                    ForEach(results) { result in
                        Button { open(result.id) } label: {
                            if let deal = result.deal {
                                PriceRow(ranked: result.ranked, deal: deal)
                            } else {
                                ResultRow(
                                    result: result, favourite: model.isFavourite(result.id),
                                    open: openLabel(openState(result.ranked.venue, at: model.clock), today: model.clock.day),
                                    mightBeOpen: mightBeOpen(result.ranked.venue, at: model.clock))
                            }
                        }
                        .buttonStyle(.plain)
                        .listRowBackground(Color.cardFill)
                    }
                    if results.isEmpty {
                        Text("Nothing matches. Try another word, or take a filter off.")
                            .foregroundStyle(.secondary)
                            .listRowBackground(Color.clear)
                    }
                } header: {
                    HStack(spacing: 10) {
                        Text(results.count == 1 ? "1 spot" : "\(results.count) spots")
                        Spacer()
                        if priced {
                            Picker("Sort", selection: $model.searchQuery.sort) {
                                Text("Nearest").tag(SearchSort.nearest)
                                Text("Cheapest").tag(SearchSort.cheapest)
                            }
                            .pickerStyle(.segmented)
                            .fixedSize()
                        }
                        if !query.isEmpty {
                            Button("Clear") { withAnimation(.snappy) { model.searchQuery = SearchQuery() } }.textCase(nil)
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            // The sheet's mocha (or cream) glass shows through, like the web's search panel.
            .scrollContentBackground(.hidden)
            .contentMargins(.top, 4, for: .scrollContent)
            .listSectionSpacing(.compact)
            .searchable(
                text: $model.searchQuery.text, tokens: tokens, placement: .navigationBarDrawer(displayMode: .always),
                prompt: query.tokens.isEmpty ? "Beer, tacos, patio, a name…" : "Add a word…"
            ) { token in
                let info = tokenLabel(token, catalog: catalog)
                Text("\(info.emoji) \(info.label)")
            }
            .navigationTitle("Search")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close", systemImage: "xmark") { dismiss() }
                }
            }
        }
    }

    /// The search bar's tokens are the picks; deleting one there takes it off.
    private var tokens: Binding<[SearchToken]> {
        Binding(
            get: { model.searchQuery.tokens },
            set: { tokens in
                var q = model.searchQuery
                q.drinks = tokens.compactMap { if case let .drink(d) = $0 { d } else { nil } }
                q.food = tokens.compactMap { if case let .food(f) = $0 { f } else { nil } }
                q.places = tokens.compactMap { if case let .place(p) = $0 { p } else { nil } }
                model.searchQuery = q
            })
    }

    private func pick(_ token: SearchToken) {
        withAnimation(.snappy) {
            model.searchQuery = model.searchQuery.toggling(token)
            adding = false
        }
    }

    private func open(_ id: String) {
        dismiss()
        // Show it on the map even when the current filter hides it.
        if !model.mapItems.contains(where: { $0.venue.id == id }) { model.filter = .all }
        model.select(id)
    }

    private func chipRow<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) { content() }.padding(.vertical, 2)
        }
        .scrollIndicators(.hidden)
        .contentMargins(.horizontal, 20, for: .scrollContent)
    }

    private func chip(_ title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(title) { withAnimation(.snappy) { action() } }
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(selected ? Color.onHoney : Color.text)
            .modifier(ChipStyle(selected: selected))
    }
}

/// One group of browse tiles (drinks, food or places); long groups show "More".
private struct TileSection: View {
    let title: String
    let options: [BrowseOption]
    let picked: [SearchToken]
    let pick: (SearchToken) -> Void
    @State private var all = false

    private static let first = 5
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 8), count: 3)

    var body: some View {
        if !options.isEmpty {
            let long = options.count > Self.first + 1
            let shown = long && !all ? Array(options.prefix(Self.first)) : options
            Section {
                LazyVGrid(columns: columns, spacing: 8) {
                    ForEach(shown) { option in
                        Tile(emoji: option.emoji, label: option.label, count: option.count, on: picked.contains(option.token)) { pick(option.token) }
                    }
                    if long {
                        Tile(emoji: all ? "−" : "＋", label: all ? "Fewer" : "\(options.count - Self.first) more", count: nil, on: false, quiet: true) {
                            withAnimation(.snappy) { all.toggle() }
                        }
                    }
                }
                .padding(.horizontal, 16)
            } header: {
                Text(title).padding(.horizontal, 4)
            }
            .listRowInsets(EdgeInsets(top: 2, leading: 0, bottom: 2, trailing: 0))
            .listRowBackground(Color.clear)
            .listRowSeparator(.hidden)
            .listSectionMargins(.horizontal, 0)
        }
    }
}

/// A browse tile: emoji, name, and how many spots it finds; honey when picked.
private struct Tile: View {
    let emoji: String
    let label: String
    let count: Int?
    let on: Bool
    var quiet = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 5) {
                Text(emoji).font(.system(size: 20))
                Text(label)
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(quiet ? Color.textSecondary : Color.text)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.horizontal, 11)
            .padding(.vertical, 10)
            // One height for every tile, one-line names or two.
            .frame(maxWidth: .infinity, minHeight: 88, maxHeight: 88, alignment: .topLeading)
            .overlay(alignment: .topTrailing) {
                if let count {
                    Text("\(count)").font(.caption2.weight(.semibold)).foregroundStyle(Color.textSecondary).padding(9)
                }
            }
            .background {
                RoundedRectangle(cornerRadius: 16)
                    .fill(on ? Color.honey.opacity(0.16) : Color.cardFill)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .strokeBorder(on ? Color.honey.opacity(0.6) : Color.hairline, style: StrokeStyle(lineWidth: 1, dash: quiet ? [4, 3] : [])))
            }
            .contentShape(.rect(cornerRadius: 16))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(count.map { "\(label), \($0) spots" } ?? label)
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

private struct ResultRow: View {
    let result: SearchResult
    var favourite = false
    /// "Open · till 2 AM", for spots with nothing else to say.
    var open = ""
    var mightBeOpen = true

    var body: some View {
        let venue = result.ranked.venue
        HStack(spacing: 12) {
            Text(venue.vibe.glyph).font(.title3).frame(width: 36)
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(venue.name).font(.subheadline.weight(.semibold)).lineLimit(1)
                    if favourite { FavouriteStar() }
                    if result.on && mightBeOpen {
                        Text("On now")
                            .font(.system(size: 10.5, weight: .bold))
                            .foregroundStyle(Color.onHoney)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 2)
                            .background(.honeyFill, in: .capsule)
                    }
                }
                // The matching deal stands out, as on the web; otherwise the happy hour status.
                Group {
                    if let note = result.note {
                        Text("\(venue.category) · \(Text(note).foregroundStyle(Color.text).fontWeight(.semibold))")
                    } else if !venue.happyHours.isEmpty {
                        Text("\(venue.category) · \(statusLine(result.ranked.status))")
                    } else if !open.isEmpty {
                        Text("\(venue.category) · \(Text(open).foregroundStyle(open.hasPrefix("Open") ? Color.openGreen : Color.textSecondary))")
                    } else {
                        Text(venue.category)
                    }
                }
                .font(.footnote)
                .foregroundStyle(.secondary)
                .lineLimit(1)
            }
            Spacer(minLength: 4)
            WalkLabel(minutes: result.ranked.walkMin)
        }
        .contentShape(.rect)
    }
}

/// A row sorted by price: the price first (honey when it's on now), then where, what and when.
private struct PriceRow: View {
    let ranked: RankedVenue
    let deal: PriceDeal

    var body: some View {
        HStack(spacing: 12) {
            Text(formatPrice(deal.price))
                .font(.display(20))
                .foregroundStyle(deal.on ? Color.honeyAccent : Color.text)
                .frame(minWidth: 56, alignment: .leading)
            VStack(alignment: .leading, spacing: 3) {
                Text(ranked.venue.name).font(.subheadline.weight(.semibold)).lineLimit(1)
                Text(formatItem(deal.special.item)).font(.footnote).foregroundStyle(.secondary).lineLimit(1)
                Text(deal.when)
                    .font(.caption.weight(deal.on ? .semibold : .regular))
                    .foregroundStyle(deal.on ? Color.honeyAccent : Color.textSecondary)
                    .lineLimit(1)
            }
            Spacer(minLength: 4)
            WalkLabel(minutes: ranked.walkMin)
        }
        .contentShape(.rect)
    }
}
