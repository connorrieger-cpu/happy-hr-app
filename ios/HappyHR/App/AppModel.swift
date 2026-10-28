import ActivityKit
import AuthenticationServices
import CoreLocation
import CryptoKit
import Foundation
import HappyHRCore
import MapKit
import Observation
import WidgetKit

/// The app's state: the area on screen and its venue list (cached, refreshed from the API),
/// community deals and check-ins, the time, where the person is, and what's on screen.
/// All deal logic lives in HappyHRCore, shared with (and tested against) the web app.
@Observable
final class AppModel {
    /// The area on screen ("ossington", "guelph"…), remembered between launches.
    private(set) var areaID = SharedStore.areaID {
        didSet { SharedStore.areaID = areaID }
    }
    /// Set once this launch's area is decided: from a link, the menu, or (once) where the person is.
    @ObservationIgnored private var areaSettled = false
    private(set) var payload: VenuesPayload? {
        didSet { dataVersion += 1 }
    }
    private(set) var community = CommunityData() {
        didSet { dataVersion += 1 }
    }
    /// Bumped when the venue data changes (the list, community deals, the demo switch), so the
    /// merged and ranked lists below are worked out once per change, not on every redraw.
    private(set) var dataVersion = 0
    @ObservationIgnored private var venuesCache: (version: Int, venues: [Venue])?
    @ObservationIgnored private var rankCache: [RankKey: RightNow] = [:]

    private struct RankKey: Hashable {
        var version: Int
        var clock: TorontoClock
        var origin: LatLng
        var filter: DealFilter
    }
    /// False when the community API can't be reached (deals still show from the cache).
    private(set) var communityAvailable = false
    private(set) var problem: String?

    /// Toronto time, ticking every 30 seconds.
    private(set) var now = TorontoClock.now
    /// A day and time picked with the clock button, to see what's on then (the web's "Preview a time").
    var preview: TorontoClock?
    /// The time the app shows: the preview while there is one, else now.
    var clock: TorontoClock { preview ?? now }
    /// Demo data: every venue with sample deals, to show the app at its busiest (as on the web).
    /// Only Ossington has demo data; see `demoing`.
    var demo = UserDefaults.standard.bool(forKey: "demoData") {
        didSet {
            UserDefaults.standard.set(demo, forKey: "demoData")
            selectedVenueID = nil
            dataVersion += 1
        }
    }
    /// A short message under the top bar, e.g. location help.
    private(set) var notice: Notice?
    /// Bumped to fit the area on the map again.
    private(set) var frameRequest = 0
    /// Starred venue ids. Kept on the phone, and in the account once signed in.
    private(set) var favourites = Set(UserDefaults.standard.stringArray(forKey: "favourites") ?? [])
    /// Signed in with an emailed code, so favourites follow the person. Nil when signed out.
    private(set) var account: Account?
    var showAccount = false {
        didSet { if showAccount, !oldValue { track("account") } }
    }
    /// The group chat: one room everyone can read; signed-in people can post.
    var showChat = false {
        didSet { if showChat, !oldValue { track("chat") } }
    }
    private(set) var chatMessages: [ChatMessage] = []
    /// New messages since the chat was last open (a dot on the chat button).
    private(set) var chatUnread = false
    @ObservationIgnored private var lastSeenChatID = UserDefaults.standard.integer(forKey: "lastSeenChatID") {
        didSet { UserDefaults.standard.set(lastSeenChatID, forKey: "lastSeenChatID") }
    }
    var filter: DealFilter = .all {
        didSet { if filter != oldValue, filter != .all { track("filter:\(filter.rawValue)") } }
    }
    var selectedVenueID: String? {
        didSet { if let selectedVenueID, selectedVenueID != oldValue { track("venue") } }
    }
    var showSearch = false {
        didSet { if showSearch, !oldValue { track("search") } }
    }
    var showTimePreview = false {
        didSet { if showTimePreview, !oldValue { track("time-preview") } }
    }
    var contribute: ContributeTarget? {
        didSet { if contribute != nil, oldValue == nil { track("contribute") } }
    }
    /// Search: words typed, tiles picked (drinks, food, places), when, and the sort. Kept while search is closed.
    var searchQuery = SearchQuery() {
        didSet { countSearch(from: oldValue) }
    }
    /// A meeting time from a shared link ("Meet at Manita at 5:30?"), shown on that venue only.
    var meet: Meet?
    /// The venue being shared or claimed (drives those sheets).
    var sharingID: String? {
        didSet { if sharingID != nil, oldValue == nil { track("share") } }
    }
    var claiming: Venue? {
        didSet { if claiming != nil, oldValue == nil { track("claim") } }
    }
    var showVenueKey = false
    /// A favourite's happy hour about to start ("⭐ Manita: happy hour starts at 3 PM"); tapping opens it.
    private(set) var headsUp: HeadsUp?
    /// The venues this phone manages (venueId → key), from a venue key the owner sent.
    private(set) var venueKeys = VenueKeyStore.load()
    let reminders = Reminders()
    /// Alerts before each favourite's deals (the switch in the area menu). On unless turned off.
    var favouriteAlerts = UserDefaults.standard.object(forKey: "favouriteAlerts") as? Bool ?? true {
        didSet {
            UserDefaults.standard.set(favouriteAlerts, forKey: "favouriteAlerts")
            syncFavouriteAlerts()
        }
    }
    @ObservationIgnored private var alertsSync: Task<Void, Never>?
    /// The venue whose happy hour is counting down on the Lock Screen, if any.
    private(set) var liveActivityVenueID: String? = Activity<HappyHourAttributes>.activities.first?.attributes.venueID

