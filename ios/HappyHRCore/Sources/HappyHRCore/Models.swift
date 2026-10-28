import Foundation

// The data model, matching the JSON from GET /api/venues (and the web app's
// src/lib/types.ts). See shared/api/openapi.yaml for the full contract.

/// 0 = Sunday … 6 = Saturday (like JavaScript's Date#getDay, not Calendar's 1…7).
public typealias Weekday = Int

public struct Special: Codable, Hashable, Sendable {
    public enum Kind: String, Codable, Hashable, Sendable {
        case drink, food
    }

    public var kind: Kind
    /// As written in the data ("pints"); shown through `formatItem` ("$6 Pints").
    public var item: String
    /// CAD.
    public var price: Double?

    public init(kind: Kind, item: String, price: Double? = nil) {
        self.kind = kind
        self.item = item
        self.price = price
    }
}

/// Marks a deal someone in the community added.
public struct CommunityRef: Codable, Hashable, Sendable {
    public var id: String
    public var createdAt: String
    /// Posted by the venue's own staff (with a venue key), not a member of the public.
    public var byVenue: Bool?

    public init(id: String, createdAt: String, byVenue: Bool? = nil) {
        self.id = id
        self.createdAt = createdAt
        self.byVenue = byVenue
    }
}

public struct HappyHourWindow: Codable, Hashable, Sendable {
    public var days: [Weekday]
    /// Minutes after midnight, Toronto time.
    public var start: Int
    /// Minutes after midnight of the start day; past 1440 runs into the next day.
    public var end: Int
    public var specials: [Special]
    public var note: String?
    public var community: CommunityRef?

    public init(days: [Weekday], start: Int, end: Int, specials: [Special], note: String? = nil, community: CommunityRef? = nil) {
        self.days = days
        self.start = start
        self.end = end
        self.specials = specials
        self.note = note
        self.community = community
    }
}

/// A deal tied to days of the week rather than a happy-hour window, e.g. a Tuesday burger.
/// Without `start`/`end` it runs whenever the venue is open.
public struct DailySpecial: Codable, Hashable, Sendable {
    public var days: [Weekday]
    /// e.g. "Taco Tuesday".
    public var title: String?
    public var specials: [Special]
    public var start: Int?
    public var end: Int?
    public var note: String?
    public var community: CommunityRef?

    public init(
        days: [Weekday], title: String? = nil, specials: [Special], start: Int? = nil, end: Int? = nil, note: String? = nil,
        community: CommunityRef? = nil
    ) {
        self.days = days
        self.title = title
        self.specials = specials
        self.start = start
        self.end = end
        self.note = note
        self.community = community
    }
}

public enum FoodType: String, Codable, CaseIterable, Hashable, Sendable {
    case pizza, pasta, tacos, burgers, wings, oysters, sushi, korean, vietnamese, thai, asian
    case middleEastern = "middle-eastern"
    case greek, french, spanish, steak, pub, vegan, diner, snacks
}

/// One stretch a venue is open: the day it opens, and minutes after midnight (a close past 1440 runs into the next day).
public struct OpenSpan: Codable, Hashable, Sendable {
    public var day: Weekday
    public var open: Int
    public var close: Int

    public init(day: Weekday, open: Int, close: Int) {
        self.day = day
        self.open = open
        self.close = close
    }
}

/// Amenities, for the vibe filters. "Open late", "Open now" and "Trivia" are worked out from hours and specials instead.
public enum Amenity: String, Codable, CaseIterable, Hashable, Sendable {
    case patio
    case liveMusic = "live-music"
    case sports, groups, dogs
}

public enum Vibe: String, Codable, Hashable, Sendable {
    case bar, brewery, wine, cocktails, restaurant, casual
}

/// Where a venue's deal details come from.
public enum DealProvenance: String, Codable, Hashable, Sendable {
    /// The venue's own website, menu or OpenTable listing.
    case venue
    /// A third-party guide or listing: unconfirmed.
    case reported
    /// Added by people using the app.
    case community
    /// Placeholder demo data.
    case sample
    /// No deals known yet.
    case none
}

public struct DealSource: Codable, Hashable, Sendable {
    public var label: String
    public var url: String
    /// "2026-09", "2025-10-14" or "undated".
    public var date: String
}

public struct Booking: Codable, Hashable, Sendable {
    public enum Provider: String, Codable, Hashable, Sendable {
        case opentable, resy, google
    }

    public var provider: Provider
    public var url: String
}

public struct LatLng: Codable, Hashable, Sendable {
    public var lat: Double
    public var lng: Double

    public init(lat: Double, lng: Double) {
        self.lat = lat
        self.lng = lng
    }
}

