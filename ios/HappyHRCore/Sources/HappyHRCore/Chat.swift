import Foundation

// The group chat: one room everyone can read; signed-in people can post.
// A port of src/lib/chat.ts, checked against shared/fixtures/chat.json.

/// A message as the API returns it.
public struct ChatMessage: Codable, Hashable, Identifiable, Sendable {
    public var id: Int
    /// The poster's account id, for blocking.
    public var userId: String
    public var name: String
    public var body: String
    public var createdAt: String

    public init(id: Int, userId: String, name: String, body: String, createdAt: String) {
        self.id = id
        self.userId = userId
        self.name = name
        self.body = body
        self.createdAt = createdAt
    }
}

public enum ChatLimits {
    public static let body = 500
    public static let name = 24
}

/// What everyone agrees to before their first message (App Store rule 1.2).
public let chatRules = [
    "Be kind. Swearing’s fine; slurs, harassment, hate and threats aren’t.",
    "No spam, ads or links to sell things.",
    "Nothing sexual or illegal, and no one’s personal details.",
    "Report anything that breaks these rules. We review reports within a day and remove people who break them.",
]

// Words are matched whole, in any case, including simple disguises (repeated
// letters, digits for letters, separators between letters).
/// Everyday swearing: fine in messages, not in chat names.
private let swears = ["fuck", "fucking", "fucker", "motherfucker", "shit"]
/// Never allowed: slurs, sexual insults and threats (App Store rule 1.2 asks for a filter).
private let blocked = [
    "cunt", "bitch", "whore", "slut",
    "nigger", "nigga", "faggot", "fag", "retard", "tranny", "kike", "spic", "chink", "paki", "wetback", "dyke",
    "rape", "rapist", "kys",
]

private func squeeze(_ word: String) -> String {
    var out = ""
    for c in word where c != out.last { out.append(c) }
    return out
}

private let blockedSqueezed = Set(blocked + blocked.map(squeeze))
private let swearsSqueezed = Set(swears + swears.map(squeeze))
private let leet: [Character: Character] = ["0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i"]

/// "F.U.C.K", "fuuuck", "sh1t" → the forms the word list is checked against.
func normalizeForFilter(_ text: String) -> [String] {
    let lower = String(text.lowercased().map { leet[$0] ?? $0 })
    let words = lower.split { !("a"..."z").contains($0) }.map(String.init)
    // Single letters split by separators ("f u c k", "f.u.c.k this") rejoin into one word.
    var rejoined: [String] = []
    var run = ""
    for w in words + [""] {
        if w.count == 1 {
            run += w
            continue
        }
        if run.count > 1 { rejoined.append(run) }
        run = ""
    }
    let all = words + rejoined
    return all + all.map(squeeze)
}

/// Slurs, sexual insults and threats; swearing too unless `allowSwearing` (messages allow it, names don't).
public func isObjectionable(_ text: String, allowSwearing: Bool = false) -> Bool {
    normalizeForFilter(text).contains { blockedSqueezed.contains($0) || (!allowSwearing && swearsSqueezed.contains($0)) }
}

/// A message for people when the post can't go out, else nil.
public func validateChatMessage(_ body: String) -> String? {
    let trimmed = body.trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmed.isEmpty { return "Write a message first." }
    if trimmed.utf16.count > ChatLimits.body { return "Keep it under \(ChatLimits.body) characters." }
    if isObjectionable(body, allowSwearing: true) { return "That message breaks the chat rules." }
    return nil
}

/// The name shown next to someone's messages.
public func validateDisplayName(_ name: String) -> String? {
    let n = name.trimmingCharacters(in: .whitespacesAndNewlines)
    if n.isEmpty { return "Pick a name for the chat." }
    if n.utf16.count > ChatLimits.name { return "Keep your name under \(ChatLimits.name) characters." }
    if (try? /^[\p{L}\p{N}][\p{L}\p{N} .'’_-]*$/.wholeMatch(in: n)) == nil { return "Use letters, numbers and spaces in your name." }
    if isObjectionable(n) { return "Pick a different name." }
    return nil
}
