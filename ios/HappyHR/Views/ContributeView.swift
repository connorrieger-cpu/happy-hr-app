import HappyHRCore
import SwiftUI

/// Add a happy hour or a daily special, for a listed spot or somewhere new.
/// It goes live right away, marked Community, or "From the venue" when the
/// venue's own staff post it with their venue key (`target.asVenue`).
struct ContributeView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    let target: ContributeTarget

    @State private var kind: SubmissionKind = .happyHour
    @State private var title = ""
    @State private var allDay = true
    @State private var newPlace = false
    @State private var venueID = ""
    @State private var name = ""
    @State private var address = ""
    @State private var useMyLocation = false
    @State private var days: Set<Weekday> = []
    @State private var start = 16 * 60
    @State private var end = 18 * 60
    @State private var specials: [Draft] = [Draft()]
    @State private var note = ""
    @State private var problem: String?
    @State private var sending = false
    @State private var done = false

    struct Draft: Identifiable {
        let id = UUID()
        var kind: Special.Kind = .drink
        var item = ""
        var price = ""
    }

    var body: some View {
        let listed = model.venues.sorted { $0.name.localizedCompare($1.name) == .orderedAscending }
        NavigationStack {
            Form {
                Group {
                    if done {
                        Section {
                            Label(
                                target.asVenue
                                    ? "Posted. It’s live now, marked From the venue."
                                    : "Thanks! It’s live, marked Community. Others can confirm it when they visit.",
                                systemImage: "checkmark.seal.fill")
                        }
                    } else {
                        Section("What") {
                            Picker("Kind", selection: $kind) {
                                Text("Happy hour").tag(SubmissionKind.happyHour)
                                Text("Daily special").tag(SubmissionKind.daily)
                            }
                            .pickerStyle(.segmented)
                            if kind == .daily {
                                TextField("Name, if it has one (e.g. Taco Tuesday)", text: $title)
                            }
                        }

                        // The venue's own staff post for their venue only.
                        if !target.asVenue {
                        Section("Where") {
                            Toggle("Somewhere new", isOn: $newPlace)
                            if newPlace {
                                TextField("Name, e.g. Bar Raval", text: $name)
                                TextField("Street address, e.g. 505 College St", text: $address)
                                if model.location.coordinate != nil {
                                    Toggle("I’m here now (use my location for the pin)", isOn: $useMyLocation)
                                }
                            } else {
                                Picker("Spot", selection: $venueID) {
                                    ForEach(listed) { venue in
                                        Text("\(venue.name) · \(venue.address)").tag(venue.id)
                                    }
                                }
                            }
                        }
                        }

                        Section("When") {
                            HStack {
                                ForEach([1, 2, 3, 4, 5, 6, 0], id: \.self) { day in
                                    let on = days.contains(day)
                                    Button(String(TorontoTime.dayShort[day].prefix(2))) {
                                        if on { days.remove(day) } else { days.insert(day) }
                                    }
                                    .font(.footnote.weight(.semibold))
                                    .foregroundStyle(on ? Color.onHoney : Color.text)
                                    .modifier(ChipStyle(selected: on))
                                }
                            }
                            if kind == .daily {
                                Toggle("All day (whenever they’re open)", isOn: $allDay)
                            }
                            if kind == .happyHour || !allDay {
                                Picker("Starts", selection: $start) {
                                    ForEach(Array(stride(from: 6 * 60, to: 24 * 60, by: 15)), id: \.self) { Text(formatTime($0)).tag($0) }
                                }
                                Picker("Ends", selection: $end) {
                                    ForEach(Array(stride(from: start + 15, through: start + 12 * 60, by: 15)), id: \.self) { m in
                                        Text(formatTime(m) + (m >= 24 * 60 ? " (next day)" : "")).tag(m)
                                    }
                                }
                            }
                        }

                        Section("Specials") {
                            ForEach($specials) { $draft in
                                HStack {
                                    Button(draft.kind == .drink ? "🍺" : "🍽️") { draft.kind = draft.kind == .drink ? .food : .drink }
                                        .buttonStyle(.borderless)
                                    TextField("$", text: $draft.price)
                                        .keyboardType(.decimalPad)
                                        .frame(width: 56)
                                    TextField("what’s on special", text: $draft.item)
                                }
                            }
                            .onDelete { specials.remove(atOffsets: $0) }
                            if specials.count < CommunityLimits.specials {
                                Button("Add another special", systemImage: "plus") { specials.append(Draft()) }
                            }
                        }

                        Section(target.asVenue ? "Anything to add? (optional)" : "Where did you see it? (optional)") {
                            TextField(target.asVenue ? "e.g. Patio only, while it lasts" : "e.g. chalkboard by the door, their Instagram", text: $note)
                        }

                        if let problem {
                            Section { Text(problem).foregroundStyle(Color.ember) }
                        }
                    }
                }
                .listRowBackground(Color.cardFill)
            }
            // The sheet's mocha (or cream) glass shows through, with quiet card rows, like the web form.
            .scrollContentBackground(.hidden)
            .navigationTitle(done ? "Thanks!" : title(listed))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(done ? "Done" : "Cancel") { dismiss() }
                }
                if !done {
                    ToolbarItem(placement: .confirmationAction) {
                        Button(sending ? "Sending…" : target.asVenue ? "Post it" : "Share", action: submit)
                            .disabled(sending)
                    }
                }
            }
            .onAppear {
                venueID = target.venueID ?? listed.first?.id ?? ""
                newPlace = target.venueID == nil && listed.isEmpty
            }
        }
    }

    private func title(_ listed: [Venue]) -> String {
        guard target.asVenue, let venue = listed.first(where: { $0.id == target.venueID }) else { return "Add a deal" }
        return "Post a deal at \(venue.name)"
    }

    private func submit() {
        let cleaned = specials
            .filter { !$0.item.trimmingCharacters(in: .whitespaces).isEmpty }
            .map { Special(kind: $0.kind, item: $0.item.trimmingCharacters(in: .whitespaces), price: Double($0.price)) }
        let timed = kind == .happyHour || !allDay
        var input = SubmissionInput(
            device: model.device, kind: kind, title: kind == .daily && !title.isEmpty ? title : nil, venueName: name, days: Array(days).sorted(),
            start: timed ? start : nil, end: timed ? end : nil, specials: cleaned, note: note.isEmpty ? nil : note)
        if newPlace {
            input.address = address
            if useMyLocation, let here = model.location.coordinate {
                input.lat = here.lat
                input.lng = here.lng
            }
        } else if let venue = model.venues.first(where: { $0.id == venueID }) {
            input.venueId = venue.id
            input.venueName = venue.name
        }
        sending = true
        Task {
            defer { sending = false }
            do {
                try await model.submit(input, asVenue: target.asVenue)
                problem = nil
                done = true
            } catch {
                problem = error.localizedDescription
            }
        }
    }
}
