import Foundation

// Community updates: people add happy hours or daily specials and say whether
// a deal worked. A port of src/lib/community.ts. The server runs the same
// validation, so checking here first just saves a round trip.

public enum SubmissionKind: String, Codable, Hashable, Sendable {
    case happyHour = "happy-hour"
    case daily
}

/// POST /api/submissions.
public struct SubmissionInput: Codable, Hashable, Sendable {
    public var device: String
    public var kind: SubmissionKind?
    /// A daily special's name, e.g. "Taco Tuesday".
    public var title: String?
    /// A listed venue this adds to; nil for a new place.
    public var venueId: String?
    public var venueName: String
    public var address: String?
    public var lat: Double?
    public var lng: Double?
    public var days: [Weekday]
    /// Required for a happy hour; leave both nil for an all-day daily special.
    public var start: Int?
    public var end: Int?
    public var specials: [Special]
    public var note: String?
    /// A venue's own key: the deal then shows as "From the venue".
    public var venueKey: String?

    public init(
        device: String, kind: SubmissionKind? = nil, title: String? = nil, venueId: String? = nil, venueName: String, address: String? = nil,
        lat: Double? = nil, lng: Double? = nil, days: [Weekday], start: Int? = nil, end: Int? = nil, specials: [Special], note: String? = nil,
        venueKey: String? = nil
    ) {
        self.device = device
        self.kind = kind
        self.title = title
        self.venueId = venueId
        self.venueName = venueName
        self.address = address
        self.lat = lat
        self.lng = lng
        self.days = days
        self.start = start
        self.end = end
        self.specials = specials
        self.note = note
        self.venueKey = venueKey
    }
}

/// A stored submission, as GET /api/community returns it.
public struct CommunitySubmission: Codable, Hashable, Identifiable, Sendable {
    public var id: String
    public var kind: SubmissionKind?
    public var title: String?
    public var venueId: String?
    public var venueName: String
    public var address: String?
    public var lat: Double?
    public var lng: Double?
    public var days: [Weekday]
    public var start: Int?
    public var end: Int?
    public var specials: [Special]
    public var note: String?
    public var createdAt: String
    /// Posted by the venue itself (with its venue key).
    public var byVenue: Bool?
}

/// POST /api/claims: someone who runs a venue asks to manage its page.
public struct ClaimInput: Codable, Hashable, Sendable {
    public var device: String
    public var venueId: String
    public var name: String
    /// "Owner", "Manager"…
    public var role: String?
    /// An email address or phone number.
    public var contact: String
    public var message: String?

    public init(device: String, venueId: String, name: String, role: String? = nil, contact: String, message: String? = nil) {
        self.device = device
        self.venueId = venueId
        self.name = name
        self.role = role
        self.contact = contact
        self.message = message
    }
}

/// POST /api/votes. `worked` is optional only so a missing answer can be validated.
public struct VoteInput: Codable, Hashable, Sendable {
    public var device: String
    public var venueId: String
    public var worked: Bool?

    public init(device: String, venueId: String, worked: Bool?) {
        self.device = device
        self.venueId = venueId
        self.worked = worked
    }
}

/// Votes for one venue over the last 30 days.
public struct VoteTally: Codable, Hashable, Sendable {
    public var yes: Int
    public var no: Int
    public var lastYes: String?
    public var lastNo: String?

    public init(yes: Int, no: Int, lastYes: String?, lastNo: String?) {
        self.yes = yes
        self.no = no
        self.lastYes = lastYes
        self.lastNo = lastNo
    }
}

/// GET /api/community.
public struct CommunityData: Codable, Hashable, Sendable {
    public var submissions: [CommunitySubmission]
    public var votes: [String: VoteTally]

    public init(submissions: [CommunitySubmission] = [], votes: [String: VoteTally] = [:]) {
        self.submissions = submissions
        self.votes = votes
    }
}

public enum CommunityLimits {
    public static let name = 80
    public static let role = 40
    public static let contact = 120
    public static let title = 40
    public static let address = 120
    public static let item = 60
    public static let note = 280
    public static let specials = 6
    public static let price = 500.0
}

private func matches(_ text: String, _ pattern: String) -> Bool {
    text.range(of: pattern, options: .regularExpression) != nil
}

private func isMinute(_ m: Int?, max: Int) -> Bool {
    guard let m else { return false }
    return m >= 0 && m <= max
}

