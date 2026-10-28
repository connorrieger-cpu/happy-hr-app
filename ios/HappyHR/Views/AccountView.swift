import AuthenticationServices
import HappyHRCore
import SwiftUI

/// Sign in with Apple, or with a 6-digit code sent by email, so favourites
/// follow you to any phone and you can post in the group chat. Signed in: who
/// you are, your chat name, sign out, and delete the account.
struct AccountView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Group {
                if let account = model.account {
                    SignedIn(account: account)
                } else {
                    SignInForm()
                }
            }
            .navigationTitle(model.account == nil ? "Sign in" : "Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close", systemImage: "xmark") { dismiss() }
                }
            }
        }
    }
}

private struct SignInForm: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var code = ""
    /// The email a code went to; the form moves on to the code once there is one.
    @State private var sentTo: String?
    @State private var working = false
    @State private var problem: String?
    @State private var note: String?
    /// The nonce for the Apple sign-in in progress.
    @State private var nonce = AppModel.newNonce()
    @FocusState private var focus: Field?
    @Environment(\.colorScheme) private var colorScheme

    private enum Field { case email, code }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("⭐️").font(.system(size: 44))
                Text(sentTo == nil ? "Keep your favourites everywhere" : "Check your email")
                    .font(.display(26))
                Text(
                    sentTo.map { "We sent a 6-digit code to \($0). It works for 10 minutes." }
                        ?? "Your favourites follow you to any phone, and you can chat with everyone on Happy Hr."
                )
                .foregroundStyle(.secondary)

                if sentTo == nil {
                    SignInWithAppleButton(.signIn) { request in
                        nonce = AppModel.newNonce()
                        request.requestedScopes = [.fullName, .email]
                        request.nonce = AppModel.sha256(nonce)
                    } onCompletion: { result in
                        signInWithApple(result)
                    }
                    .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
                    .frame(height: 52)
                    .clipShape(.capsule)
                    .disabled(working)

                    HStack {
                        Rectangle().fill(Color.hairline).frame(height: 1)
                        Text("or use your email").font(.footnote).foregroundStyle(.secondary).fixedSize()
                        Rectangle().fill(Color.hairline).frame(height: 1)
                    }

                    TextField("you@example.com", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .submitLabel(.send)
                        .onSubmit(sendCode)
                        .focused($focus, equals: .email)
                        .modifier(FieldStyle())
                    primaryButton("Email me a code", action: sendCode)
                } else {
                    TextField("123456", text: $code)
                        .textContentType(.oneTimeCode)
                        .keyboardType(.numberPad)
                        .font(.display(28).monospacedDigit())
                        .multilineTextAlignment(.center)
                        .focused($focus, equals: .code)
                        .modifier(FieldStyle())
                        .onChange(of: code) { _, typed in
                            code = String(typed.filter(\.isNumber).prefix(6))
                            if code.count == 6 { verify() }
                        }
                    primaryButton("Sign in", action: verify)
                    HStack {
                        Button("Use a different email") {
                            sentTo = nil
                            code = ""
                            problem = nil
                            note = nil
                            focus = .email
                        }
                        Spacer()
                        Button("Send a new code", action: sendCode)
                    }
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Color.honeyAccent)
                    .disabled(working)
                }

                if let problem {
                    Text(problem).font(.footnote).foregroundStyle(Color.ember)
                }
                if let note {
                    Text(note).font(.footnote).foregroundStyle(.secondary)
                }
            }
            .padding(20)
        }
        .scrollBounceBehavior(.basedOnSize)
    }

    private func signInWithApple(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case let .success(authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else { return }
            Task {
                working = true
                defer { working = false }
                do {
                    try await model.signInWithApple(credential, nonce: nonce)
                    dismiss()
                } catch {
                    problem = error.localizedDescription
                }
            }
        case let .failure(error):
            // Closing Apple's sheet isn't a problem worth showing.
            if (error as? ASAuthorizationError)?.code != .canceled { problem = error.localizedDescription }
        }
    }

    private func primaryButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Group {
                if working { ProgressView().tint(Color.onHoney) } else { Text(title) }
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

    private func sendCode() {
        let address = sentTo ?? email.trimmingCharacters(in: .whitespaces)
        guard !working, !address.isEmpty else {
            problem = "Enter your email."
            return
        }
        Task {
            working = true
            defer { working = false }
            do {
                let devCode = try await model.requestCode(email: address)
                problem = nil
                sentTo = address.lowercased()
                code = ""
                focus = .code
                #if DEBUG
                    // A local test server hands the code back instead of emailing it.
                    if let devCode {
                        note = "Test server: code filled in."
                        code = devCode
                    }
                #endif
            } catch {
                problem = error.localizedDescription
            }
        }
    }

    private func verify() {
        guard !working, let sentTo else { return }
        Task {
            working = true
            defer { working = false }
            do {
                try await model.verify(email: sentTo, code: code)
                dismiss()
            } catch {
                problem = error.localizedDescription
                code = ""
            }
        }
    }
}

