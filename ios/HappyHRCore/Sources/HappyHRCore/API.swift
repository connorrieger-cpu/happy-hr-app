import Foundation

#if canImport(FoundationNetworking)
    import FoundationNetworking
#endif

// The Happy HR API client (see shared/api/openapi.yaml) and an on-device cache
// for the venue list, so the app opens instantly and works offline.

public enum APIError: Error, LocalizedError, Equatable {
    /// The server said no, with a message meant for people ("Pick at least one day.").
    case rejected(status: Int, message: String)
    case badResponse(status: Int)
    /// The venue data is newer than this build understands: time to update the app.
    case unsupportedSchema(Int)
    /// The server doesn't have this area yet.
    case unknownArea(String)

    public var errorDescription: String? {
        switch self {
        case let .rejected(_, message): message
        case let .badResponse(status): "The server had a problem (\(status)). Try again."
        case .unsupportedSchema: "Update Happy Hr to see the latest deals."
        case .unknownArea: "This area isn’t ready yet. Try again soon."
        }
    }
}

public struct Health: Codable, Hashable, Sendable {
    public var ok: Bool
    public var api: Int
    public var schemaVersion: Int
    public var dataVersion: String
    public var database: String
    public var time: String
}

/// A signed-in person (see web/src/lib/account.ts).
public struct Account: Codable, Hashable, Sendable {
    public var id: String
    /// Nil for an Apple account that didn't share an email.
    public var email: String?
    /// Signed in with Apple (else with an emailed code).
    public var apple: Bool
    /// The name shown in the chat; nil until they pick one.
    public var displayName: String?
    /// Agreed to the chat rules.
    public var chatRules: Bool

    public init(id: String, email: String?, apple: Bool = false, displayName: String? = nil, chatRules: Bool = false) {
        self.id = id
        self.email = email
        self.apple = apple
        self.displayName = displayName
        self.chatRules = chatRules
    }

    // Sign-ins saved by older versions only have an id and an email.
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        email = try c.decodeIfPresent(String.self, forKey: .email)
        apple = try c.decodeIfPresent(Bool.self, forKey: .apple) ?? false
        displayName = try c.decodeIfPresent(String.self, forKey: .displayName)
        chatRules = try c.decodeIfPresent(Bool.self, forKey: .chatRules) ?? false
    }
}

/// What the app sends after Sign in with Apple.
public struct AppleSignInInput: Codable, Hashable, Sendable {
    public var identityToken: String
    public var authorizationCode: String?
    /// The random nonce whose SHA-256 the app gave Apple.
    public var nonce: String
    /// Apple only shares the name on the very first sign-in.
    public var givenName: String?
    public var device: String

    public init(identityToken: String, authorizationCode: String?, nonce: String, givenName: String?, device: String) {
        self.identityToken = identityToken
        self.authorizationCode = authorizationCode
        self.nonce = nonce
        self.givenName = givenName
        self.device = device
    }
}

/// Someone you've blocked in the chat.
public struct BlockedPerson: Codable, Hashable, Identifiable, Sendable {
    public var userId: String
    public var name: String
    public var id: String { userId }
}

/// The reply to a verified code: a session token for this device, and the account.
public struct SignIn: Codable, Hashable, Sendable {
    public var token: String
    public var account: Account
}

public struct CodeSent: Decodable, Hashable, Sendable {
    public var sent: Bool
    /// Only from a local test server (DEV_SHOW_CODE); never in production.
    public var devCode: String?
}

public enum VenuesResult: Sendable {
    /// New data, with the ETag to send next time and the bytes as the server sent them (for the cache).
    case updated(VenuesPayload, etag: String?, raw: Data)
    /// Nothing changed since the ETag sent.
    case notModified
}

public struct HappyHRClient: Sendable {
    public static let production = URL(string: "https://happy-hr-beta.pages.dev")!

    public var baseURL: URL
    public var session: URLSession

