import HappyHRCore
import SwiftUI

/// A venue's page: its deal right now, specials, daily specials, the week's
/// schedule, and ways to get there, book or call. Pushed inside the sheet.
struct VenueDetailView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openURL) private var openURL
    let venueID: String
    /// The week's opening hours, under the open-state line.
    @State private var showHours = false
    @State private var reminderProblem: String?
    @State private var activityProblem: String?
    /// The venue's Google Places photo, once loaded (needs a key; otherwise the gradient stays).
    @State private var photo: PlacePhoto?

    var body: some View {
        if let rv = model.selected ?? model.everything.first(where: { $0.venue.id == venueID }) {
            content(rv)
        } else {
            ContentUnavailableView("Not found", systemImage: "mappin.slash")
        }
    }

    @ViewBuilder
    private func content(_ rv: RankedVenue) -> some View {
        let venue = rv.venue
        let window = focusWindow(rv.status)
        let today = dailyToday(venue, at: model.clock)
        let fresh = freshness(venue, tally: model.community.votes[venue.id])

        ScrollView {
            hero(rv, today: today)

            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(venue.name).font(.display(30))
                    Text("\(venue.category) · \(venue.address)").foregroundStyle(.secondary)
                    HStack(spacing: 6) {
                        Label("\(rv.walkMin) min walk · \(formatDistance(rv.distanceM))", systemImage: "figure.walk")
                            .foregroundStyle(.secondary)
                        openLine(venue)
                    }
                    .font(.subheadline)
                    if showHours { weekHoursCard(venue) }
                    let vibes = venueVibes(venue, at: model.clock)
                    if !venue.tags.isEmpty || !vibes.isEmpty {
                        FlowLayout(spacing: 6) {
                            ForEach(vibes, id: \.self) { VibeTag(vibe: $0) }
                            ForEach(venue.tags, id: \.self) { Tag($0) }
                        }
                        .padding(.top, 4)
                    }
                }

                if let meet = model.meet, meet.venueID == venue.id { meetBanner(rv, minutes: meet.minutes) }

                statusBlock(rv, today: today, fresh: fresh)

                // Real times only: not on demo deals or while previewing another time.
                if venue.deals != .sample, model.preview == nil, [.live, .soon, .later].contains(rv.status.kind) { lockScreenButton(rv) }

                if let window {
                    VStack(alignment: .leading, spacing: 10) {
                        sectionTitle(specialsTitle(rv.status), note: formatRange(window))
                        if let note = window.note { Text(note).font(.footnote).foregroundStyle(.secondary) }
                        specialsList(window.specials)
                    }
                }

                if !venue.daily.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        sectionTitle("Daily specials")
                        VStack(spacing: 0) {
                            ForEach(Array(venue.daily.enumerated()), id: \.offset) { index, special in
                                dailyItem(special, isToday: special.days.contains(model.clock.day)) {
                                    if venue.deals != .sample {
                                        bell(
                                            Reminders.id(venueID: venue.id, kind: "daily", index: index), plan: reminderPlan(venue, daily: special),
                                            venueID: venue.id, label: "Remind me about \(dailyLabel(special)) every week")
                                    }
                                }
                            }
                        }
                        .cardBackground(cornerRadius: 16)
                    }
                }

                if !venue.happyHours.isEmpty { weekSchedule(venue, window: window) }

                if let reminderProblem {
                    Text(reminderProblem).font(.footnote).foregroundStyle(Color.ember)
                }

                actions(venue)

                if hasDeals(venue) { provenance(venue, fresh: fresh) }

                if hasDeals(venue) && model.communityOn { CheckInView(venueID: venue.id, deal: checkInDeal(rv, today: today)) }

                if model.communityOn {
                    Button(hasDeals(venue) ? "Something changed, or missing a deal? Suggest an update" : "Know a deal here? Add it for everyone") {
                        model.contribute = ContributeTarget(venueID: venue.id)
                    }
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Color.honeyAccent)
                    .frame(maxWidth: .infinity)
                }

                ownerFooter(venue)
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 32)
        }
        // The hero runs up under the back button, like the web's full-width header.
        .ignoresSafeArea(edges: .top)
        .navigationBarTitleDisplayMode(.inline)
        // Pushed pages get an opaque system background; use the sheet's mocha (or cream) glass instead.
        .containerBackground(for: .navigation) { SheetFill() }
        .task { await model.reminders.refresh() }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    model.sharingID = venue.id
                } label: {
                    Image(systemName: "square.and.arrow.up")
                }
                .accessibilityLabel("Share \(venue.name)")
            }
            ToolbarItem(placement: .topBarTrailing) {
                let favourite = model.isFavourite(venue.id)
                Button {
                    withAnimation(.snappy) { model.toggleFavourite(venue.id) }
                } label: {
                    Image(systemName: favourite ? "star.fill" : "star")
                        .foregroundStyle(favourite ? Color.honeyAccent : Color.text)
                        .contentTransition(.symbolEffect(.replace))
                }
                .accessibilityLabel(favourite ? "Remove from favourites" : "Add to favourites")
                .sensoryFeedback(.selection, trigger: favourite)
            }
        }
    }

    // MARK: Sections

    private func hero(_ rv: RankedVenue, today: DailySpecial?) -> some View {
        let venue = rv.venue
        let unlisted = venue.happyHours.isEmpty
        let lead = headlineSpecial(focusWindow(rv.status)?.specials ?? []) ?? (unlisted ? today?.specials.first : nil)
        let honeyLead = rv.status.kind == .live || (unlisted && today != nil)
        let leadPill = lead.map { lead in
            Text(formatSpecial(lead))
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(honeyLead ? Color.onHoney : Color.text)
                .lineLimit(1)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .glassCapsule(tint: honeyLead ? .honey : nil)
        }
        return ZStack {
            LinearGradient(stops: venue.vibe.gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
            RadialGradient(colors: [.white.opacity(0.35), .clear], center: UnitPoint(x: 0.25, y: 0), startRadius: 0, endRadius: 220)
            if let photo {
                // The room, as on the web: darkened at the top and bottom so the badge, buttons and credit read.
                Color.clear
                    .overlay {
                        Image(uiImage: photo.image).resizable().scaledToFill()
                    }
                    .clipped()
                    .overlay {
                        LinearGradient(stops: [.init(color: .black.opacity(0.45), location: 0), .init(color: .clear, location: 0.35),
                                               .init(color: .clear, location: 0.6), .init(color: .black.opacity(0.6), location: 1)],
                                       startPoint: .top, endPoint: .bottom)
                    }
                    .transition(.opacity)
            } else {
                // The emoji and the lead price, centred one over the other.
                VStack(spacing: -12) {
                    Text(venue.vibe.glyph)
                        .font(.system(size: 46))
                        .frame(width: 84, height: 84)
                        .glassCircle(interactive: false)
                        .shadow(color: .black.opacity(0.25), radius: 15, y: 10)
                    leadPill
                }
                .padding(.horizontal, 20)
                .padding(.top, 44)
            }
        }
        .frame(height: 220)
        .overlay(alignment: .bottom) {
            if let photo {
                // With a photo, the deal sits bottom right and Google's required credit under it, on the left.
                VStack(alignment: .trailing, spacing: 6) {
                    leadPill
                    if let author = photo.author {
                        Button {
                            if let url = photo.authorURL { openURL(url) }
                        } label: {
                            // Shortened in the middle, so "Google Maps" always shows.
                            Text("Photo: \(author) · Google Maps").lineLimit(1).truncationMode(.middle)
                        }
                        .buttonStyle(.plain)
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(Color.cream.opacity(0.85))
                        .shadow(color: .black.opacity(0.6), radius: 3)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .accessibilityLabel("Photo by \(author), from Google Maps")
                    }
                }
                .padding(.horizontal, 14)
                .padding(.bottom, 8)
            }
        }
        .animation(.smooth, value: photo != nil)
        .task(id: venue.placeId) {
            guard let placeId = venue.placeId, venue.deals != .sample else { return }
            photo = await PlacePhotos.photo(for: placeId)
        }
        .overlay(alignment: .top) {
            HStack(spacing: 7) {
                if rv.status.kind == .live { Circle().fill(.honeyFill).frame(width: 8, height: 8) }
                Text(badge(rv, today: today))
            }
            .font(.system(size: 12, weight: .bold))
            .tracking(0.5)
            .textCase(.uppercase)
            .foregroundStyle(Color.cream)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(Color.ink.opacity(0.45), in: .capsule)
            // Level with the back and favourite buttons, between them.
            .padding(.top, 22)
        }
    }

    /// The hero's badge: what's happening at this spot today.
    private func badge(_ rv: RankedVenue, today: DailySpecial?) -> String {
        if rv.venue.happyHours.isEmpty {
            return today != nil ? "Special today" : rv.venue.daily.isEmpty ? "No deals listed" : "Daily specials"
        }
        switch rv.status.kind {
        case .live: return "On now"
        case .soon: return "Starting soon"
        case .later: return "Later today"
        case .none: return "Not today"
        }
    }

    /// "Open · till 1 AM ⌄": green when open, amber when closing soon; tap for the week.
    @ViewBuilder
    private func openLine(_ venue: Venue) -> some View {
        let state = openState(venue, at: model.clock)
        let label = openLabel(state, today: model.clock.day)
        if !label.isEmpty {
            Text("·").foregroundStyle(.secondary)
            Button {
                withAnimation(.snappy) { showHours.toggle() }
            } label: {
                HStack(spacing: 3) {
                    Text(label)
                    Image(systemName: "chevron.down")
                        .font(.caption2.weight(.bold))
                        .rotationEffect(.degrees(showHours ? 180 : 0))
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(openColor(state))
            }
            .buttonStyle(.plain)
            .accessibilityHint(showHours ? "Hides the week’s hours" : "Shows the week’s hours")
        }
    }

    private func openColor(_ state: OpenState) -> Color {
        guard case let .open(_, closesIn) = state else { return .textSecondary }
        return closesIn <= closingSoonMinutes ? .amber : .openGreen
    }

    private func weekHoursCard(_ venue: Venue) -> some View {
        VStack(spacing: 0) {
            ForEach(Array(weekHours(venue, today: model.clock.day).enumerated()), id: \.offset) { offset, row in
                HStack {
                    Text(offset == 0 ? "Today" : TorontoTime.dayShort[row.day])
                        .font(.subheadline.weight(offset == 0 ? .bold : .regular))
                        .frame(width: 60, alignment: .leading)
                    Text(row.text)
                        .font(.subheadline)
                        .foregroundStyle(row.text == "Closed" ? Color.textSecondary : Color.text)
                    Spacer()
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(offset == 0 ? Color.honey.opacity(0.08) : .clear)
            }
        }
        .cardBackground(cornerRadius: 16)
        .padding(.top, 4)
        .transition(.opacity.combined(with: .move(edge: .top)))
    }

    /// From a shared plan link: "Meet here at 5:30 PM?" with what's on.
    private func meetBanner(_ rv: RankedVenue, minutes: Int) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text("Meet here at \(formatTime(minutes, compact: true))?").font(.headline)
            if let deal = dealLine(rv, at: model.clock) { Text(deal).font(.subheadline) }
        }
        .foregroundStyle(Color.onHoney)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .glassPanel(cornerRadius: 18, tint: .honey)
    }

    /// The deal the check-in asks about: the live happy hour's lead, or today's daily special.
    private func checkInDeal(_ rv: RankedVenue, today: DailySpecial?) -> String? {
        let lead = headlineSpecial(focusWindow(rv.status)?.specials ?? [])
        if rv.status.kind == .live, let lead { return formatSpecial(lead) }
        if rv.venue.happyHours.isEmpty, let today { return dailyLabel(today) }
        return nil
    }

    /// A weekly reminder for a deal: a bell that's honey when on.
    private func bell(_ id: String, plan: ReminderPlan, venueID: String, label: String, title: String? = nil) -> some View {
        let on = model.reminders.isOn(id)
        return Button {
            Task {
                reminderProblem = await model.reminders.toggle(id, plan: plan, venueID: venueID)
                // A starred spot's alert comes back when its bell goes off.
                model.syncFavouriteAlerts()
            }
        } label: {
            HStack(spacing: 4) {
                Image(systemName: on ? "bell.fill" : "bell")
                if let title { Text(on ? "Reminding you" : title) }
            }
            .font(.caption.weight(.semibold))
            .foregroundStyle(on ? Color.honeyAccent : Color.textSecondary)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(on ? "Stop reminding me" : label)
        .sensoryFeedback(.selection, trigger: on)
    }

    /// Counts this happy hour down on the Lock Screen and in the Dynamic Island, or stops it.
    private func lockScreenButton(_ rv: RankedVenue) -> some View {
        let on = model.liveActivityVenueID == rv.venue.id
        return VStack(alignment: .leading, spacing: 6) {
            Button {
                Task {
                    if on {
                        await model.endLiveActivities()
                        activityProblem = nil
                    } else {
                        activityProblem = await model.startLiveActivity(rv)
                    }
                }
            } label: {
                Label(on ? "On your Lock Screen · Stop" : "Count down on my Lock Screen", systemImage: on ? "timer.circle.fill" : "timer")
                    .font(.subheadline.weight(.semibold))
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .tint(on ? .honey : .secondary)
            .controlSize(.large)
            .sensoryFeedback(.selection, trigger: on)
            if let activityProblem { Text(activityProblem).font(.footnote).foregroundStyle(Color.ember) }
        }
    }

    /// Venue staff: post as the venue, or ask to manage the page.
    @ViewBuilder
    private func ownerFooter(_ venue: Venue) -> some View {
        if model.managesVenue(venue.id) {
            HStack(spacing: 4) {
                Text("You manage this page.").foregroundStyle(.secondary)
                Button("Post a deal") { model.contribute = ContributeTarget(venueID: venue.id, asVenue: true) }
                    .foregroundStyle(Color.honeyAccent)
            }
            .font(.footnote.weight(.semibold))
            .frame(maxWidth: .infinity)
        } else if !venue.id.hasPrefix("c-"), !model.demoing {
            HStack(spacing: 4) {
                Text("Run \(venue.name)?").foregroundStyle(.tertiary)
                Button("Claim this page") { model.claiming = venue }
                    .foregroundStyle(.secondary)
            }
            .font(.caption)
            .frame(maxWidth: .infinity)
        }
    }

    @ViewBuilder
    private func statusBlock(_ rv: RankedVenue, today: DailySpecial?, fresh: Freshness?) -> some View {
        let venue = rv.venue
        HStack(spacing: 14) {
            if !venue.happyHours.isEmpty {
                StatusRing(status: rv.status, size: 64)
            } else {
                Text(venue.daily.isEmpty ? "🍻" : "🗓️")
                    .font(.system(size: 26))
                    .frame(width: 64, height: 64)
                    .overlay(Circle().strokeBorder(.quaternary, style: StrokeStyle(lineWidth: 1.5, dash: [4, 3])))
            }
            VStack(alignment: .leading, spacing: 3) {
                let text = statusText(rv, today: today)
                Text(text.title)
                    .font(.title3.weight(.bold))
                    .foregroundStyle(rv.status.kind == .live || (venue.happyHours.isEmpty && today != nil) ? Color.honeyAccent : Color.text)
                if !text.sub.isEmpty { Text(text.sub).font(.subheadline).foregroundStyle(.secondary) }
                if let fresh, fresh.confirmed {
                    Text(fresh.label).font(.footnote.weight(.semibold)).foregroundStyle(Color.openGreen)
                } else if let fresh, fresh.stale {
                    Text("May be out of date · \(fresh.label)").font(.footnote.weight(.semibold)).foregroundStyle(Color.amber)
                }
            }
            Spacer(minLength: 0)
        }
        .padding(14)
        .cardBackground(highlighted: rv.status.kind == .live)
    }

    private func statusText(_ rv: RankedVenue, today: DailySpecial?) -> (title: String, sub: String) {
        let venue = rv.venue
        if venue.happyHours.isEmpty {
            if let today { return ("Today: \(dailyLabel(today))", (today.title != nil ? dailyDetail(today) + " · " : "") + dailyHours(today)) }
            for offset in 1...6 {
                let day = (model.clock.day + offset) % 7
                if let next = dailyOn(venue, day: day).first {
                    return ("No special today", "Next: \(TorontoTime.dayShort[day]) · \(dailyLabel(next))")
                }
            }
            return ("No deals listed yet", "Ask the venue about specials.")
        }
        switch rv.status {
        case let .live(_, left, endsAt, _):
            return (isEndingSoon(rv.status) ? "Ending soon. Go now!" : "Happy hour is on", "Ends \(formatTime(endsAt, compact: true)) · \(formatDuration(left)) left")
        case let .soon(_, startsIn, startsAt):
            return ("Starts in \(formatDuration(startsIn))", "Today at \(formatTime(startsAt, compact: true))")
        case let .later(_, _, startsAt):
            return ("Later today", "Starts at \(formatTime(startsAt, compact: true))")
        case let .none(next):
            guard let next else { return ("No happy hour listed", "") }
            return ("Not today", "Next: \(TorontoTime.dayShort[next.day]) at \(formatTime(next.startsAt, compact: true))")
        }
    }

    private func specialsTitle(_ status: VenueStatus) -> String {
        switch status.kind {
        case .live: "The specials"
        case .none: "Next specials"
        default: "Today’s specials"
        }
    }

    private func specialsList(_ specials: [Special]) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            ForEach([Special.Kind.drink, .food], id: \.self) { kind in
                let rows = specials.filter { $0.kind == kind }
                if !rows.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Label(kind == .drink ? "Drinks" : "Food", systemImage: kind == .drink ? "wineglass" : "fork.knife")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.tertiary)
                        ForEach(rows, id: \.self) { special in
                            HStack(alignment: .firstTextBaseline, spacing: 12) {
                                Text(special.price.map(formatPrice) ?? "✦")
                                    .font(.display(21))
                                    .foregroundStyle(Color.honeyAccent)
                                    .frame(minWidth: 62, alignment: .leading)
                                Text(formatItem(special.item))
                                    .font(.system(size: 15, weight: .medium))
                                Spacer(minLength: 0)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .cardBackground(cornerRadius: 16)
                        }
                    }
                }
            }
        }
    }

    private func dailyItem(_ special: DailySpecial, isToday: Bool, @ViewBuilder accessory: () -> some View) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Text(dailyDays(special))
                .font(.caption.weight(.semibold))
                .textCase(.uppercase)
                .foregroundStyle(isToday ? Color.honeyAccent : Color.textSecondary)
                .frame(width: 72, alignment: .leading)
            VStack(alignment: .leading, spacing: 2) {
                if let title = special.title { Text(title).font(.subheadline.weight(.semibold)) }
                Text(dailyDetail(special)).font(.footnote).foregroundStyle(.secondary)
                if let note = special.note { Text(note).font(.caption).foregroundStyle(.tertiary) }
            }
            Spacer(minLength: 4)
            VStack(alignment: .trailing, spacing: 6) {
                Text(dailyHours(special)).font(.caption).foregroundStyle(.secondary)
                accessory()
            }
        }
        .padding(12)
        .background(isToday ? Color.honey.opacity(0.08) : .clear)
    }

    private func weekSchedule(_ venue: Venue, window: HappyHourWindow?) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                sectionTitle("This week")
                // A weekly reminder before the happy hour the page is about.
                if let window, venue.deals != .sample, let index = venue.happyHours.firstIndex(of: window) {
                    bell(
                        Reminders.id(venueID: venue.id, kind: "happy-hour", index: index), plan: reminderPlan(venue, window: window),
                        venueID: venue.id, label: "Remind me every week before happy hour", title: "Remind me")
                }
            }
            VStack(spacing: 0) {
                ForEach(0..<7, id: \.self) { offset in
                    let day = (model.clock.day + offset) % 7
                    let windows = venue.happyHours.filter { $0.days.contains(day) }.sorted { $0.start < $1.start }
                    HStack {
                        Text(offset == 0 ? "Today" : TorontoTime.dayShort[day])
                            .font(.subheadline.weight(offset == 0 ? .bold : .regular))
                            .frame(width: 60, alignment: .leading)
                        Text(windows.isEmpty ? "None" : windows.map(formatRange).joined(separator: "  ·  "))
                            .font(.subheadline)
                            .foregroundStyle(windows.isEmpty ? Color.textSecondary : Color.text)
                        Spacer()
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(offset == 0 ? Color.honey.opacity(0.08) : .clear)
                }
            }
            .cardBackground(cornerRadius: 16)
        }
    }

    private func actions(_ venue: Venue) -> some View {
        VStack(spacing: 12) {
            // Two equal buttons, one line each, text centred (the web's two-column grid).
            HStack(spacing: 10) {
                actionButton("Directions", systemImage: "figure.walk", prominent: true) {
                    model.track("directions")
                    openURL(URL(string: "https://maps.apple.com/?daddr=\(venue.lat),\(venue.lng)&dirflg=w")!)
                }
                if let booking = venue.booking, let url = URL(string: booking.url) {
                    actionButton(booking.provider.label, systemImage: "calendar") { open(url, counting: "book") }
                } else if let phone = venue.phone, let url = telURL(phone) {
                    actionButton("Call", systemImage: "phone") { open(url, counting: "call") }
                } else if let url = placeURL(venue) {
                    actionButton("Google Maps", systemImage: "arrow.up.right.square") { open(url, counting: "google-maps") }
                }
            }

            FlowLayout(spacing: 8, alignment: .center) {
                if let phone = venue.phone, let url = telURL(phone) {
                    linkChip(phone, systemImage: "phone", url: url, counting: "call")
                }
                if let menu = venue.menuUrl, let url = URL(string: menu) {
                    linkChip("Menu", systemImage: "fork.knife", url: url, counting: "menu")
                }
                if let site = venue.website, let url = URL(string: site) {
                    linkChip(url.host()?.replacingOccurrences(of: "www.", with: "") ?? "Website", systemImage: "globe", url: url, counting: "website")
                }
                if venue.booking != nil || venue.phone != nil, let url = placeURL(venue) {
                    linkChip("Google Maps", systemImage: "arrow.up.right.square", url: url, counting: "google-maps")
                }
            }
            .frame(maxWidth: .infinity)
        }
    }

    @ViewBuilder
    private func actionButton(_ title: String, systemImage: String, prominent: Bool = false, action: @escaping () -> Void) -> some View {
        let label = Label(title, systemImage: systemImage)
            .font(.system(size: 15, weight: .semibold))
            .lineLimit(1)
            .minimumScaleFactor(0.75)
            .frame(maxWidth: .infinity, minHeight: 36)
        if prominent {
            Button(action: action) { label }
                .buttonStyle(.glassProminent)
                .tint(.honey)
                .foregroundStyle(Color.onHoney)
                .controlSize(.large)
        } else {
            Button(action: action) { label }
                .buttonStyle(.glass)
                .controlSize(.large)
        }
    }

    /// Opens a link, counting the tap (anonymous usage counts).
    private func open(_ url: URL, counting event: String) {
        model.track(event)
        openURL(url)
    }

    /// The web's link chips: a quiet fill, a hairline, a honey icon.
    private func linkChip(_ title: String, systemImage: String, url: URL, counting event: String) -> some View {
        Button { open(url, counting: event) } label: {
            HStack(spacing: 6) {
                Image(systemName: systemImage).foregroundStyle(Color.honeyAccent)
                Text(title).foregroundStyle(Color.text)
            }
            .font(.footnote.weight(.semibold))
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.cardFill, in: .capsule)
            .overlay(Capsule().strokeBorder(Color.hairline))
        }
        .buttonStyle(.plain)
    }

    private func provenance(_ venue: Venue, fresh: Freshness?) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Text(venue.deals.title).font(.subheadline.weight(.semibold))
                if let fresh, !fresh.confirmed {
                    Text("· \(fresh.label)").font(.footnote).foregroundStyle(fresh.stale ? Color.amber : Color.textSecondary)
                }
            }
            Text(provenanceText(venue)).font(.footnote).foregroundStyle(.secondary)
            ForEach(venue.sources ?? [], id: \.url) { source in
                if let url = URL(string: source.url) {
                    Link(destination: url) {
                        Text("\(source.label) \(Image(systemName: "arrow.up.right")) \(Text("· \(formatSourceDate(source.date))").foregroundStyle(.tertiary))")
                            .font(.footnote)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .cardBackground(cornerRadius: 16)
    }

    private func provenanceText(_ venue: Venue) -> String {
        switch venue.deals {
        case .sample: "These specials are placeholders for the beta and haven’t been confirmed with \(venue.name)."
        case .reported: "From listings, not confirmed by \(venue.name). Check with them before you go."
        case .community: "Added by people using Happy Hr and not checked by us. Check-ins show whether it’s still on."
        default: "Happy hours change, so check with the venue before you go."
        }
    }

    private func sectionTitle(_ title: String, note: String? = nil) -> some View {
        HStack {
            Text(title).textCase(.uppercase).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            Spacer()
            if let note { Text(note).font(.caption.weight(.semibold)).foregroundStyle(.secondary) }
        }
    }

    /// The venue on Google Maps: its own listing, else a search for it.
    private func placeURL(_ venue: Venue) -> URL? {
        if let maps = venue.googleMapsUrl { return URL(string: maps) }
        var search = URLComponents(string: "https://www.google.com/maps/search/")!
        search.queryItems = [URLQueryItem(name: "api", value: "1"), URLQueryItem(name: "query", value: "\(venue.name), \(venue.address), \(model.area?.lookupCity ?? "Toronto"), ON")]
        return search.url
    }

    /// "2026-09" → "Sep 2026"; "2025" and "undated" stay as they are.
    private func formatSourceDate(_ date: String) -> String {
        let parts = date.split(separator: "-")
        guard parts.count == 2, let month = Int(parts[1]), (1...12).contains(month) else { return date }
        let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return "\(months[month - 1]) \(parts[0])"
    }

    /// "(416) 532-8000" → tel:+14165328000.
    private func telURL(_ phone: String) -> URL? {
        URL(string: "tel:+1" + phone.filter(\.isNumber))
    }
}

/// "Did the deal work?" Thumbs up or down, once a day per venue.
struct CheckInView: View {
    @Environment(AppModel.self) private var model
    let venueID: String
    /// The deal to ask about by name, e.g. "$4 Cheeseburger Sliders (min 2)".
    var deal: String?
    @State private var sending = false
    @State private var problem: String?

    var body: some View {
        let mine = model.myVoteToday(venueID)
        VStack(alignment: .leading, spacing: 10) {
            Text(mine != nil ? "Thanks for checking in" : deal.map { "Here now? Did you get the \($0)?" } ?? "Been here today? Did the deal work?")
                .font(.subheadline.weight(.semibold))
            HStack(spacing: 10) {
                vote("👍 Worked", worked: true, chosen: mine == true)
                vote("👎 Didn’t", worked: false, chosen: mine == false)
            }
            Text(voteSummary(model.community.votes[venueID]).text).font(.footnote).foregroundStyle(.secondary)
            if let problem { Text(problem).font(.footnote).foregroundStyle(Color.ember) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .cardBackground(cornerRadius: 16)
    }

    private func vote(_ title: String, worked: Bool, chosen: Bool) -> some View {
        Button(title) {
            Task {
                sending = true
                defer { sending = false }
                do {
                    try await model.vote(venueID, worked: worked)
                    problem = nil
                } catch {
                    problem = error.localizedDescription
                }
            }
        }
        .disabled(sending)
        .modifier(ChipStyle(selected: chosen))
    }
}
