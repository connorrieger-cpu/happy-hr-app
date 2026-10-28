import Foundation
import Testing

@testable import HappyHRCore

// Usage counts: the rough square a point falls in, which squares count as squares, and the
// owner's labels. The cases come from usage.json, written by the web app's TypeScript.

@Suite struct UsageFixtures {
    private struct File: Decodable {
        var fine: CellSize
        var coarse: CellSize
        var cells: [CellCase]
        var parse: [ParseCase]
        var labels: [LabelCase]
        struct CellCase: Decodable {
            var name: String
            var point: LatLng
            var cell: String
        }
        struct ParseCase: Decodable {
            var key: String
            var cell: LatLng?
        }
        struct LabelCase: Decodable {
            var name: String
            var label: String
        }
    }

    private let areas = payload.areas ?? []

    @Test func sizesMatch() throws {
        let f = try load("usage.json", as: File.self)
        #expect(f.fine == fineCell)
        #expect(f.coarse == coarseCell)
    }

    @Test func cellsMatchTheWebApp() throws {
        for c in try load("usage.json", as: File.self).cells {
            #expect(cellKey(usageCell(c.point, areas)) == c.cell, "\(c.name)")
        }
    }

    @Test func parsingMatchesTheWebApp() throws {
        for c in try load("usage.json", as: File.self).parse {
            #expect(parseCell(c.key) == c.cell, "\(c.key)")
        }
    }

    @Test func labelsMatchTheWebApp() throws {
        for c in try load("usage.json", as: File.self).labels {
            #expect(eventLabel(c.name) == c.label, "\(c.name)")
            #expect(isEventName(c.name))
        }
        #expect(!isEventName("Open App"))
    }
}