    let location = LocationService()
    let device = DeviceID.current

    private let client = HappyHRClient(baseURL: AppModel.apiBase)
    private var session: SignIn? {
        didSet {
            account = session?.account
            if oldValue == nil, session != nil { track("sign-in") }
        }
    }
    /// Anonymous usage counts for the owner (UsageTracker.swift).
    @ObservationIgnored private let usage = UsageTracker()
    @ObservationIgnored private var lastOpenCounted: Date?
    /// The owner password, once entered on this phone: unlocks the Usage screen.
    private(set) var ownerToken = OwnerStore.load()
    /// The owner's sheet: the Usage screen, or the owner password first.
    var showUsage = false
    /// Bumped on every star or unstar, so a sync that started earlier doesn't undo it.
    private var favouritesVersion = 0
    /// Favourites changed while signed in but not yet saved to the account (e.g. offline).
    private var favouritesUnsynced = UserDefaults.standard.bool(forKey: "favouritesUnsynced") {
        didSet { UserDefaults.standard.set(favouritesUnsynced, forKey: "favouritesUnsynced") }
    }
    private var pushing: Task<Void, Never>?

    /// The API. Debug builds can use a local server: `./sim.sh -apiBase http://127.0.0.1:8788`.
    private static var apiBase: URL {
        #if DEBUG
            if let base = UserDefaults.standard.string(forKey: "apiBase"), let url = URL(string: base) { return url }
        #endif
        return HappyHRClient.production
    }
    private var myVotes: [String: Bool] = UserDefaults.standard.dictionary(forKey: "myVotes") as? [String: Bool] ?? [:]

