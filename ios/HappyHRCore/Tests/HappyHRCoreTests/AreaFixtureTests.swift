import Foundation
import Testing

@testable import HappyHRCore

// Areas: which one someone is in, which spots belong to one, and which community posts it
// shows. The cases come from areas.json, written by the web app's TypeScript.

@Suite struct AreaFixtures {
    private struct File: Decodable {
        var areaAt: [AtCase]
        var inArea: [InCase]
        var submissionsForArea: ForArea
        struct AtCase: Decodable {
            var name: String
            var point: LatLng
            var area: String?
        }
        struct InCase: Decodable {
            var name: String
            var area: String
            var point: LatLng
            var inside: Bool
        }
        struct ForArea: Decodable {
            var submissions: [CommunitySubmission]
            var cases: [Case]
            struct Case: Decodable {
                var area: String
                var legacy: Bool
                /// "venues.json" (Ossington's listed spots) or "none".
                var venues: String
                var ids: [String]
            }
        }
    }

    private let areas = payload.areas ?? []
    private func area(_ id: String) -> Area { areas.first { $0.id == id }! }

    @Test func venuesJSONListsEveryArea() {
        #expect(areas.map(\.id).contains("ossington"))
        #expect(areas.count > 1)
        #expect(areas.allSatisfy { $0.region.count >= 3 })
    }

    @Test func areaAtMatchesTheWebApp() throws {
        let f = try load("areas.json", as: File.self)
        for c in f.areaAt { #expect(areaAt(c.point, areas)?.id == c.area, "\(c.name)") }
    }

    @Test func inAreaMatchesTheWebApp() throws {
        let f = try load("areas.json", as: File.self)
        for c in f.inArea { #expect(inArea(c.point, area(c.area)) == c.inside, "\(c.area): \(c.name)") }
    }

    @Test func submissionsForAreaMatchTheWebApp() throws {
        let f = try load("areas.json", as: File.self).submissionsForArea
        for c in f.cases {
            let listed = c.venues == "venues.json" ? venues : []
            let ids = submissionsForArea(f.submissions, area: area(c.area), venues: listed, legacy: c.legacy).map(\.id)
            #expect(ids == c.ids, "\(c.area)")
        }
    }
}
