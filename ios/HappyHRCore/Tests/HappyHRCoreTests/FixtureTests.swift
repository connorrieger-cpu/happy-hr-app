import Foundation
import Testing

@testable import HappyHRCore

// Checks the Swift port against the golden cases the web app's TypeScript
// writes to shared/fixtures (`npm run shared` in web/). If the web logic
// changes, regenerate the fixtures and these tests show what to port.

let fixtures = URL(fileURLWithPath: #filePath)
    .deletingLastPathComponent()  // HappyHRCoreTests
    .deletingLastPathComponent()  // Tests
    .deletingLastPathComponent()  // HappyHRCore
    .deletingLastPathComponent()  // ios
    .deletingLastPathComponent()  // repo root
    .appendingPathComponent("shared/fixtures")

func load<T: Decodable>(_ name: String, as _: T.Type = T.self) throws -> T {
    try JSONDecoder().decode(T.self, from: Data(contentsOf: fixtures.appendingPathComponent(name)))
}

let payload = try! load("venues.json", as: VenuesPayload.self)
let venues = payload.venues
let origin = payload.area.origin.location
func venue(_ id: String) -> Venue { venues.first { $0.id == id }! }

private struct LabeledClock: Decodable {
    var label: String
    var clock: Clock
}

@Suite struct VenueData {
    @Test func decodes() {
        #expect(payload.schemaVersion == 1)
        #expect(venues.count == 84)
        #expect(payload.area.name == "Ossington")
        #expect(payload.foodTypes.count == FoodType.allCases.count)
        #expect(venue("roxton-public-house").daily.count == 4)
    }
}

@Suite struct Status {
    private struct Expected: Decodable {
        var kind: String
        var minutesLeft: Int?
        var endsAt: Int?
        var progress: Double?
        var startsIn: Int?
        var startsAt: Int?
        var next: Next?
        struct Next: Decodable {
            var day: Int
            var startsAt: Int
        }
    }

    private struct Case: Decodable {
        var label: String
        var clock: Clock
        var statuses: [String: Expected]
    }

    @Test func matchesTheWebApp() throws {
        for c in try load("status.json", as: [Case].self) {
            for (id, expected) in c.statuses {
                let status = venueStatus(venue(id), at: c.clock)
                #expect(status.kind.rawValue == expected.kind, "\(c.label) \(id)")
                switch status {
                case let .live(_, minutesLeft, endsAt, progress):
                    #expect(minutesLeft == expected.minutesLeft && endsAt == expected.endsAt, "\(c.label) \(id)")
                    #expect(abs(progress - (expected.progress ?? -1)) < 0.0001, "\(c.label) \(id)")
                case let .soon(_, startsIn, startsAt), let .later(_, startsIn, startsAt):
                    #expect(startsIn == expected.startsIn && startsAt == expected.startsAt, "\(c.label) \(id)")
                case let .none(next):
                    #expect(next?.day == expected.next?.day && next?.startsAt == expected.next?.startsAt, "\(c.label) \(id)")
                }
            }
        }
    }

    @Test func torontoClockFromInstants() throws {
        struct Case: Decodable {
            var instant: String
            var clock: Clock
        }
        for c in try load("clock.json", as: [Case].self) {
            let date = ISO8601DateFormatter().date(from: c.instant)!
            #expect(Clock(date) == c.clock, "\(c.instant)")
        }
    }
}

@Suite struct Ranking {
    private struct Case: Decodable {
        var label: String
        var clock: Clock
        var filter: String
        var live, soon, later, rest, unlisted: [String]
    }

    @Test func matchesTheWebApp() throws {
        for c in try load("rank.json", as: [Case].self) {
            let r = rankVenues(venues, at: c.clock, from: origin, filter: DealFilter(rawValue: c.filter)!)
            let ids = { (items: [RankedVenue]) in items.map(\.venue.id) }
            let where_ = "\(c.label) \(c.filter)"
            #expect(ids(r.live) == c.live, "\(where_) live")
            #expect(ids(r.soon) == c.soon, "\(where_) soon")
            #expect(ids(r.later) == c.later, "\(where_) later")
            #expect(ids(r.rest) == c.rest, "\(where_) rest")
            #expect(ids(r.unlisted) == c.unlisted, "\(where_) unlisted")
        }
    }
}

@Suite struct DailySpecials {
    private struct Entry: Decodable, Equatable {
        var venue: String
        var label: String
        var hours: String
    }

    private struct Day: Decodable {
        var day: Int
        var label: String
        var entries: [Entry]
    }

    private struct Case: Decodable {
        var label: String
        var clock: Clock
        var todayLabels: [String: String]
        var board: Board
        struct Board: Decodable {
            var today: [Entry]
            var week: [Day]
        }
    }

    @Test func matchesTheWebApp() throws {
        for c in try load("daily.json", as: [Case].self) {
            var labels: [String: String] = [:]
            for v in venues { if let d = dailyToday(v, at: c.clock) { labels[v.id] = dailyLabel(d) } }
            #expect(labels == c.todayLabels, "\(c.label) today labels")

            let items = rankVenues(venues, at: c.clock, from: origin, filter: .daily).all
            let board = dailyBoard(items, at: c.clock)
            let entry = { (e: DailyEntry) in Entry(venue: e.ranked.venue.id, label: dailyLabel(e.special), hours: dailyHours(e.special)) }
            #expect(board.today.map(entry) == c.board.today, "\(c.label) board today")
            #expect(board.week.map(\.day) == c.board.week.map(\.day), "\(c.label) board days")
            for (got, want) in zip(board.week, c.board.week) {
                #expect(got.label == want.label && got.entries.map(entry) == want.entries, "\(c.label) \(want.label)")
            }
        }
    }
}

@Suite struct Search {
    private struct Deal: Decodable, Equatable {
        var item: String
        var price: Double
        var on: Bool
        var when: String
    }

    private struct Result: Decodable, Equatable {
        var venue: String
        var note: String?
        var on: Bool
        var deal: Deal?
    }

    private struct Case: Decodable {
        var query: SearchQuery
        var results: [Result]
    }

    private struct File: Decodable {
        var label: String
        var clock: Clock
        var words: [Words]
        var distance: [Distance]
        var matches: [Match]
        var concepts: [Concepts]
        var browse: [String: [Option]]
        var cases: [Case]
        struct Words: Decodable {
            var text: String
            var words: [String]
        }
        struct Distance: Decodable {
            var a: String
            var b: String
            var distance: Int
        }
        struct Match: Decodable {
            var term: String
            var word: String
            var typos: Bool
            var matches: Bool
        }
        struct Concepts: Decodable {
            var term: String
            var tokens: [SearchToken]
        }
        struct Option: Decodable, Equatable {
            var token: SearchToken
            var count: Int
        }
    }

    @Test func wordsMatchTheWebApp() throws {
        let file = try load("search.json", as: File.self)
        for c in file.words { #expect(searchWords(c.text) == c.words, "\(c.text)") }
        for c in file.distance { #expect(editDistance(c.a, c.b) == c.distance, "\(c.a) \(c.b)") }
        for c in file.matches { #expect(wordMatches(c.term, c.word, typos: c.typos) == c.matches, "\(c.term) \(c.word) \(c.typos)") }
        for c in file.concepts { #expect(conceptsFor(c.term, catalog: payload.foodTypes) == c.tokens, "\(c.term)") }
    }

    @Test func browseTilesMatchTheWebApp() throws {
        let file = try load("search.json", as: File.self)
        let items = rankVenues(venues, at: file.clock, from: origin).all
        let got = browseOptions(items, at: file.clock, catalog: payload.foodTypes)
        let option = { (o: BrowseOption) in File.Option(token: o.token, count: o.count) }
        #expect(got.drinks.map(option) == file.browse["drinks"])
        #expect(got.food.map(option) == file.browse["food"])
        #expect(got.places.map(option) == file.browse["places"])
    }

    @Test func matchesTheWebApp() throws {
        let file = try load("search.json", as: File.self)
        let items = rankVenues(venues, at: file.clock, from: origin).all
        for c in file.cases {
            let got = searchVenues(items, c.query, at: file.clock, catalog: payload.foodTypes).map {
                Result(
                    venue: $0.ranked.venue.id, note: $0.note, on: $0.on,
                    deal: $0.deal.map { Deal(item: $0.special.item, price: $0.price, on: $0.on, when: $0.when) })
            }
            #expect(got == c.results, "\(c.query)")
        }
    }

    @Test func foodTypesMatchTheWebApp() throws {
        struct File: Decodable {
            var serves: [String: [FoodType]]
        }
        let file = try load("food.json", as: File.self)
        for v in venues {
            #expect(payload.foodTypes.filter { servesFood(v, $0) }.map(\.id) == file.serves[v.id], "\(v.id)")
        }
    }
}

@Suite struct Formatting {
    private struct File: Decodable {
        var time: [Time]
        var range: [Range]
        var duration: [Duration]
        var days: [Days]
        var special: [SpecialCase]
        var item: [ItemCase]
        var pinLabel: [Pin]
        var distance: [Distance]
        struct Time: Decodable {
            var minutes: Int
            var full: String
            var compact: String
        }
        struct Range: Decodable {
            var start: Int
            var end: Int
            var text: String
        }
        struct Duration: Decodable {
            var minutes: Int
            var text: String
        }
        struct Days: Decodable {
            var days: [Int]
            var text: String
        }
        struct SpecialCase: Decodable {
            var special: Special
            var text: String
        }
        struct ItemCase: Decodable {
            var item: String
            var text: String
        }
        struct Pin: Decodable {
            var specials: [Special]
            var text: String?
        }
        struct Distance: Decodable {
            var meters: Double
            var text: String
        }
    }

    @Test func matchesTheWebApp() throws {
        let f = try load("format.json", as: File.self)
        for c in f.time {
            #expect(formatTime(c.minutes) == c.full)
            #expect(formatTime(c.minutes, compact: true) == c.compact)
        }
        for c in f.range { #expect(formatRange(start: c.start, end: c.end) == c.text) }
        for c in f.duration { #expect(formatDuration(c.minutes) == c.text) }
        for c in f.days { #expect(formatDays(c.days) == c.text) }
        for c in f.special { #expect(formatSpecial(c.special) == c.text) }
        for c in f.item { #expect(formatItem(c.item) == c.text, "\(c.item)") }
        for c in f.pinLabel { #expect(pinLabel(HappyHourWindow(days: [1], start: 0, end: 60, specials: c.specials)) == c.text) }
        for c in f.distance { #expect(formatDistance(c.meters) == c.text) }
    }

    @Test func distancesMatchTheWebApp() throws {
        struct Case: Decodable {
            var from: LatLng
            var to: LatLng
            var meters: Double
            var walkMinutes: Int
        }
        for c in try load("geo.json", as: [Case].self) {
            let m = distanceMeters(c.from, c.to)
            #expect(abs(m - c.meters) < 0.01)
            #expect(walkMinutes(m) == c.walkMinutes)
        }
    }
}

@Suite struct Community {
    private struct File: Decodable {
        var submissions: [Sub]
        var votes: [Vote]
        var voteSummary: Summary
        struct Sub: Decodable {
            var name: String
            var input: SubmissionInput
            var error: String?
        }
        struct Vote: Decodable {
            var name: String
            var input: VoteInput
            var error: String?
        }
        struct Summary: Decodable {
            var now: String
            var cases: [SummaryCase]
        }
        struct SummaryCase: Decodable {
            var name: String
            var tally: VoteTally?
            var mood: String
            var text: String
        }
    }

    @Test func validationMatchesTheWebApp() throws {
        let f = try load("community.json", as: File.self)
        // Checked against every area, as the web does.
        for c in f.submissions { #expect(validateSubmission(c.input, areas: payload.areas ?? []) == c.error, "\(c.name)") }
        for c in f.votes { #expect(validateVote(c.input) == c.error, "\(c.name)") }
        let now = ISO8601DateFormatter().date(from: f.voteSummary.now.replacingOccurrences(of: ".000Z", with: "Z"))!
        for c in f.voteSummary.cases {
            let summary = voteSummary(c.tally, now: now)
            #expect(summary.mood.rawValue == c.mood && summary.text == c.text, "\(c.name)")
        }
    }

    @Test func mergesDailySpecialsAndNewPlaces() {
        let daily = CommunitySubmission(
            id: "abc", kind: .daily, title: "Steak Night", venueId: "union", venueName: "Union", days: [5],
            specials: [Special(kind: .food, item: "steak frites", price: 20)], createdAt: "2026-10-26T17:00:00Z")
        let newPlace = CommunitySubmission(
            id: "new1", venueName: "Bar Raval", address: "505 College St", lat: 43.6557, lng: -79.4101, days: [2], start: 960, end: 1080,
            specials: [Special(kind: .drink, item: "cava", price: 8)], createdAt: "2026-10-26T18:00:00Z")
        let merged = mergeCommunity(venues, [daily, newPlace], fallback: origin)
        let union = merged.first { $0.id == "union" }!
        #expect(union.deals == .community)
        #expect(union.happyHours.isEmpty)
        #expect(union.daily.first?.title == "Steak Night" && union.daily.first?.start == nil)
        let raval = merged.first { $0.id == "c-new1" }!
        #expect(raval.happyHours.count == 1 && raval.deals == .community)
        #expect(venue("union").deals == .none)
    }
}

@Suite struct Caching {
    @Test func savesAndLoadsTheVenueList() throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("happyhr-\(UUID().uuidString)")
        defer { try? FileManager.default.removeItem(at: dir) }
        let cache = VenueCache(directory: dir)
        #expect(cache.load() == nil)
        try cache.save(raw: Data(contentsOf: fixtures.appendingPathComponent("venues.json")), etag: "\"abc\"")
        let loaded = try #require(cache.load())
        #expect(loaded.etag == "\"abc\"" && loaded.payload == payload)
    }

    @Test func dropsTheOldReencodedCache() throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("happyhr-\(UUID().uuidString)")
        defer { try? FileManager.default.removeItem(at: dir) }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let old = dir.appendingPathComponent("venues-cache.json")
        try Data(#"{"etag":"W/\"x\"","payload":{}}"#.utf8).write(to: old)
        let cache = VenueCache(directory: dir)
        #expect(cache.load() == nil)
        #expect(!FileManager.default.fileExists(atPath: old.path))
    }

    @Test func decodesServerErrors() throws {
        let data = Data(#"{"submissions":[{"id":"x","kind":"daily","venueId":"union","venueName":"Union","days":[2],"specials":[{"kind":"food","item":"frites","price":5}],"createdAt":"2026-10-26T21:37:01Z"}],"votes":{"central":{"yes":1,"no":0,"lastYes":"2026-10-26T18:09:01Z","lastNo":null}}}"#.utf8)
        let community = try JSONDecoder().decode(CommunityData.self, from: data)
        #expect(community.submissions.first?.kind == .daily && community.submissions.first?.start == nil)
        #expect(community.votes["central"]?.yes == 1)
    }
}