    public init(baseURL: URL = HappyHRClient.production, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func health() async throws -> Health {
        try await get("api/health")
    }

    /// An area's venue list (Ossington's when `area` is nil). Pass the last ETag to skip the
    /// download when nothing changed.
    public func venues(area: String? = nil, ifNoneMatch etag: String? = nil) async throws -> VenuesResult {
        var request = URLRequest(url: url(area.map { "api/venues?area=\($0)" } ?? "api/venues"))
        // The ETag is handled here (and in VenueCache); URLSession's own cache would sometimes
        // answer a 304 with an old copy of its own.
        request.cachePolicy = .reloadIgnoringLocalCacheData
        if let etag { request.setValue(etag, forHTTPHeaderField: "If-None-Match") }
        let (data, http) = try await send(request)
        if http.statusCode == 304 { return .notModified }
        try check(http, data)
        let payload = try JSONDecoder().decode(VenuesPayload.self, from: data)
        guard payload.schemaVersion <= VenuesPayload.supportedSchemaVersion else { throw APIError.unsupportedSchema(payload.schemaVersion) }
        return .updated(payload, etag: http.value(forHTTPHeaderField: "ETag"), raw: data)
    }

    public func community() async throws -> CommunityData {
        try await get("api/community")
    }

    /// Adds a happy hour or daily special. Returns its id.
    @discardableResult
    public func submit(_ input: SubmissionInput) async throws -> String {
        struct Created: Decodable { var id: String }
        let created: Created = try await post("api/submissions", input)
        return created.id
    }

    /// "Did the deal work?" Voting again the same day replaces the answer.
    public func vote(_ input: VoteInput) async throws {
        struct Saved: Decodable { var ok: Bool }
        let _: Saved = try await post("api/votes", input)
    }

    // MARK: Venue owners

    /// Venue staff ask to manage a page; the owner approves on the web. Returns the claim's id.
    /// 400 bad input, 429 more than 3 a day, 503 claiming isn't switched on yet.
    @discardableResult
    public func claim(_ input: ClaimInput) async throws -> String {
        struct Created: Decodable { var id: String }
        let created: Created = try await post("api/claims", input)
        return created.id
    }

    /// Which venue a key from a `?venuekey=` link manages. 404 for an unknown or replaced key.
    public func venueForKey(_ key: String) async throws -> (venueId: String, areaId: String?) {
        struct Found: Decodable {
            var venueId: String
            var areaId: String?
        }
        let found: Found = try await post("api/venue-key", ["key": key])
        return (found.venueId, found.areaId)
    }

    // MARK: Accounts

    /// Emails a 6-digit sign-in code.
    public func requestCode(email: String) async throws -> CodeSent {
        try await post("api/auth/code", ["email": email])
    }

    /// Checks the code; signs this device in.
    public func verify(email: String, code: String, device: String) async throws -> SignIn {
        try await post("api/auth/verify", ["email": email, "code": code, "device": device])
    }

    /// Sign in with Apple: the server checks Apple's token and signs this device in.
    public func signInWithApple(_ input: AppleSignInInput) async throws -> SignIn {
        try await post("api/auth/apple", input)
    }

    /// Changes the chat name and/or agrees to the chat rules.
    public func updateProfile(displayName: String? = nil, chatRules: Bool? = nil, token: String) async throws -> Account {
        struct Body: Encodable {
            var displayName: String?
            var chatRules: Bool?
        }
        struct Me: Decodable { var account: Account }
        let me: Me = try await call("PATCH", "api/me", body: Body(displayName: displayName, chatRules: chatRules), token: token)
        return me.account
    }

    // MARK: Group chat

    /// The latest messages (oldest first), or only those newer than `after`.
    public func chat(after: Int? = nil, token: String?) async throws -> [ChatMessage] {
        struct Page: Decodable { var messages: [ChatMessage] }
        let page: Page = try await call("GET", after.map { "api/chat?after=\($0)" } ?? "api/chat", token: token)
        return page.messages
    }

    public func postChat(_ body: String, token: String) async throws -> ChatMessage {
        struct Posted: Decodable { var message: ChatMessage }
        let posted: Posted = try await call("POST", "api/chat", body: ["body": body], token: token)
        return posted.message
    }

    public func deleteChat(_ id: Int, token: String) async throws {
        struct Done: Decodable { var ok: Bool }
        let _: Done = try await call("DELETE", "api/chat/\(id)", token: token)
    }

    public func reportChat(_ id: Int, reason: String?, token: String) async throws {
        struct Body: Encodable {
            var messageId: Int
            var reason: String?
        }
        struct Done: Decodable { var ok: Bool }
        let _: Done = try await call("POST", "api/chat/report", body: Body(messageId: id, reason: reason), token: token)
    }

    public func blocked(token: String) async throws -> [BlockedPerson] {
        struct List: Decodable { var blocked: [BlockedPerson] }
        let list: List = try await call("GET", "api/chat/blocks", token: token)
        return list.blocked
    }

    public func block(_ userId: String, token: String) async throws {
        struct Done: Decodable { var ok: Bool }
        let _: Done = try await call("POST", "api/chat/blocks", body: ["userId": userId], token: token)
    }

    public func unblock(_ userId: String, token: String) async throws {
        struct Done: Decodable { var ok: Bool }
        let _: Done = try await call("DELETE", "api/chat/blocks", body: ["userId": userId], token: token)
    }

    public func me(token: String) async throws -> Account {
        struct Me: Decodable { var account: Account }
        let me: Me = try await call("GET", "api/me", token: token)
        return me.account
    }

    public func signOut(token: String) async throws {
        struct Done: Decodable { var ok: Bool }
        let _: Done = try await call("POST", "api/auth/sign-out", token: token)
    }

    /// Deletes the account, its favourites and every signed-in device.
    public func deleteAccount(token: String) async throws {
        struct Done: Decodable { var ok: Bool }
        let _: Done = try await call("DELETE", "api/me", token: token)
    }

    public func favourites(token: String) async throws -> [String] {
        let saved: Favourites = try await call("GET", "api/favourites", token: token)
        return saved.venueIds
    }

    /// Replaces the account's favourites; returns what's stored.
    public func saveFavourites(_ venueIds: [String], token: String) async throws -> [String] {
        let saved: Favourites = try await call("PUT", "api/favourites", body: Favourites(venueIds: venueIds), token: token)
        return saved.venueIds
    }

    private struct Favourites: Codable { var venueIds: [String] }

    // MARK: Usage

    /// Anonymous counts (Usage.swift). 400 bad report, 429 too many today, 503 not switched on yet.
    public func postUsage(_ report: UsageReport) async throws {
        var request = URLRequest(url: url("api/usage"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(report)
        let (data, http) = try await send(request)
        try check(http, data)
    }

    /// The owner's Usage screen for the last `days` days. 401 for a wrong owner password.
    public func ownerUsage(days: Int, ownerToken: String) async throws -> UsageSummary {
        try await call("GET", "api/owner-usage?days=\(days)", token: ownerToken)
    }

    // MARK: Plumbing

    private func get<T: Decodable>(_ path: String) async throws -> T {
        try await call("GET", path)
    }

    private func post<Body: Encodable, T: Decodable>(_ path: String, _ body: Body) async throws -> T {
        try await call("POST", path, body: body)
    }

    private struct NoBody: Encodable {}

    private func call<T: Decodable>(_ method: String, _ path: String, token: String? = nil) async throws -> T {
        try await call(method, path, body: Optional<NoBody>.none, token: token)
    }

    private func call<Body: Encodable, T: Decodable>(_ method: String, _ path: String, body: Body?, token: String? = nil) async throws -> T {
        var request = URLRequest(url: url(path))
        request.httpMethod = method
        if let token { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(body)
        }
        let (data, http) = try await send(request)
        try check(http, data)
        return try JSONDecoder().decode(T.self, from: data)
    }

    /// "api/chat?after=5" → base + path, keeping the query as a query.
    private func url(_ path: String) -> URL {
        let parts = path.split(separator: "?", maxSplits: 1)
        var components = URLComponents(url: baseURL.appendingPathComponent(String(parts[0])), resolvingAgainstBaseURL: false)!
        if parts.count > 1 { components.percentEncodedQuery = String(parts[1]) }
        return components.url!
    }

    private func send(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.badResponse(status: 0) }
        return (data, http)
    }

    private func check(_ http: HTTPURLResponse, _ data: Data) throws {
        guard !(200..<300).contains(http.statusCode) else { return }
        struct Problem: Decodable { var error: String }
        if (400..<500).contains(http.statusCode), let problem = try? JSONDecoder().decode(Problem.self, from: data) {
            throw APIError.rejected(status: http.statusCode, message: problem.error)
        }
        throw APIError.badResponse(status: http.statusCode)
    }
}

/// Keeps the last venue list (and its ETag) on disk, so the app opens with data
/// before the network answers, and still works with no signal.
///
/// It keeps the server's bytes, not a re-encoding. The first cache re-encoded the
/// payload, so a copy saved by an app that didn't know a field yet (hours, amenities,
/// menus…) lost it, and the unchanged ETag kept that copy from ever being replaced.
public struct VenueCache: Sendable {
    private struct Stored: Codable {
        var etag: String?
        var raw: Data
    }

    public let fileURL: URL
    /// The area this cache holds; nil asks the API for its default (Ossington), as apps from before areas did.
    public let areaId: String?

    /// - Parameters:
    ///   - directory: e.g. the app's Caches or Application Support folder.
    ///   - areaId: one cache file per area.
    public init(directory: URL, areaId: String? = nil) {
        self.areaId = areaId
        fileURL = directory.appendingPathComponent(areaId.map { "venues-\($0).json" } ?? "venues-cache-2.json")
        // The old re-encoded cache may be missing fields; drop it so the app downloads afresh.
        try? FileManager.default.removeItem(at: directory.appendingPathComponent("venues-cache.json"))
    }

    public func load() -> (payload: VenuesPayload, etag: String?)? {
        guard let data = try? Data(contentsOf: fileURL), let stored = try? JSONDecoder().decode(Stored.self, from: data),
              let payload = try? JSONDecoder().decode(VenuesPayload.self, from: stored.raw)
        else { return nil }
        guard payload.schemaVersion <= VenuesPayload.supportedSchemaVersion else { return nil }
        return (payload, stored.etag)
    }

    /// - Parameter raw: the venue list exactly as `GET /api/venues` sent it.
    public func save(raw: Data, etag: String?) throws {
        try FileManager.default.createDirectory(at: fileURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try JSONEncoder().encode(Stored(etag: etag, raw: raw)).write(to: fileURL, options: .atomic)
    }

    /// Loads the cache, then asks the server for anything newer and saves it.
    /// Returns the freshest payload available, or throws when there's neither cache nor network.
    public func refresh(using client: HappyHRClient) async throws -> VenuesPayload {
        let cached = load()
        do {
            switch try await client.venues(area: areaId, ifNoneMatch: cached?.etag) {
            case let .updated(payload, etag, raw):
                // A server from before areas answers every area with Ossington's list.
                if let areaId, payload.area.id != areaId { throw APIError.unknownArea(areaId) }
                try? save(raw: raw, etag: etag)
                return payload
            case .notModified:
                // Only possible when an ETag was sent, i.e. there's a cache.
                guard let cached else { throw APIError.badResponse(status: 304) }
                return cached.payload
            }
        } catch {
            if let cached { return cached.payload }
            throw error
        }
    }
}