/// An error message to show, or nil when the submission is acceptable. With `areas`, a new
/// place must be in or near one of them.
public func validateSubmission(_ input: SubmissionInput, areas: [Area] = []) -> String? {
    if !matches(input.device, "^[A-Za-z0-9-]{8,64}$") { return "Missing device id." }
    if let venueId = input.venueId, !matches(venueId, "^[a-z0-9-]{1,80}$") { return "Unknown venue." }
    if let key = input.venueKey, !isVenueKey(key) || input.venueId == nil { return "That venue key doesn’t look right." }
    let name = input.venueName.trimmingCharacters(in: .whitespacesAndNewlines)
    if name.isEmpty || name.count > CommunityLimits.name { return "Add the venue’s name." }
    if input.venueId == nil {
        let address = (input.address ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if address.isEmpty || address.count > CommunityLimits.address { return "Add the venue’s street address." }
        if input.lat != nil || input.lng != nil {
            guard let lat = input.lat, let lng = input.lng else { return "Bad location." }
            let p = LatLng(lat: lat, lng: lng)
            if !areas.isEmpty && !areas.contains(where: { metersToRegion(p, $0.region) <= Areas.nearMeters }) {
                return "That address isn’t in one of our areas."
            }
        }
    }
    if input.days.isEmpty || !input.days.allSatisfy({ (0...6).contains($0) }) { return "Pick at least one day." }
    if Set(input.days).count != input.days.count { return "Each day can only be picked once." }
    let daily = input.kind == .daily
    if let title = input.title, title.count > CommunityLimits.title { return "The name is too long." }
    if !(daily && input.start == nil && input.end == nil) {
        guard isMinute(input.start, max: 24 * 60 - 1), isMinute(input.end, max: 30 * 60), let start = input.start, let end = input.end else {
            return "Pick a start and end time."
        }
        if end <= start { return "The end time must be after the start." }
        if !daily && end - start > 16 * 60 { return "That’s longer than a happy hour." }
    }
    if input.specials.isEmpty { return "Add at least one special." }
    if input.specials.count > CommunityLimits.specials { return "Up to \(CommunityLimits.specials) specials." }
    for s in input.specials {
        let item = s.item.trimmingCharacters(in: .whitespacesAndNewlines)
        if item.isEmpty || item.count > CommunityLimits.item { return "Describe each special." }
        if let price = s.price, !(price >= 0) || price > CommunityLimits.price { return "Check the prices." }
    }
    if let note = input.note, note.count > CommunityLimits.note { return "The note is too long." }
    return nil
}

/// "HHV-7K2M-QX9D-4FTW"; checked loosely so a mistyped key gets a clear answer from the server.
public func isVenueKey(_ key: String) -> Bool {
    key.range(of: "^[A-Za-z0-9-]{8,40}$", options: .regularExpression) != nil
}

public func validateClaim(_ input: ClaimInput) -> String? {
    if !matches(input.device, "^[A-Za-z0-9-]{8,64}$") { return "Missing device id." }
    if !matches(input.venueId, "^[a-z0-9-]{1,80}$") { return "Unknown venue." }
    let name = input.name.trimmingCharacters(in: .whitespacesAndNewlines)
    if name.isEmpty || name.count > CommunityLimits.name { return "Add your name." }
    if let role = input.role, role.count > CommunityLimits.role { return "Keep the role short." }
    let contact = input.contact.trimmingCharacters(in: .whitespacesAndNewlines)
    let email = matches(contact, #"^[^\s@]+@[^\s@]+\.[^\s@]+$"#)
    let phone = contact.filter { ("0"..."9").contains($0) }.count >= 10
    if contact.isEmpty || contact.count > CommunityLimits.contact || !(email || phone) { return "Add an email or phone number we can reach you at." }
    if let message = input.message, message.count > CommunityLimits.note { return "The message is too long." }
    return nil
}

public func validateVote(_ input: VoteInput) -> String? {
    if !matches(input.device, "^[A-Za-z0-9-]{8,64}$") { return "Missing device id." }
    if !matches(input.venueId, "^[a-z0-9-]{1,80}$") { return "Unknown venue." }
    if input.worked == nil { return "Say whether it worked." }
    return nil
}

/// Venue id for a place that only exists because of a submission.
public func communityVenueId(_ submissionId: String) -> String { "c-\(submissionId)" }

/// Adds community deals to the curated list: windows and daily specials on
/// listed venues are appended (never replacing the curated ones), and new
/// places become venues marked .community. Submissions for the same new place
/// (same name and address) are grouped into one venue.
public func mergeCommunity(_ venues: [Venue], _ submissions: [CommunitySubmission], fallback: LatLng, city: String = "Toronto") -> [Venue] {
    var merged = venues
    var index = Dictionary(uniqueKeysWithValues: venues.enumerated().map { ($1.id, $0) })
    var newPlaces: [String: Int] = [:]

    func add(_ s: CommunitySubmission, to i: Int) {
        let byVenue = s.byVenue == true
        let community = CommunityRef(id: s.id, createdAt: s.createdAt, byVenue: byVenue ? true : nil)
        let given = s.note?.isEmpty == false ? s.note : nil
        let note =
            byVenue
            ? given.map { "From \(merged[i].name): “\($0)”" } ?? "Posted by \(merged[i].name)."
            : given.map { "Community: “\($0)”" } ?? "Added by the community."
        if s.kind == .daily {
            let title = s.title?.trimmingCharacters(in: .whitespacesAndNewlines)
            let hours = s.start != nil && s.end != nil
            let special = DailySpecial(
                days: s.days, title: title?.isEmpty == false ? title : nil, specials: s.specials, start: hours ? s.start : nil,
                end: hours ? s.end : nil, note: note, community: community)
            merged[i].dailySpecials = merged[i].daily + [special]
        } else {
            merged[i].happyHours.append(
                HappyHourWindow(days: s.days, start: s.start ?? 0, end: s.end ?? 0, specials: s.specials, note: note, community: community))
        }
    }

    for s in submissions {
        if let venueId = s.venueId, let i = index[venueId] {
            add(s, to: i)
            // A spot with no researched deal is now known through the venue itself or the community.
            if s.byVenue == true && [.none, .community, .reported].contains(merged[i].deals) {
                merged[i].deals = .venue
            } else if merged[i].deals == .none {
                merged[i].deals = .community
            }
            continue
        }
        let key = "\(s.venueName.trimmingCharacters(in: .whitespaces).lowercased())|\((s.address ?? "").trimmingCharacters(in: .whitespaces).lowercased())"
        if let i = newPlaces[key] {
            add(s, to: i)
            continue
        }
        let query = "\(s.venueName), \(s.address ?? ""), \(city)".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let venue = Venue(
            id: communityVenueId(s.id), name: s.venueName.trimmingCharacters(in: .whitespaces), category: "Added by the community", vibe: .bar,
            address: (s.address ?? "").trimmingCharacters(in: .whitespaces), lat: s.lat ?? fallback.lat, lng: s.lng ?? fallback.lng,
            tags: ["Community"], deals: .community, googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=\(query)")
        merged.append(venue)
        let i = merged.count - 1
        index[venue.id] = i
        newPlaces[key] = i
        add(s, to: i)
    }
    return merged
}

/// The submissions that belong to an area: those for its listed spots, and new places inside
/// it (with later additions to them). New places sent before areas existed have no location
/// check beyond the area they were added in, so `legacy` areas (Ossington) keep those.
public func submissionsForArea(_ submissions: [CommunitySubmission], area: Area, venues: [Venue], legacy: Bool = false) -> [CommunitySubmission] {
    var ids = Set(venues.map(\.id))
    return submissions.filter { s in
        if let venueId = s.venueId { return ids.contains(venueId) }
        let here = if let lat = s.lat, let lng = s.lng { inArea(LatLng(lat: lat, lng: lng), area) } else { legacy }
        if here { ids.insert(communityVenueId(s.id)) }
        return here
    }
}

public enum VoteMood: String, Hashable, Sendable {
    case confirmed, disputed, none
}

/// A short, honest read of recent votes, e.g. "Worked for 3 people · last 2 days ago".
public func voteSummary(_ tally: VoteTally?, now: Date = Date()) -> (mood: VoteMood, text: String) {
    guard let tally, tally.yes + tally.no > 0 else { return (.none, "No check-ins yet") }
    let dayMs = 24.0 * 60 * 60 * 1000
    let parse = { (iso: String?) in iso.flatMap { ISO8601DateFormatter().date(from: $0) } }
    let ago = { (iso: String?) -> String in
        guard let date = parse(iso) else { return "" }
        let days = Int((now.timeIntervalSince(date) * 1000 / dayMs).rounded(.down))
        return days <= 0 ? "today" : days == 1 ? "yesterday" : "\(days) days ago"
    }
    let recentNo = parse(tally.lastNo).map { now.timeIntervalSince($0) * 1000 < 7 * dayMs } ?? false
    if tally.no > tally.yes && recentNo {
        return (.disputed, "\(tally.no) said it didn’t work · last \(ago(tally.lastNo))")
    }
    if tally.yes > 0 {
        let people = tally.yes == 1 ? "1 person" : "\(tally.yes) people"
        let doubts = tally.no > 0 ? " · \(tally.no) said it didn’t" : ""
        return (.confirmed, "Worked for \(people) · last \(ago(tally.lastYes))\(doubts)")
    }
    return (.disputed, "\(tally.no) said it didn’t work · last \(ago(tally.lastNo))")
}