private struct SignedIn: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    let account: Account
    @State private var chatName = ""
    @State private var confirmDelete = false
    @State private var working = false
    @State private var problem: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(account.apple ? "Signed in with Apple" : "Signed in as").font(.footnote.weight(.semibold)).foregroundStyle(.secondary)
                    Text(account.email ?? "Email hidden by Apple").font(.title3.weight(.semibold))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(16)
                .cardBackground(cornerRadius: 16)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Your name in the chat").font(.footnote.weight(.semibold)).foregroundStyle(.secondary)
                    HStack {
                        TextField("Pick a name", text: $chatName)
                            .textContentType(.nickname)
                            .submitLabel(.done)
                            .onSubmit(saveName)
                        if chatName.trimmingCharacters(in: .whitespaces) != (account.displayName ?? "") {
                            Button("Save", action: saveName).font(.body.weight(.semibold)).foregroundStyle(Color.honeyAccent)
                        }
                    }
                }
                .padding(16)
                .cardBackground(cornerRadius: 16)

                Label(
                    model.favourites.isEmpty
                        ? "Star a spot and it’s saved to your account."
                        : "\(model.favourites.count) favourite\(model.favourites.count == 1 ? "" : "s"), saved to your account.",
                    systemImage: "star.fill"
                )
                .foregroundStyle(.secondary)

                Button {
                    Task {
                        working = true
                        await model.signOut()
                        working = false
                        dismiss()
                    }
                } label: {
                    Text("Sign out").font(.body.weight(.semibold)).frame(maxWidth: .infinity)
                }
                .buttonStyle(.glass)
                .controlSize(.large)
                .disabled(working)

                Button("Delete account", role: .destructive) { confirmDelete = true }
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Color.ember)
                    .frame(maxWidth: .infinity)
                    .disabled(working)

                if let problem {
                    Text(problem).font(.footnote).foregroundStyle(Color.ember)
                }
            }
            .padding(20)
        }
        .scrollBounceBehavior(.basedOnSize)
        .onAppear { chatName = account.displayName ?? "" }
        .confirmationDialog("Delete your account?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Delete account", role: .destructive) {
                Task {
                    working = true
                    defer { working = false }
                    do {
                        try await model.deleteAccount()
                        dismiss()
                    } catch {
                        problem = error.localizedDescription
                    }
                }
            }
        } message: {
            Text("Your account, saved favourites and chat messages are removed from Happy Hr. Favourites stay on this phone.")
        }
    }
}

extension SignedIn {
    fileprivate func saveName() {
        Task {
            do {
                try await model.renameInChat(chatName)
                problem = nil
            } catch {
                problem = error.localizedDescription
            }
        }
    }
}

/// A quiet rounded text field on the sheet's glass.
private struct FieldStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(.horizontal, 16)
            .frame(minHeight: 52)
            .background(Color.cardFill, in: .rect(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(Color.hairline))
    }
}
