import Foundation
import Testing

@testable import HappyHRCore

// The v2 features (ios/PORTING-V2.md §4), checked against the answers the web
// app's TypeScript wrote to shared/fixtures. Helpers are in FixtureTests.swift.

private func items(at clock: Clock) -> [RankedVenue] { rankVenues(venues, at: clock, from: origin).all }
private func ranked(_ id: String, at clock: Clock) -> RankedVenue { items(at: clock).first { $0.venue.id == id }! }
private func instant(_ iso: String) -> Date {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f.date(from: iso) ?? ISO8601DateFormatter().date(from: iso)!
}

@Suite struct V2Models {
    @Test func decodesTheNewFields() {
        #expect(venues.filter { !($0.hours ?? []).isEmpty }.count == 81)
        #expect(venue("roxton-public-house").amenities?.contains(.sports) == true)
        #expect(venue("central").menuUrl != nil)
        #expect(venues.allSatisfy { $0.placeId != nil })
        #expect(venue("central").checked != nil)
    }
}

@Suite struct Hours {
    private struct File: Decodable {
        var openLate: [String: Bool]
        var week: [Week]
        var states: [StateCase]
        struct Week: Decodable {
            var venue: String
            var today: Int
            var rows: [Row]
        }
        struct Row: Decodable {
            var day: Int
            var text: String
        }
        struct StateCase: Decodable {
            var label: String
            var clock: Clock
            var venues: [String: Expected]
        }
        struct Expected: Decodable {
            var kind: String
            var closesAt: Int?
            var closesIn: Int?
            var opensAt: Int?
            var opensDay: Int?
            var opensIn: Int?
            var label: String
        }
    }

    @Test func matchesTheWebApp() throws {
        let f = try load("hours.json", as: File.self)
        for v in venues {
            #expect(isOpenLate(v) == (f.openLate[v.id] ?? false), "open late: \(v.id)")
        }
        for w in f.week {
            let rows = weekHours(venue(w.venue), today: w.today)
            #expect(rows.map(\.day) == w.rows.map(\.day))
            #expect(rows.map(\.text) == w.rows.map(\.text), "\(w.venue)")
        }
        for c in f.states {
            for (id, e) in c.venues {
                let state = openState(venue(id), at: c.clock)
                switch state {
                case .unknown:
                    Issue.record("\(c.label) \(id): expected \(e.kind), got unknown")
                case let .open(closesAt, closesIn):
                    #expect(e.kind == "open" && e.closesAt == closesAt && e.closesIn == closesIn, "\(c.label) \(id)")
                case let .closed(opensAt, opensDay, opensIn):
                    #expect(e.kind == "closed" && e.opensAt == opensAt && e.opensDay == opensDay && e.opensIn == opensIn, "\(c.label) \(id)")
                }
                #expect(openLabel(state, today: c.clock.day) == e.label, "\(c.label) \(id)")
            }
        }
    }
}

@Suite struct Vibes {
    private struct File: Decodable {
        var clock: Clock
        var ids: [String]
        var venues: [String: [String]]
        var search: [SearchCase]
        struct SearchCase: Decodable {
            var query: SearchQuery
            var results: [String]
        }
    }

    @Test func matchesTheWebApp() throws {
        let f = try load("vibes.json", as: File.self)
        #expect(VibeFilter.allCases.map(\.rawValue) == f.ids)
        for v in venues {
            #expect(venueVibes(v, at: f.clock).map(\.rawValue) == (f.venues[v.id] ?? []), "\(v.id)")
        }
        let all = items(at: f.clock)
        for c in f.search {
            let ids = searchVenues(all, c.query, at: f.clock, catalog: payload.foodTypes).map(\.id)
            #expect(ids == c.results, "\(c.query.places.map(\.rawValue))")
        }
    }
}

@Suite struct FreshnessCases {
    private struct File: Decodable {
        var cases: [Case]
        struct Case: Decodable {
            var name: String
            var venue: String
            var tally: VoteTally?
            var now: String
            var result: Freshness?
        }
    }

    @Test func matchesTheWebApp() throws {
        let f = try load("freshness.json", as: File.self)
        for c in f.cases {
            #expect(freshness(venue(c.venue), tally: c.tally, now: instant(c.now)) == c.result, "\(c.name)")
        }
    }
}

