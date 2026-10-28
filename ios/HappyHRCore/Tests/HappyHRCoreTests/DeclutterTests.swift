import Foundation
import Testing

@testable import HappyHRCore

// Map label placement (Declutter.swift). The web app has no fixtures for this
// yet, so these check the port's behaviour directly.

@Suite struct Declutter {
    private let here = LatLng(lat: 43.6496, lng: -79.4209)
    private let worldSize = 256 * pow(2.0, 17.0)

    @Test func projectsTheWorldCorners() {
        let p = project(LatLng(lat: 0, lng: -180), worldSize: 256)
        #expect(abs(p.x) < 1e-9 && abs(p.y - 128) < 1e-9)
    }

    @Test func rotationKeepsDistances() {
        let a = toScreen(here, worldSize: worldSize, bearing: 0)
        let b = toScreen(LatLng(lat: 43.645, lng: -79.42), worldSize: worldSize, bearing: 0)
        let ra = toScreen(here, worldSize: worldSize, bearing: -14.4)
        let rb = toScreen(LatLng(lat: 43.645, lng: -79.42), worldSize: worldSize, bearing: -14.4)
        #expect(abs(hypot(a.x - b.x, a.y - b.y) - hypot(ra.x - rb.x, ra.y - rb.y)) < 1e-6)
    }

    @Test func unprojectsWhatItProjects() {
        let back = unproject(project(here, worldSize: worldSize), worldSize: worldSize)
        #expect(abs(back.lat - here.lat) < 1e-9 && abs(back.lng - here.lng) < 1e-9)
    }

    @Test func centersWithAnOffset() {
        // Moving the centre so `here` shows 100 points above the middle of a map rotated -14.4°.
        let bearing = -14.4
        let center = centerFor(here, dx: 0, dy: -100, worldSize: worldSize, bearing: bearing)
        let c = toScreen(center, worldSize: worldSize, bearing: bearing)
        let h = toScreen(here, worldSize: worldSize, bearing: bearing)
        #expect(abs(h.x - c.x) < 1e-6 && abs(h.y - c.y + 100) < 1e-6)
    }

    @Test func labelsTakeTheOtherSideThenDrop() {
        let requests = ["a", "b", "c"].map { LabelRequest(id: $0, point: here, text: "$5 pints", preferred: .right) }
        let sides = placeLabels(requests, dots: [], worldSize: worldSize)
        #expect(sides == ["a": .right, "b": .left])
    }

    @Test func dotsBlockLabels() {
        // A dot just right of the pin pushes the label to the left.
        let p = toScreen(here, worldSize: worldSize, bearing: 0)
        let world = ScreenPoint(x: p.x + 30, y: p.y)
        let lng = world.x / worldSize * 360 - 180
        let dot = LatLng(lat: here.lat, lng: lng)
        let sides = placeLabels([LabelRequest(id: "a", point: here, text: "9 PM", preferred: .right)], dots: [dot], worldSize: worldSize)
        #expect(sides == ["a": .left])
    }

    @Test func sidesOfTheStreet() {
        let spine = [LatLng(lat: 43.6435, lng: -79.4194), LatLng(lat: 43.6496, lng: -79.4220)]
        #expect(sideOfLine(LatLng(lat: 43.646, lng: -79.4215), spine) == .left)
        #expect(sideOfLine(LatLng(lat: 43.646, lng: -79.4195), spine) == .right)
    }
}