    init() {
        payload = SharedStore.storedPayload(areaID)
        session = SessionStore.load()
        account = session?.account
        // The cache used to live in Caches, then in one app-group file before areas.
        try? FileManager.default.removeItem(at: FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0].appendingPathComponent("venues-cache-2.json"))
        try? FileManager.default.removeItem(at: SharedStore.directory.appendingPathComponent("venues-cache-2.json"))
    }

    /// Every area, as the server lists them (or the copy bundled with the app).
    private static let bundledAreas = SharedStore.storedPayload(SharedStore.defaultAreaID)?.areas ?? []

    /// The web app's demo venues (web/src/data/ossington.sample.ts, exported to shared/fixtures/sample-venues.json).
    private static let sampleVenues: [Venue] = {
        guard let url = Bundle.main.url(forResource: "sample-venues", withExtension: "json"), let data = try? Data(contentsOf: url) else { return [] }
        return (try? JSONDecoder().decode([Venue].self, from: data)) ?? []
    }()

    // MARK: Derived data

    /// Every area, for the area menu and for working out where someone is.
    var areas: [Area] { payload?.areas ?? Self.bundledAreas }
    /// The area on screen; known from the area list even before its spots load.
    var area: Area? { payload?.area ?? areas.first { $0.id == areaID } }
    /// The area the person is standing in (or near), if any.
    var hereArea: Area? { location.coordinate.flatMap { areaAt($0, areas) } }
    var foodTypes: [FoodTypeInfo] { payload?.foodTypes ?? Self.bundledFoodTypes }
    private static let bundledFoodTypes = SharedStore.storedPayload(SharedStore.defaultAreaID)?.foodTypes ?? []

    /// Demo data is only for Ossington, where the sample deals are.
    var demoing: Bool { demo && areaID == SharedStore.defaultAreaID }

    /// Curated venues plus everything the community added here, or the demo venues.
    var venues: [Venue] {
        let version = dataVersion
        if let cached = venuesCache, cached.version == version { return cached.venues }
        let merged: [Venue]
        if demoing {
            merged = Self.sampleVenues
        } else if let payload {
            merged = SharedStore.venues(payload, community: community.submissions)
        } else {
            merged = []
        }
        venuesCache = (version, merged)
        return merged
    }

    /// Check-ins and adding deals: only with the community API up, and never on demo data.
    var communityOn: Bool { communityAvailable && !demoing }

    /// In or within 3 km of the area: walking times start from the person.
    private func isNear(_ here: LatLng, _ area: Area) -> Bool {
        area.region.isEmpty ? distanceMeters(here, area.center) < Areas.nearMeters : metersToRegion(here, area.region) <= Areas.nearMeters
    }

    /// Walking times start from the person when they're near the area, else from the area's corner.
    var origin: LatLng {
        guard let area else { return LatLng(lat: 43.6496, lng: -79.4209) }
        if let here = location.coordinate, isNear(here, area) { return here }
        return area.origin.location
    }

    var originLabel: String {
        guard let area else { return "Ossington" }
        return origin == area.origin.location ? area.origin.label : "you"
    }

    /// Why walking times aren't from the person, when they aren't (the web app's location toast).
    var locationNote: String? {
        guard let area else { return nil }
        if location.denied { return "Location is off. Showing walks from \(area.origin.label)." }
        if let here = location.coordinate, !isNear(here, area) {
            return "You’re not near \(area.name) yet. Showing walks from \(area.origin.label)."
        }
        return nil
    }

    var rightNow: RightNow { ranked(filter) }

    /// Ranked once per (data, time, place, filter), then reused by every screen that asks.
    private func ranked(_ filter: DealFilter) -> RightNow {
        let key = RankKey(version: dataVersion, clock: clock, origin: origin, filter: filter)
        if let hit = rankCache[key] { return hit }
        let result = rankVenues(venues, at: clock, from: origin, filter: filter)
        if rankCache.count > 12 { rankCache.removeAll() }
        rankCache[key] = result
        return result
    }

    /// Every venue, unfiltered: for search, and so changing filters never closes an open venue.
    var everything: [RankedVenue] { ranked(.all).all }

    var selected: RankedVenue? { everything.first { $0.venue.id == selectedVenueID } }

    /// Favourite spots in list order: on now first, then starting soon, later and the rest.
    var favouriteVenues: [RankedVenue] { favourites.isEmpty ? [] : everything.filter { favourites.contains($0.venue.id) } }

    /// "Your spots": each favourite with what's on there, live ones first.
    var favouriteLines: [FavouriteLine] {
        favourites.isEmpty ? [] : HappyHRCore.favouriteLines(everything, ids: Array(favourites), at: clock)
    }

    var sharing: RankedVenue? { sharingID.flatMap { id in everything.first { $0.venue.id == id } } }

    /// What the map shows: the Daily specials filter maps only spots with a special still to come today.
    var mapItems: [RankedVenue] {
        filter == .daily ? rightNow.all.filter { dailyToday($0.venue, at: clock) != nil } : rightNow.all
    }

    // MARK: Actions

    func refresh() async {
        await refreshVenues()
        await refreshCommunity()
        await syncFavourites()
        shareWithWidget()
        syncFavouriteAlerts()
    }

    /// The area's latest list from the server (or its cache, offline).
    func refreshVenues() async {
        let id = areaID
        do {
            let latest = try await SharedStore.venueCache(id).refresh(using: client)
            // Someone may have switched areas while this was loading.
            guard id == areaID else { return }
            if latest != payload { payload = latest }
            problem = nil
        } catch {
            guard id == areaID else { return }
            if payload == nil { problem = error.localizedDescription }
        }
    }

    // MARK: Areas

    /// The area menu: shows that area for the rest of this launch, and next time.
    func chooseArea(_ id: String) {
        areaSettled = true
        guard id != areaID else { return showArea() }
        track("area:\(id)")
        switchArea(to: id)
        Task { await afterSwitch() }
    }

    /// The first time location is known this launch, opens the area the person is in,
    /// unless a link or the menu already picked one.
    func locationChanged() {
        guard !areaSettled, let here = location.coordinate else { return }
        areaSettled = true
        guard let found = areaAt(here, areas), found.id != areaID else { return }
        switchArea(to: found.id)
        say("Showing \(found.name), where you are.")
        Task { await afterSwitch() }
    }

    /// Shows the area's last list straight away; `afterSwitch` then fetches the latest.
    private func switchArea(to id: String) {
        areaID = id
        selectedVenueID = nil
        meet = nil
        filter = .all
        problem = nil
        payload = SharedStore.storedPayload(id)
        frameRequest += 1
    }

    private func afterSwitch() async {
        await refreshVenues()
        shareWithWidget()
    }

    func refreshCommunity() async {
        do {
            let latest = try await client.community()
            if latest != community { community = latest }
            communityAvailable = true
        } catch {
            communityAvailable = false
        }
    }

    func tick() {
        now = .now
        checkHeadsUp()
        endFinishedActivities()
        if SharedStore.origin != origin { shareWithWidget() }
        Task { await checkChatUnread() }
    }

    // MARK: Widget, alerts and the Lock Screen

    /// Hands the widget what it needs to work out what's on: the venue list is already in the
    /// app group (the cache); this adds the community's deals, favourites and the walking origin.
    func shareWithWidget() {
        SharedStore.community = community
        SharedStore.favourites = favourites
        SharedStore.origin = origin
        WidgetCenter.shared.reloadAllTimelines()
    }

    /// Re-schedules the alerts before favourites' deals, e.g. after starring or new data.
    func syncFavouriteAlerts() {
        guard !demoing, payload != nil else { return }
        let wanted = favouritesEverywhere()
        let enabled = favouriteAlerts
        alertsSync?.cancel()
        alertsSync = Task {
            // Coalesces quick changes (several stars in a row) into one reschedule.
            try? await Task.sleep(for: .milliseconds(400))
            guard !Task.isCancelled else { return }
            if let message = await reminders.syncFavourites(wanted, enabled: enabled) { say(message) }
        }
    }

    /// Favourite spots in every area this phone has a list for, so alerts cover them all,
    /// not just the area on screen.
    private func favouritesEverywhere() -> [Venue] {
        var found = venues.filter { favourites.contains($0.id) }
        var seen = Set(found.map(\.id))
        for other in areas where other.id != areaID && seen.count < favourites.count {
            guard let stored = SharedStore.venueCache(other.id).load()?.payload else { continue }
            for venue in SharedStore.venues(stored, community: community.submissions) where favourites.contains(venue.id) && !seen.contains(venue.id) {
                found.append(venue)
                seen.insert(venue.id)
            }
        }
        return found
    }

    /// Counts down this venue's happy hour (on now, or later today) on the Lock Screen and in
    /// the Dynamic Island. Replaces any other one. Returns a message when it can't.
    func startLiveActivity(_ rv: RankedVenue) async -> String? {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            return "Live Activities are off for Happy Hr. Turn them on in Settings › Happy Hr."
        }
        guard let state = HappyHourAttributes.ContentState(rv) else { return "There’s no happy hour here today." }
        track("live-activity")
        await endLiveActivities()
        do {
            // Stale at the start, so the system redraws it to count down to the end.
            let stale = state.startsAt > .now ? state.startsAt : state.endsAt
            _ = try Activity.request(
                attributes: HappyHourAttributes(venueID: rv.venue.id, venueName: rv.venue.name),
                content: ActivityContent(state: state, staleDate: stale))
            liveActivityVenueID = rv.venue.id
            return nil
        } catch {
            return "Couldn’t start the countdown: \(error.localizedDescription)"
        }
    }

    func endLiveActivities() async {
        for activity in Activity<HappyHourAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
        liveActivityVenueID = nil
    }

    /// Clears countdowns whose happy hour is over (there's no server to end them).
    private func endFinishedActivities() {
        guard Activity<HappyHourAttributes>.activities.contains(where: { $0.content.state.endsAt < .now }) else { return }
        Task {
            for activity in Activity<HappyHourAttributes>.activities where activity.content.state.endsAt < .now {
                await activity.end(nil, dismissalPolicy: .after(.now.addingTimeInterval(15 * 60)))
            }
            liveActivityVenueID = Activity<HappyHourAttributes>.activities.first { $0.content.state.endsAt >= .now }?.attributes.venueID
        }
    }

    // MARK: Heads-up

    /// At most one heads-up per favourite per Toronto day, while the app is open.
    private func checkHeadsUp() {
        guard preview == nil, !demoing else { return }
        let today = torontoDate()
        let saved = UserDefaults.standard.dictionary(forKey: "headsUp")
        var told = saved?["day"] as? String == today ? Set(saved?["ids"] as? [String] ?? []) : []
        guard let rv = startingSoon(everything, ids: Array(favourites)).first(where: { !told.contains($0.venue.id) }),
            case let .soon(_, _, startsAt) = rv.status
        else { return }
        told.insert(rv.venue.id)
        UserDefaults.standard.set(["day": today, "ids": Array(told)], forKey: "headsUp")
        headsUp = HeadsUp(venueID: rv.venue.id, text: "⭐ \(rv.venue.name): happy hour starts at \(formatTime(startsAt, compact: true))")
    }

    func dismissHeadsUp() { headsUp = nil }

    // MARK: Usage counts

    /// Counts a tap ("directions", "tile:beer") in the area on screen. Anonymous; see UsageTracker.
    func track(_ name: String) {
        guard Self.countsUsage else { return }
        usage.track(name, area: areaID)
    }

    /// Debug builds only count against a local API (`./sim.sh -apiBase …`), so testing doesn't
    /// add to the real numbers.
    private static var countsUsage: Bool {
        #if DEBUG
            return UserDefaults.standard.string(forKey: "apiBase") != nil
        #else
            return true
        #endif
    }

    /// Counts the app opening (at most once a minute), a few seconds in so location can settle
    /// the area, with the rough square it's in, then sends what's waiting.
    func countOpen() async {
        guard Self.countsUsage else { return }
        if let last = lastOpenCounted, Date().timeIntervalSince(last) < 60 { return }
        lastOpenCounted = Date()
        try? await Task.sleep(for: .seconds(4))
        usage.open(area: areaID, cell: location.coordinate.map { cellKey(usageCell($0, areas)) })
        await usage.flush(using: client)
    }

    /// Sends the counts as the app goes to the background.
    func sendUsage() {
        guard Self.countsUsage else { return }
        usage.flushInBackground(using: client)
    }

    /// Which search tiles, "when" and sort someone picked.
    private func countSearch(from old: SearchQuery) {
        for token in searchQuery.tokens where !old.tokens.contains(token) {
            switch token {
            case let .drink(drink): track("tile:\(drink.rawValue)")
            case let .food(food): track("tile:\(food.rawValue)")
            case let .place(place): track("tile:\(place.rawValue)")
            }
        }
        if searchQuery.when != old.when { track("when:\(searchQuery.when.rawValue)") }
        if searchQuery.sort != old.sort { track("sort:\(searchQuery.sort.rawValue)") }
    }

    // MARK: Owner

    var isOwner: Bool { ownerToken != nil }

    /// A long press on the wordmark opens the owner's sheet (the password first, on a new phone).
    func ownerGesture() { showUsage = true }

    /// Checks the owner password with the server and keeps it in the Keychain.
    func unlockOwner(_ password: String) async throws {
        let token = password.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !token.isEmpty else { throw APIError.rejected(status: 400, message: "Enter the admin password.") }
        do {
            _ = try await client.ownerUsage(days: 1, ownerToken: token)
        } catch APIError.rejected(status: 401, _) {
            throw APIError.rejected(status: 401, message: "That password isn’t right.")
        } catch APIError.badResponse(status: 503) {
            // Right password; the counts just aren't switched on yet.
        }
        OwnerStore.save(token)
        ownerToken = token
    }

    func lockOwner() {
        OwnerStore.save(nil)
        ownerToken = nil
    }

    /// The Usage screen's numbers. A changed owner password signs this phone out of it.
    func usageSummary(days: Int) async throws -> UsageSummary {
        guard let token = ownerToken else { throw APIError.rejected(status: 401, message: "Enter the admin password.") }
        do {
            return try await client.ownerUsage(days: days, ownerToken: token)
        } catch APIError.rejected(status: 401, _) {
            lockOwner()
            throw APIError.rejected(status: 401, message: "The admin password has changed. Enter it again.")
        } catch APIError.badResponse(status: 503) {
            throw APIError.rejected(status: 503, message: "Usage counts start once the database update is applied.")
        }
    }

    // MARK: Links

    /// A shared link (`?a=guelph&v=the-albion&meet=1050`) or a venue owner's key (`?venuekey=…`).
    func open(_ url: URL) {
        let link = parseLink(query: url.query ?? "")
        if let venueID = link.venueId {
            track("link")
            // Links from before areas are Ossington's.
            let linked = link.areaId ?? SharedStore.defaultAreaID
            areaSettled = true
            if linked != areaID, areas.contains(where: { $0.id == linked }) {
                switchArea(to: linked)
                Task {
                    await afterSwitch()
                    openVenue(venueID, meet: link.meet)
                }
            } else {
                openVenue(venueID, meet: link.meet)
            }
        }
        if let key = link.venueKey {
            Task {
                do {
                    let venueID = try await useVenueKey(key)
                    let name = venues.first { $0.id == venueID }?.name ?? "this venue"
                    say("You can now post deals for \(name) from this phone.")
                    select(venueID)
                } catch {
                    say(error.localizedDescription)
                }
            }
        }
    }

    private func openVenue(_ id: String, meet minutes: Int?) {
        guard venues.contains(where: { $0.id == id }) else { return }
        meet = minutes.map { Meet(venueID: id, minutes: $0) }
        filter = .all
        select(id)
    }

    // MARK: Venue owners

    func managesVenue(_ id: String) -> Bool { venueKeys[id] != nil }

    /// Checks a venue key with the server and keeps it in the Keychain. Returns the venue it manages.
    @discardableResult
    func useVenueKey(_ key: String) async throws -> String {
        let trimmed = key.trimmingCharacters(in: .whitespacesAndNewlines)
        guard isVenueKey(trimmed) else { throw APIError.rejected(status: 400, message: "That key doesn’t look right.") }
        let found = try await client.venueForKey(trimmed)
        venueKeys[found.venueId] = trimmed
        VenueKeyStore.save(venueKeys)
        // Open the venue's own area.
        if let id = found.areaId, id != areaID, areas.contains(where: { $0.id == id }) {
            areaSettled = true
            switchArea(to: id)
            await afterSwitch()
        }
        return found.venueId
    }

    /// "Run this place? Claim this page": the owner checks it, then sends a venue key.
    func claim(_ input: ClaimInput) async throws {
        if let problem = validateClaim(input) { throw APIError.rejected(status: 400, message: problem) }
        try await client.claim(input)
    }

    func select(_ id: String?) { selectedVenueID = id }

    func say(_ text: String) { notice = Notice(text: text) }

    func isFavourite(_ id: String) -> Bool { favourites.contains(id) }

    func toggleFavourite(_ id: String) {
        track(favourites.contains(id) ? "unfavourite" : "favourite")
        if favourites.contains(id) { favourites.remove(id) } else { favourites.insert(id) }
        favouritesVersion += 1
        saveFavourites()
        if session != nil { pushFavourites() }
    }

    private func saveFavourites() {
        UserDefaults.standard.set(favourites.sorted(), forKey: "favourites")
        shareWithWidget()
        syncFavouriteAlerts()
    }

    // MARK: Account

    /// Emails a sign-in code. Returns the code itself only from a local test server.
    func requestCode(email: String) async throws -> String? {
        try await client.requestCode(email: email).devCode
    }

    /// Checks the code, then merges this phone's favourites with the account's.
    func verify(email: String, code: String) async throws {
        let signIn = try await client.verify(email: email, code: code, device: device)
        SessionStore.save(signIn)
        session = signIn
        await syncFavourites(merge: true)
    }

    // MARK: Sign in with Apple

    /// A fresh random nonce for an Apple sign-in; Apple gets its SHA-256, the server gets the nonce itself.
    static func newNonce() -> String {
        var bytes = [UInt8](repeating: 0, count: 32)
        _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        return Data(bytes).base64EncodedString().replacingOccurrences(of: "=", with: "")
    }

    static func sha256(_ text: String) -> String {
        SHA256.hash(data: Data(text.utf8)).map { String(format: "%02x", $0) }.joined()
    }

    /// Finishes Sign in with Apple: the server checks Apple's token, then favourites merge as with email sign-in.
    func signInWithApple(_ credential: ASAuthorizationAppleIDCredential, nonce: String) async throws {
        guard let tokenData = credential.identityToken, let identityToken = String(data: tokenData, encoding: .utf8) else {
            throw APIError.rejected(status: 400, message: "Apple didn’t send a sign-in. Try again.")
        }
        let code = credential.authorizationCode.flatMap { String(data: $0, encoding: .utf8) }
        let signIn = try await client.signInWithApple(
            AppleSignInInput(identityToken: identityToken, authorizationCode: code, nonce: nonce, givenName: credential.fullName?.givenName, device: device))
        SessionStore.save(signIn)
        session = signIn
        await syncFavourites(merge: true)
    }

    /// Picks a chat name and agrees to the chat rules, in one go.
    func joinChat(name: String) async throws {
        guard let token = session?.token else { throw APIError.rejected(status: 401, message: "Sign in to chat.") }
        if let problem = validateDisplayName(name) { throw APIError.rejected(status: 400, message: problem) }
        let account = try await client.updateProfile(displayName: name, chatRules: true, token: token)
        updateAccount(account)
    }

    func renameInChat(_ name: String) async throws {
        guard let token = session?.token else { return }
        if let problem = validateDisplayName(name) { throw APIError.rejected(status: 400, message: problem) }
        updateAccount(try await client.updateProfile(displayName: name, token: token))
    }

    private func updateAccount(_ account: Account) {
        guard var signIn = session else { return }
        signIn.account = account
        SessionStore.save(signIn)
        session = signIn
    }

    // MARK: Group chat

    /// Loads the latest messages, then only newer ones on later calls.
    func refreshChat() async {
        do {
            let newer = try await client.chat(after: chatMessages.last?.id, token: session?.token)
            if chatMessages.isEmpty {
                if !newer.isEmpty { chatMessages = newer }
            } else if !newer.isEmpty {
                chatMessages.append(contentsOf: newer)
                // Keep memory bounded on a long-open chat.
                if chatMessages.count > 300 { chatMessages.removeFirst(chatMessages.count - 300) }
            }
            if showChat, let last = chatMessages.last?.id { lastSeenChatID = last }
            let unread = !showChat && (chatMessages.last?.id ?? 0) > lastSeenChatID
            if unread != chatUnread { chatUnread = unread }
        } catch {
            // Offline: the chat just doesn't update until the next try.
        }
    }

    /// While the chat is closed: is there anything newer than what was last seen?
    func checkChatUnread() async {
        guard !showChat, lastSeenChatID > 0 else { return }
        if let newer = try? await client.chat(after: lastSeenChatID, token: session?.token), newer.isEmpty == chatUnread {
            chatUnread = !newer.isEmpty
        }
    }

    func openChat() {
        if !showChat { showChat = true }
        if chatUnread { chatUnread = false }
        if let last = chatMessages.last?.id { lastSeenChatID = last }
    }

    func sendChat(_ text: String) async throws {
        guard let token = session?.token else { throw APIError.rejected(status: 401, message: "Sign in to chat.") }
        if let problem = validateChatMessage(text) { throw APIError.rejected(status: 400, message: problem) }
        let posted = try await client.postChat(text.trimmingCharacters(in: .whitespacesAndNewlines), token: token)
        track("chat-send")
        if !chatMessages.contains(where: { $0.id == posted.id }) {
            await refreshChat()
            if !chatMessages.contains(where: { $0.id == posted.id }) { chatMessages.append(posted) }
        }
        lastSeenChatID = posted.id
    }

    func deleteChat(_ message: ChatMessage) async throws {
        guard let token = session?.token else { return }
        try await client.deleteChat(message.id, token: token)
        chatMessages.removeAll { $0.id == message.id }
    }

    func reportChat(_ message: ChatMessage, reason: String?) async throws {
        guard let token = session?.token else { throw APIError.rejected(status: 401, message: "Sign in to report a message.") }
        try await client.reportChat(message.id, reason: reason, token: token)
    }

    /// Hides someone's messages from this account, everywhere.
    func block(_ message: ChatMessage) async throws {
        guard let token = session?.token else { throw APIError.rejected(status: 401, message: "Sign in to block someone.") }
        try await client.block(message.userId, token: token)
        chatMessages.removeAll { $0.userId == message.userId }
    }

    func blockedPeople() async throws -> [BlockedPerson] {
        guard let token = session?.token else { return [] }
        return try await client.blocked(token: token)
    }

    func unblock(_ person: BlockedPerson) async throws {
        guard let token = session?.token else { return }
        try await client.unblock(person.userId, token: token)
        chatMessages = []
        await refreshChat()
    }

    /// Signs this phone out. Its favourites stay on it.
    func signOut() async {
        if let token = session?.token { try? await client.signOut(token: token) }
        endSession()
    }

    /// Deletes the account and its saved favourites. The phone keeps its own copy.
    func deleteAccount() async throws {
        guard let token = session?.token else { return }
        try await client.deleteAccount(token: token)
        endSession()
    }

    private func endSession() {
        SessionStore.clear()
        session = nil
        // Blocks belong to the account: reload the chat as a signed-out reader.
        chatMessages = []
        favouritesUnsynced = false
    }

    /// Brings the phone and the account into line: merged right after signing in,
    /// then the account's list wins, unless this phone has changes it hasn't sent yet.
    func syncFavourites(merge: Bool = false) async {
        guard let token = session?.token else { return }
        if favouritesUnsynced && !merge {
            pushFavourites()
            return
        }
        let version = favouritesVersion
        do {
            let saved = Set(try await client.favourites(token: token))
            // Starred or unstarred something meanwhile: that change is on its way up instead.
            guard version == favouritesVersion else { return }
            let wanted = merge ? favourites.union(saved) : saved
            favourites = wanted
            saveFavourites()
            if wanted != saved { pushFavourites() }
        } catch APIError.rejected(status: 401, _) {
            // Signed out elsewhere, or the account was deleted.
            endSession()
        } catch {
            // Offline: keep the phone's list; the next refresh tries again.
        }
    }

    /// Saves the phone's favourites to the account, one save at a time, newest last.
    private func pushFavourites() {
        favouritesUnsynced = true
        let previous = pushing
        pushing = Task {
            await previous?.value
            guard let token = session?.token else { return }
            do {
                _ = try await client.saveFavourites(favourites.sorted(), token: token)
                favouritesUnsynced = false
            } catch APIError.rejected(status: 401, _) {
                endSession()
            } catch {
                // Offline: favouritesUnsynced stays set, so the next refresh sends them.
            }
        }
    }

    /// Back to the whole area on the map (the area menu's current area).
    func showArea() { frameRequest += 1 }

    /// Adds a happy hour or daily special for everyone (as the venue when `asVenue`). Throws with a message to show.
    func submit(_ input: SubmissionInput, asVenue: Bool = false) async throws {
        var input = input
        if asVenue, let venueID = input.venueId { input.venueKey = venueKeys[venueID] }
        // A new place needs a location, so it shows in the right area: its address, else the area's corner.
        if input.venueId == nil, input.lat == nil, let area {
            let point = await geocode(input.address ?? "", in: area) ?? area.origin.location
            input.lat = point.lat
            input.lng = point.lng
        }
        if let problem = validateSubmission(input, areas: areas) { throw APIError.rejected(status: 400, message: problem) }
        try await client.submit(input)
        await refreshCommunity()
    }

    /// "505 College St" → coordinates, looked up in the area's city.
    private func geocode(_ address: String, in area: Area) async -> LatLng? {
        let trimmed = address.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, let request = MKGeocodingRequest(addressString: "\(trimmed), \(area.lookupCity), ON") else { return nil }
        guard let item = try? await request.mapItems.first else { return nil }
        let found = LatLng(lat: item.location.coordinate.latitude, lng: item.location.coordinate.longitude)
        // A lookup that lands somewhere else (a same-named street in another town) doesn't count.
        return metersToRegion(found, area.region) <= Areas.nearMeters ? found : nil
    }

    /// "Did the deal work?" One answer per venue per day; answering again replaces it.
    func vote(_ venueID: String, worked: Bool) async throws {
        try await client.vote(VoteInput(device: device, venueId: venueID, worked: worked))
        track("check-in")
        myVotes["\(venueID)|\(torontoDate())"] = worked
        UserDefaults.standard.set(myVotes, forKey: "myVotes")
        await refreshCommunity()
    }

    func myVoteToday(_ venueID: String) -> Bool? { myVotes["\(venueID)|\(torontoDate())"] }
}

struct Meet: Equatable {
    let venueID: String
    let minutes: Int
}

struct HeadsUp: Equatable {
    let id = UUID()
    let venueID: String
    let text: String
}

struct Notice: Equatable {
    let id = UUID()
    let text: String
}

/// What the add-a-deal form opens for: a listed venue, or a new place.
struct ContributeTarget: Identifiable, Hashable {
    var venueID: String?
    /// Posting as the venue itself, with the key this phone holds.
    var asVenue = false
    var id: String { "\(venueID ?? "new")\(asVenue ? "-venue" : "")" }
}