@Suite struct Drinks {
    private struct File: Decodable {
        var types: [Kind]
        var classify: [Classify]
        var serves: [String: [DrinkType]]
        struct Kind: Decodable {
            var id: String
            var label: String
            var emoji: String
        }
        struct Classify: Decodable {
            var special: Special
            var drinks: [DrinkType]
            var single: Double?
        }
    }

    @Test func matchesTheWebApp() throws {
        let f = try load("drinks.json", as: File.self)
        #expect(DrinkType.allCases.map(\.rawValue) == f.types.map(\.id))
        #expect(DrinkType.allCases.map(\.label) == f.types.map(\.label))
        #expect(DrinkType.allCases.map(\.emoji) == f.types.map(\.emoji))
        for c in f.classify {
            #expect(drinkTypesOf(c.special) == c.drinks, "\(c.special.item)")
            #expect(singlePrice(c.special) == c.single, "\(c.special.item)")
        }
        for v in venues {
            #expect(DrinkType.allCases.filter { servesDrink(v, $0) } == f.serves[v.id], "\(v.id)")
        }
    }
}

@Suite struct Sharing {
    private struct File: Decodable {
        var parse: [Parse]
        var links: [Link]
        var clock: Clock
        var venues: [VenueCase]
        struct Parse: Decodable {
            var search: String
            var link: Parsed
        }
        struct Parsed: Decodable {
            var venueId: String?
            var meet: Int?
            var venueKey: String?
            var areaId: String?
        }
        struct Link: Decodable {
            var base: String
            var venueId: String
            var meet: Int?
            var areaId: String?
            var url: String
        }
        struct VenueCase: Decodable {
            var venue: String
            var dealLine: String?
            var message: String
            var meetMessage: String
            var meetOptions: [Int]
            var preview: String
        }
    }

    @Test func matchesTheWebApp() throws {
        let f = try load("share.json", as: File.self)
        for p in f.parse {
            let link = parseLink(query: p.search)
            #expect(link == SharedLink(venueId: p.link.venueId, meet: p.link.meet, venueKey: p.link.venueKey, areaId: p.link.areaId), "\(p.search)")
        }
        for l in f.links {
            #expect(venueLink(base: URL(string: l.base)!, venueId: l.venueId, meet: l.meet, areaId: l.areaId).absoluteString == l.url)
        }
        for c in f.venues {
            let rv = ranked(c.venue, at: f.clock)
            #expect(dealLine(rv, at: f.clock) == c.dealLine, "\(c.venue)")
            #expect(shareMessage(rv, at: f.clock) == c.message, "\(c.venue)")
            #expect(shareMessage(rv, at: f.clock, meet: 1110) == c.meetMessage, "\(c.venue)")
            #expect(meetOptions(rv, at: f.clock) == c.meetOptions, "\(c.venue)")
            #expect(previewText(rv.venue) == c.preview, "\(c.venue)")
        }
    }
}

@Suite struct FavouriteCases {
    private struct File: Decodable {
        var ids: [String]
        var cases: [Case]
        struct Case: Decodable {
            var label: String
            var clock: Clock
            var lines: [Line]
            var startingSoon: [String]
        }
        struct Line: Decodable, Equatable {
            var venue: String
            var label: String
            var tone: String
        }
    }

    @Test func matchesTheWebApp() throws {
        let f = try load("favourites.json", as: File.self)
        for c in f.cases {
            let all = items(at: c.clock)
            let lines = favouriteLines(all, ids: f.ids, at: c.clock).map { File.Line(venue: $0.id, label: $0.label, tone: $0.tone.rawValue) }
            #expect(lines == c.lines, "\(c.label)")
            #expect(startingSoon(all, ids: f.ids).map(\.id) == c.startingSoon, "\(c.label)")
        }
    }
}

@Suite struct ReminderCases {
    private struct File: Decodable {
        var cases: [Case]
        struct Case: Decodable {
            var venue: String
            var kind: String
            var deal: Deal
            var plan: ReminderPlan
        }
        /// A happy-hour window or a daily special: the fields both share.
        struct Deal: Decodable {
            var days: [Weekday]
            var title: String?
            var start: Int?
            var end: Int?
            var specials: [Special]
            var note: String?
        }
    }

