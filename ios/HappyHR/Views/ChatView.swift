import HappyHRCore
import SwiftUI

/// The group chat: one room for everyone on Happy HR. Anyone can read; signed-in
/// people who've picked a name and agreed to the rules can post. Long-press a
/// message to report it, block its writer, or delete your own.
struct ChatView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var draft = ""
    @State private var sending = false
    @State private var problem: String?
    @State private var note: String?
    @State private var reporting: ChatMessage?
    @State private var showAccount = false
    @State private var showBlocked = false
    @State private var showRules = false
    @FocusState private var composing: Bool

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                messages
                composer
            }
            .navigationTitle("Group chat")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Menu {
                        Button("Chat rules", systemImage: "list.bullet") { showRules = true }
                        if model.account != nil {
                            Button("Blocked people", systemImage: "hand.raised") { showBlocked = true }
                        }
                    } label: {
                        Image(systemName: "ellipsis")
                    }
                    .accessibilityLabel("More")
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close", systemImage: "xmark") { dismiss() }
                }
            }
        }
        // Check for new messages every few seconds while the chat is open.
        .task {
            while !Task.isCancelled {
                await model.refreshChat()
                try? await Task.sleep(for: .seconds(4))
            }
        }
        .onAppear { model.openChat() }
        .onDisappear { model.showChat = false }
        .sheet(isPresented: $showAccount) {
            AccountView().presentationDetents([.large]).sheetBackground()
        }
        .sheet(isPresented: $showBlocked) {
            BlockedPeopleView().presentationDetents([.medium, .large]).sheetBackground()
        }
        .sheet(isPresented: $showRules) {
            ChatRulesView().presentationDetents([.medium]).sheetBackground()
        }
        .confirmationDialog("Report this message?", isPresented: Binding(get: { reporting != nil }, set: { if !$0 { reporting = nil } }), titleVisibility: .visible) {
            ForEach(["Harassment or hate", "Spam", "Sexual or violent", "Something else"], id: \.self) { reason in
                Button(reason) { report(reason) }
            }
        } message: {
            Text("We review reports within a day. You can also block them so you don’t see their messages.")
        }
    }

    // MARK: Messages

    private var messages: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 10) {
                    if model.chatMessages.isEmpty {
                        Text("No messages yet. Say hi 👋")
                            .foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity)
                            .padding(.top, 40)
                    }
                    ForEach(model.chatMessages) { message in
                        bubble(message).id(message.id)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
            .defaultScrollAnchor(.bottom)
            .scrollDismissesKeyboard(.interactively)
            .onChange(of: model.chatMessages.last?.id) { _, last in
                guard let last else { return }
                withAnimation(.smooth) { proxy.scrollTo(last, anchor: .bottom) }
            }
        }
    }

    private func bubble(_ message: ChatMessage) -> some View {
        let mine = message.userId == model.account?.id
        return VStack(alignment: mine ? .trailing : .leading, spacing: 3) {
            if !mine {
                Text(message.name).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            }
            Text(message.body)
                .font(.body)
                .foregroundStyle(mine ? Color.onHoney : Color.text)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background {
                    if mine {
                        RoundedRectangle(cornerRadius: 18).fill(.honeyFill)
                    } else {
                        RoundedRectangle(cornerRadius: 18).fill(Color.cardFill).overlay(RoundedRectangle(cornerRadius: 18).strokeBorder(Color.hairline))
                    }
                }
                .contextMenu { menu(message, mine: mine) }
            Text(time(message.createdAt)).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity, alignment: mine ? .trailing : .leading)
        .padding(mine ? .leading : .trailing, 48)
    }

    @ViewBuilder
    private func menu(_ message: ChatMessage, mine: Bool) -> some View {
        Button("Copy", systemImage: "doc.on.doc") { UIPasteboard.general.string = message.body }
        if mine {
            Button("Delete", systemImage: "trash", role: .destructive) {
                Task { await run { try await model.deleteChat(message) } }
            }
        } else {
            Button("Report…", systemImage: "flag") {
                if model.account == nil { showAccount = true } else { reporting = message }
            }
            Button("Block \(message.name)", systemImage: "hand.raised", role: .destructive) {
                if model.account == nil {
                    showAccount = true
                } else {
                    Task { await run(done: "You won’t see messages from \(message.name). Unblock them from the ⋯ menu.") { try await model.block(message) } }
                }
            }
        }
    }

    /// "9:41 PM" today, else "Tue 9:41 PM", on Toronto time.
    private func time(_ iso: String) -> String {
        guard let date = ISO8601DateFormatter().date(from: iso) else { return "" }
        let clock = TorontoClock(date)
        let today = torontoDate() == torontoDate(date)
        return today ? formatTime(clock.minutes) : "\(TorontoTime.dayShort[clock.day]) \(formatTime(clock.minutes))"
    }

    // MARK: Composer

    @ViewBuilder
    private var composer: some View {
        VStack(spacing: 8) {
            if let problem {
                Text(problem).font(.footnote).foregroundStyle(Color.ember).frame(maxWidth: .infinity, alignment: .leading)
            } else if let note {
                Text(note).font(.footnote).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
            }
            if let account = model.account {
                if account.displayName == nil || !account.chatRules {
                    JoinChatCard(suggested: account.displayName ?? "")
                } else {
                    HStack(alignment: .bottom, spacing: 8) {
                        TextField("Message everyone", text: $draft, axis: .vertical)
                            .lineLimit(1...5)
                            .focused($composing)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(Color.cardFill, in: .rect(cornerRadius: 20))
                            .overlay(RoundedRectangle(cornerRadius: 20).strokeBorder(Color.hairline))
                        Button(action: send) {
                            Image(systemName: "arrow.up.circle.fill")
                                .font(.system(size: 34))
                                .foregroundStyle(Color.honeyAccent)
                        }
                        .disabled(sending || draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                        .accessibilityLabel("Send")
                    }
                }
            } else {
                Button {
                    showAccount = true
                } label: {
                    Text("Sign in to chat").font(.body.weight(.semibold)).frame(maxWidth: .infinity)
                }
                .buttonStyle(.glassProminent)
                .tint(.honey)
                .foregroundStyle(Color.onHoney)
                .controlSize(.large)
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 12)
    }

    private func send() {
        let text = draft
        sending = true
        Task {
            defer { sending = false }
            await run {
                try await model.sendChat(text)
                draft = ""
            }
        }
    }

    private func report(_ reason: String) {
        guard let message = reporting else { return }
        reporting = nil
        Task { await run(done: "Thanks. We’ll take a look within a day.") { try await model.reportChat(message, reason: reason) } }
    }

    /// Runs an action, showing its error (or a note when it worked).
    private func run(done: String? = nil, _ action: () async throws -> Void) async {
        do {
            try await action()
            problem = nil
            note = done
        } catch {
            problem = error.localizedDescription
        }
    }
}

/// Before someone's first message: a name for the chat and the rules to agree to.
private struct JoinChatCard: View {
    @Environment(AppModel.self) private var model
    @State var suggested: String
    @State private var working = false
    @State private var problem: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Join the chat").font(.headline)
            ForEach(chatRules, id: \.self) { rule in
                Label(rule, systemImage: "checkmark.circle").font(.footnote).foregroundStyle(.secondary)
            }
            TextField("Your name in the chat", text: $suggested)
                .textContentType(.nickname)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color.cardFill, in: .rect(cornerRadius: 14))
                .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(Color.hairline))
            if let problem { Text(problem).font(.footnote).foregroundStyle(Color.ember) }
            Button {
                working = true
                Task {
                    defer { working = false }
                    do {
                        try await model.joinChat(name: suggested)
                        problem = nil
                    } catch {
                        problem = error.localizedDescription
                    }
                }
            } label: {
                Text("Agree and join").font(.body.weight(.semibold)).frame(maxWidth: .infinity)
            }
            .buttonStyle(.glassProminent)
            .tint(.honey)
            .foregroundStyle(Color.onHoney)
            .controlSize(.large)
            .disabled(working)
        }
        .padding(14)
        .cardBackground(cornerRadius: 18)
    }
}

