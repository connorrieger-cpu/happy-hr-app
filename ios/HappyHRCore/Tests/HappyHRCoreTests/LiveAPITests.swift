import Foundation
import Testing

@testable import HappyHRCore

// Talks to a running server, read-only. Off by default; run with
//   HAPPYHR_API=https://happy-hr-beta.pages.dev swift test --filter LiveAPI
// (or http://localhost:5173 with `wrangler pages dev` running in web/).

private let apiURL = ProcessInfo.processInfo.environment["HAPPYHR_API"].flatMap(URL.init(string:))

@Suite(.enabled(if: apiURL != nil, "Set HAPPYHR_API to run"))
struct LiveAPI {
    let client = HappyHRClient(baseURL: apiURL ?? HappyHRClient.production)

    @Test func healthAndVenues() async throws {
        let health = try await client.health()
        #expect(health.ok && health.schemaVersion == VenuesPayload.supportedSchemaVersion)

        guard case let .updated(payload, etag, _) = try await client.venues() else {
            Issue.record("Expected the venue list")
            return
        }
        #expect(payload.venues.count > 50)
        // Cloudflare may weaken it to W/"…" when the response is compressed.
        #expect(etag?.contains(health.dataVersion) == true)

        // Sending the ETag back means nothing to download.
        guard case .notModified = try await client.venues(ifNoneMatch: etag) else {
            Issue.record("Expected 304 Not Modified")
            return
        }
    }

    @Test func community() async throws {
        let data = try await client.community()
        #expect(data.votes.values.allSatisfy { $0.yes + $0.no > 0 })
    }

    @Test func rejectsABadSubmissionWithAMessage() async throws {
        // Fails validation before anything is stored.
        let bad = SubmissionInput(device: "x", venueId: "union", venueName: "Union", days: [], specials: [])
        await #expect(throws: APIError.rejected(status: 400, message: "Missing device id.")) {
            try await client.submit(bad)
        }
    }

    @Test func cacheFallsBackWhenOffline() async throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("happyhr-live-\(UUID().uuidString)")
        defer { try? FileManager.default.removeItem(at: dir) }
        let cache = VenueCache(directory: dir)
        let fresh = try await cache.refresh(using: client)
        #expect(cache.load()?.payload == fresh)

        let offline = HappyHRClient(baseURL: URL(string: "http://127.0.0.1:9")!)
        #expect(try await cache.refresh(using: offline) == fresh)
    }
}

// Signs up, saves favourites and deletes the account again. Only against a local
// test server that hands codes back instead of emailing them:
//   wrangler pages dev dist --port 8788 --binding DEV_SHOW_CODE=1   (in web/)
//   HAPPYHR_API=http://127.0.0.1:8788 HAPPYHR_TEST_ACCOUNTS=1 swift test --filter LiveAccount
@Suite(.enabled(if: apiURL != nil && ProcessInfo.processInfo.environment["HAPPYHR_TEST_ACCOUNTS"] == "1", "Set HAPPYHR_TEST_ACCOUNTS=1 with a local server"))
struct LiveAccount {
    let client = HappyHRClient(baseURL: apiURL ?? HappyHRClient.production)

    @Test func signInFavouritesAndDelete() async throws {
        let email = "swift-test-\(UUID().uuidString.prefix(8).lowercased())@example.com"
        let sent = try await client.requestCode(email: email.uppercased())
        let code = try #require(sent.devCode, "The server must run with DEV_SHOW_CODE=1")

        await #expect(throws: APIError.self) { try await client.verify(email: email, code: "000000", device: "test-device") }
        let signIn = try await client.verify(email: email, code: code, device: "test-device")
        #expect(signIn.account.email == email)
        #expect(try await client.me(token: signIn.token) == signIn.account)

        #expect(try await client.saveFavourites(["central", "bar-koukla", "central"], token: signIn.token).sorted() == ["bar-koukla", "central"])
        #expect(try await client.saveFavourites(["bar-koukla"], token: signIn.token) == ["bar-koukla"])
        #expect(try await client.favourites(token: signIn.token) == ["bar-koukla"])

        try await client.deleteAccount(token: signIn.token)
        await #expect(throws: APIError.rejected(status: 401, message: "Not signed in.")) { try await client.me(token: signIn.token) }
    }
}