    @Test func plansMatchTheWebApp() throws {
        let f = try load("reminders.json", as: File.self)
        for c in f.cases {
            let v = venue(c.venue)
            let plan =
                c.kind == "daily"
                ? reminderPlan(v, daily: DailySpecial(days: c.deal.days, title: c.deal.title, specials: c.deal.specials, start: c.deal.start, end: c.deal.end))
                : reminderPlan(v, window: HappyHourWindow(days: c.deal.days, start: c.deal.start!, end: c.deal.end!, specials: c.deal.specials))
            #expect(plan == c.plan, "\(c.venue) \(c.kind)")
        }
    }

    @Test func alertsWrapAcrossDaysAndTheWeek() {
        let lateNight = ReminderPlan(title: "", detail: "", days: [6], start: 25 * 60, end: 26 * 60)
        #expect(reminderTimes(lateNight).map { [$0.day, $0.minutes] } == [[0, 45]])
        let justAfterMidnight = ReminderPlan(title: "", detail: "", days: [0], start: 5, end: 120)
        #expect(reminderTimes(justAfterMidnight).map { [$0.day, $0.minutes] } == [[6, 1430]])
        let allDay = ReminderPlan(title: "", detail: "", days: [2, 4])
        #expect(reminderTimes(allDay).map { [$0.day, $0.minutes] } == [[2, 720], [4, 720]])
    }
}

@Suite struct Claims {
    private struct File: Decodable {
        var claims: [Case]
        struct Case: Decodable {
            var name: String
            var input: ClaimInput
            var error: String?
        }
    }

    @Test func validationMatchesTheWebApp() throws {
        let f = try load("community.json", as: File.self)
        for c in f.claims {
            #expect(validateClaim(c.input) == c.error, "\(c.name)")
        }
    }

    @Test func venueKeysOnSubmissions() {
        let base = SubmissionInput(
            device: "device-12345678", venueId: "central", venueName: "Central", days: [2], start: 960, end: 1080,
            specials: [Special(kind: .drink, item: "pints", price: 6)])
        var keyed = base
        keyed.venueKey = "HHV-7K2M-QX9D-4FTW"
        #expect(validateSubmission(keyed) == nil)
        keyed.venueKey = "short"
        #expect(validateSubmission(keyed) == "That venue key doesn’t look right.")
        var newPlace = base
        newPlace.venueId = nil
        newPlace.address = "1 Ossington Ave"
        newPlace.venueKey = "HHV-7K2M-QX9D-4FTW"
        #expect(validateSubmission(newPlace) == "That venue key doesn’t look right.")
    }

    @Test func venuePostsShowAsFromTheVenue() {
        let post = CommunitySubmission(
            id: "v1", venueId: "union", venueName: "Union", days: [3], start: 960, end: 1080,
            specials: [Special(kind: .drink, item: "pints", price: 6)], note: "Patio's open", createdAt: "2026-10-27T17:00:00Z", byVenue: true)
        let quiet = CommunitySubmission(
            id: "v2", kind: .daily, venueId: "union", venueName: "Union", days: [4], specials: [Special(kind: .food, item: "frites", price: 8)],
            createdAt: "2026-10-27T18:00:00Z", byVenue: true)
        let union = mergeCommunity(venues, [post, quiet], fallback: origin).first { $0.id == "union" }!
        #expect(union.deals == .venue)
        #expect(union.happyHours.last?.note == "From Union: “Patio's open”")
        #expect(union.happyHours.last?.community?.byVenue == true)
        #expect(union.daily.last?.note == "Posted by Union.")
    }
}

@Suite struct ChatRules {
    private struct File: Decodable {
        var rules: [String]
        var messages: [Case]
        var names: [NameCase]
        struct Case: Decodable {
            var body: String
            var error: String?
        }
        struct NameCase: Decodable {
            var name: String
            var error: String?
        }
    }

    @Test func matchTheWebApp() throws {
        let f = try load("chat.json", as: File.self)
        #expect(chatRules == f.rules)
        for c in f.messages {
            #expect(validateChatMessage(c.body) == c.error, "\(c.body.prefix(30))")
        }
        for c in f.names {
            #expect(validateDisplayName(c.name) == c.error, "\(c.name)")
        }
    }
}
