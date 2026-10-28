import HappyHRCore
import SwiftUI

/// "Run this place? Claim this page." Venue staff leave a way to reach them;
/// once the owner has checked, they get a link with a venue key to post deals
/// as the venue.
struct ClaimView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    let venue: Venue

    @State private var name = ""
    @State private var role = ""
    @State private var contact = ""
    @State private var message = ""
    @State private var problem: String?
    @State private var sending = false
    @State private var done = false

    var body: some View {
        NavigationStack {
            Form {
                Group {
                    if done {
                        Section {
                            Label(
                                "Thanks, we’ll be in touch. We check every request by phone or email, then send you a link to manage this page.",
                                systemImage: "checkmark.seal.fill")
                        }
                    } else {
                        Section {
                            Text("Post your own happy hours and specials, marked From the venue.")
                                .foregroundStyle(.secondary)
                        }
                        Section("You") {
                            TextField("Your name", text: $name).textContentType(.name)
                            TextField("Your role, e.g. Manager (optional)", text: $role)
                        }
                        Section("How we reach you") {
                            TextField("Email or phone, ideally the venue’s", text: $contact)
                                .textContentType(.emailAddress)
                                .keyboardType(.emailAddress)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                        }
                        Section("Anything else? (optional)") {
                            TextField("e.g. best time to call", text: $message, axis: .vertical)
                        }
                        if let problem {
                            Section { Text(problem).foregroundStyle(Color.ember) }
                        }
                    }
                }
                .listRowBackground(Color.cardFill)
            }
            .scrollContentBackground(.hidden)
            .navigationTitle(done ? "Thanks!" : "Claim \(venue.name)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(done ? "Done" : "Cancel") { dismiss() }
                }
                if !done {
                    ToolbarItem(placement: .confirmationAction) {
                        Button(sending ? "Sending…" : "Send", action: send).disabled(sending)
                    }
                }
            }
        }
    }

    private func send() {
        let input = ClaimInput(
            device: model.device, venueId: venue.id, name: name, role: role.isEmpty ? nil : role, contact: contact,
            message: message.isEmpty ? nil : message)
        sending = true
        Task {
            defer { sending = false }
            do {
                try await model.claim(input)
                problem = nil
                done = true
            } catch {
                problem = error.localizedDescription
            }
        }
    }
}

/// "Have a venue key?": the fallback for the link the owner sends, until links open the app directly.
struct VenueKeyView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var key = ""
    @State private var problem: String?
    @State private var working = false

    var body: some View {
        NavigationStack {
            Form {
                Group {
                    Section {
                        Text("Run a venue on Happy Hr? Paste the key from the link we sent you to post deals as the venue from this phone.")
                            .foregroundStyle(.secondary)
                    }
                    Section("Venue key") {
                        TextField("HHV-XXXX-XXXX-XXXX", text: $key)
                            .textInputAutocapitalization(.characters)
                            .autocorrectionDisabled()
                            .font(.body.monospaced())
                    }
                    if !model.venueKeys.isEmpty {
                        Section("This phone manages") {
                            ForEach(model.venueKeys.keys.sorted(), id: \.self) { id in
                                Text(model.venues.first { $0.id == id }?.name ?? id)
                            }
                        }
                    }
                    if let problem {
                        Section { Text(problem).foregroundStyle(Color.ember) }
                    }
                }
                .listRowBackground(Color.cardFill)
            }
            .scrollContentBackground(.hidden)
            .navigationTitle("Venue key")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(working ? "Checking…" : "Use key", action: use).disabled(working || key.isEmpty)
                }
            }
        }
    }

    private func use() {
        working = true
        Task {
            defer { working = false }
            do {
                let venueID = try await model.useVenueKey(key)
                let name = model.venues.first { $0.id == venueID }?.name ?? "this venue"
                model.say("You can now post deals for \(name) from this phone.")
                model.select(venueID)
                dismiss()
            } catch {
                problem = error.localizedDescription
            }
        }
    }
}