public struct Venue: Codable, Hashable, Identifiable, Sendable {
    public var id: String
    public var name: String
    public var category: String
    public var vibe: Vibe
    public var address: String
    public var lat: Double
    public var lng: Double
    public var tags: [String]
    /// Other names people search for ("Black Swan" for Blk Swan). Search only; never shown.
    public var aka: [String]?
    /// Empty when no happy hour is known; the venue is still listed.
    public var happyHours: [HappyHourWindow]
    public var dailySpecials: [DailySpecial]?
    public var food: [FoodType]?
    /// Opening hours; absent when unknown.
    public var hours: [OpenSpan]?
    public var amenities: [Amenity]?
    /// Google Places id (the web uses it for photos).
    public var placeId: String?
    public var menuUrl: String?
    /// When the deals were last checked by us, e.g. "2026-10-26".
    public var checked: String?
    public var deals: DealProvenance
    public var sources: [DealSource]?
    /// Display format, e.g. "(416) 532-8000".
    public var phone: String?
    public var website: String?
    public var googleMapsUrl: String?
    public var booking: Booking?

    public var location: LatLng { LatLng(lat: lat, lng: lng) }
    public var daily: [DailySpecial] { dailySpecials ?? [] }

    public init(
        id: String, name: String, category: String, vibe: Vibe, address: String, lat: Double, lng: Double, tags: [String] = [],
        happyHours: [HappyHourWindow] = [], dailySpecials: [DailySpecial]? = nil, food: [FoodType]? = nil, hours: [OpenSpan]? = nil,
        amenities: [Amenity]? = nil, placeId: String? = nil, menuUrl: String? = nil, checked: String? = nil, deals: DealProvenance,
        sources: [DealSource]? = nil, phone: String? = nil, website: String? = nil, googleMapsUrl: String? = nil, booking: Booking? = nil
    ) {
        self.id = id
        self.name = name
        self.category = category
        self.vibe = vibe
        self.address = address
        self.lat = lat
        self.lng = lng
        self.tags = tags
        self.happyHours = happyHours
        self.dailySpecials = dailySpecials
        self.food = food
        self.hours = hours
        self.amenities = amenities
        self.placeId = placeId
        self.menuUrl = menuUrl
        self.checked = checked
        self.deals = deals
        self.sources = sources
        self.phone = phone
        self.website = website
        self.googleMapsUrl = googleMapsUrl
        self.booking = booking
    }
}

public struct Area: Codable, Hashable, Sendable {
    public struct Origin: Codable, Hashable, Sendable {
        public var lat: Double
        public var lng: Double
        /// e.g. "Ossington & Dundas".
        public var label: String

        public var location: LatLng { LatLng(lat: lat, lng: lng) }
    }

    public struct Bounds: Codable, Hashable, Sendable {
        public var south: Double
        public var west: Double
        public var north: Double
        public var east: Double
    }

    public var id: String
    public var name: String
    public var city: String
    public var center: LatLng
    /// Where walking times start when the person's location is unknown or far away.
    public var origin: Origin
    /// Two points along the main street, south to north.
    public var spine: [LatLng]
    /// Map rotation in degrees that runs the main street straight up the screen.
    public var bearing: Double
    /// The corners the map frames when the area opens (downtown, for a city).
    public var bounds: Bounds
    /// The area's outline: which spots belong to it, and which area someone is in.
    /// Empty in payloads from before areas.
    public var region: [LatLng]
    /// For a whole city: only places whose address is in this city count.
    public var addressCity: String?
    /// What the list covers, after "in": "Kensington Market, from Bathurst to Spadina…".
    public var covers: String?

    /// The city to look addresses up in.
    public var lookupCity: String { addressCity ?? city }

    public init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
        city = try c.decode(String.self, forKey: .city)
        center = try c.decode(LatLng.self, forKey: .center)
        origin = try c.decode(Origin.self, forKey: .origin)
        spine = try c.decode([LatLng].self, forKey: .spine)
        bearing = try c.decode(Double.self, forKey: .bearing)
        bounds = try c.decode(Bounds.self, forKey: .bounds)
        region = try c.decodeIfPresent([LatLng].self, forKey: .region) ?? []
        addressCity = try c.decodeIfPresent(String.self, forKey: .addressCity)
        covers = try c.decodeIfPresent(String.self, forKey: .covers)
    }
}

/// What a food type is called, its emoji, and the words that count as a mention.
public struct FoodTypeInfo: Codable, Hashable, Identifiable, Sendable {
    public var id: FoodType
    public var label: String
    public var emoji: String
    public var words: [String]
}

/// GET /api/venues.
public struct VenuesPayload: Codable, Hashable, Sendable {
    /// A bump means this app is too old to read the payload.
    public var schemaVersion: Int
    /// Changes whenever any venue or deal changes; also the ETag. Absent in the test fixtures.
    public var version: String?
    public var area: Area
    /// Every area, for the area menu and for working out where someone is. Absent before areas.
    public var areas: [Area]?
    public var foodTypes: [FoodTypeInfo]
    public var venues: [Venue]

    /// The newest payload layout this build understands.
    public static let supportedSchemaVersion = 1
}