private struct ChatRulesView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Chat rules").font(.display(24))
                Spacer()
                Button { dismiss() } label: {
                    Image(systemName: "xmark").font(.system(size: 15, weight: .semibold)).frame(width: 36, height: 36)
                }
                .buttonStyle(.plain)
                .glassCircle()
                .accessibilityLabel("Close")
            }
            ForEach(chatRules, id: \.self) { rule in
                Label(rule, systemImage: "checkmark.circle").foregroundStyle(Color.text)
            }
            Spacer()
        }
        .padding(20)
    }
}

/// People you've blocked, to let them back into your view of the chat.
private struct BlockedPeopleView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var people: [BlockedPerson]?
    @State private var problem: String?

    var body: some View {
        NavigationStack {
            List {
                if let people, people.isEmpty {
                    Text("You haven’t blocked anyone.").foregroundStyle(.secondary).listRowBackground(Color.clear)
                }
                ForEach(people ?? []) { person in
                    HStack {
                        Text(person.name)
                        Spacer()
                        Button("Unblock") {
                            Task {
                                do {
                                    try await model.unblock(person)
                                    self.people?.removeAll { $0.id == person.id }
                                } catch {
                                    problem = error.localizedDescription
                                }
                            }
                        }
                        .foregroundStyle(Color.honeyAccent)
                    }
                    .listRowBackground(Color.cardFill)
                }
                if let problem { Text(problem).foregroundStyle(Color.ember).listRowBackground(Color.clear) }
            }
            .scrollContentBackground(.hidden)
            .navigationTitle("Blocked people")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close", systemImage: "xmark") { dismiss() }
                }
            }
            .task {
                do { people = try await model.blockedPeople() } catch { problem = error.localizedDescription }
            }
        }
    }
}
