import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Splash } from './brand/Splash'
import { ArrivalNudge } from './components/CheckIn'
import { ClaimSheet } from './components/ClaimSheet'
import { ContributeSheet } from './components/ContributeSheet'
import { ClockIcon, LocateIcon } from './components/icons'
import { NowSheet, type Snap } from './components/NowSheet'
import { OwnerPanel } from './components/OwnerPanel'
import { SearchSheet } from './components/SearchSheet'
import { ShareSheet } from './components/ShareSheet'
import { TimePreview } from './components/TimePreview'
import { TopBar } from './components/TopBar'
import { VenueDetail } from './components/VenueDetail'
import { areaById, LEGACY_AREA_ID, LOADERS } from './data/areas'
import { SAMPLE_VENUES } from './data/ossington.sample'
import { useArea } from './hooks/useArea'
import { useCommunity } from './hooks/useCommunity'
import { useIsDesktop } from './hooks/useMediaQuery'
import { useNow } from './hooks/useNow'
import { headsUpGiven, rememberHeadsUp, useFavourites, useVenueKeys } from './hooks/useSaved'
import { useTheme } from './hooks/useTheme'
import { relativeTo, useUserLocation } from './hooks/useUserLocation'
import { track, useUsage } from './hooks/useUsage'
import { mergeCommunity, submissionsForArea } from './lib/community'
import { dailyToday } from './lib/daily'
import { allOf, rankVenues, type DealFilter } from './lib/deals'
import { favouriteLines, startingSoon } from './lib/favourites'
import { EMPTY_QUERY, type SearchQuery } from './lib/search'
import { parseLink } from './lib/share'
import { DAY_SHORT, formatTime, torontoDate, type Clock } from './lib/time'
import type { LatLng } from './lib/types'
import { MapView, type Insets } from './map/MapView'
import { RefractionFilter } from './styles/refraction'

const SPLASH_KEY = 'happyhr:splash-seen'
const DEMO_KEY = 'happyhr:demo-data'
const TOP_BAR = 76
const SIDEBAR = 400
const GUTTER = 16
/** Share of the screen the venue detail covers on phones (matches .detail--bottom). */
const DETAIL_SHARE = 0.72
const CONTROL = 44
const CONTROL_GAP = 10
/** A shared link this page was opened with: a spot, a plan to meet, or a venue owner's key. */
const LINK = parseLink(window.location.search)

function splashSeen(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_KEY) === '1'
  } catch {
    return false
  }
}

function demoPreference(): boolean {
  try {
    return localStorage.getItem(DEMO_KEY) === '1'
  } catch {
    return false
  }
}

function useViewportHeight(): number {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('resize', onChange)
      return () => window.removeEventListener('resize', onChange)
    },
    () => window.innerHeight,
    () => 800,
  )
}

export default function App() {
  // A shared spot opens straight to it, without the splash.
  const [showSplash, setShowSplash] = useState(() => !splashSeen() && !LINK.venueId)
  const [preview, setPreview] = useState<Clock | null>(null)
  // Demo data swaps in the original sample deals, to show the app at its busiest.
  const [demo, setDemo] = useState(demoPreference)
  const [filter, setFilter] = useState<DealFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(LINK.venueId ?? null)
  const [snap, setSnap] = useState<Snap>('half')
  const [timeOpen, setTimeOpen] = useState(false)
  // Tied to an area, so a new area's map never pans to the last one's spot.
  const [recenter, setRecenter] = useState<{ point: LatLng; nonce: number; areaId: string }>()
  // A short message at the top; with a venue, tapping it opens that venue.
  const [toast, setToast] = useState<{ text: string; venueId?: string } | null>(null)
  // Community: the add/update form (optionally for one venue, optionally as the venue) and the owner page (?owner).
  const [contribute, setContribute] = useState<{ venueId?: string; asVenue?: boolean } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState<SearchQuery>(EMPTY_QUERY)
  const [sharing, setSharing] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [ownerOpen, setOwnerOpen] = useState(() => new URLSearchParams(window.location.search).has('owner'))

  const isDesktop = useIsDesktop()
  const { mode: themeMode, theme, setMode: setThemeMode } = useTheme()
  const dark = theme === 'dark'
  const vh = useViewportHeight()
  const now = useNow(preview)
  const located = useUserLocation(!showSplash)
  // Old links (before areas) are all Ossington spots.
  const linkedArea = LINK.areaId ?? (LINK.venueId ? LEGACY_AREA_ID : undefined)
  const { area, venues: listed, loading, here, detected, choose } = useArea(linkedArea, located.position)
  const location = relativeTo(located, area)
  useUsage(area.id, located.position, !showSplash)
  // Demo data is Ossington's.
  const demoing = demo && area.id === LEGACY_AREA_ID
  const community = useCommunity()
  const favourites = useFavourites()
  const venueKeys = useVenueKeys()
  const addVenueKey = venueKeys.add
  // Community features only make sense with real deals and a reachable API.
  const communityOn = community.available && !demoing

  const venues = useMemo(
    () =>
      demoing
        ? SAMPLE_VENUES
        : mergeCommunity(listed, submissionsForArea(community.submissions, area, listed, area.id === LEGACY_AREA_ID), area.origin, area.addressCity ?? area.city),
    [demoing, listed, community.submissions, area],
  )
  const rightNow = useMemo(() => rankVenues(venues, now, location.origin, filter), [venues, now, location.origin, filter])
  const daily = filter === 'daily'
  // The Daily specials view maps only the spots with a special still to come today.
  const mapItems = useMemo(
    () => (daily ? allOf(rightNow).filter((rv) => dailyToday(rv.venue, now)) : allOf(rightNow)),
    [rightNow, daily, now],
  )
  // Every venue, unfiltered: for search, and so changing filters never closes an open venue.
  const everything = useMemo(() => allOf(rankVenues(venues, now, location.origin)), [venues, now, location.origin])
  const selected = useMemo(() => (selectedId ? everything.find((rv) => rv.venue.id === selectedId) : undefined), [everything, selectedId])
  const favouriteItems = useMemo(() => favouriteLines(everything, favourites.ids, now), [everything, favourites.ids, now])

  const closeSearch = useCallback(() => setSearchOpen(false), [])
  const pickFromSearch = (id: string) => {
    // Show it on the map even when the current filter hides it.
    if (!mapItems.some((rv) => rv.venue.id === id)) setFilter('all')
    setSelectedId(id)
    setSearchOpen(false)
  }

  const toggleDemo = (on: boolean) => {
    setDemo(on)
    setSelectedId(null)
    try {
      localStorage.setItem(DEMO_KEY, on ? '1' : '0')
    } catch {
      // Storage unavailable: the choice just lasts until reload.
    }
  }

  const finishSplash = useCallback(() => {
    setShowSplash(false)
    try {
      sessionStorage.setItem(SPLASH_KEY, '1')
    } catch {
      // Private mode: the splash just plays again next time.
    }
  }, [])

  // Anonymous counts of what gets opened (lib/usage.ts).
  useEffect(() => {
    if (selectedId) track('venue')
  }, [selectedId])
  useEffect(() => {
    if (searchOpen) track('search')
  }, [searchOpen])
  useEffect(() => {
    if (sharing) track('share')
  }, [sharing])

  // Location opened the area someone is in.
  useEffect(() => {
    if (!detected) return
    setSelectedId(null)
    setToast({ text: `Showing ${detected.name}, where you are.` })
  }, [detected])

  // Tell people once why distances aren't from them.
  useEffect(() => {
    const messages: Partial<Record<typeof location.status, string>> = {
      far: `You're not near ${area.name} yet. Showing walks from ${area.origin.label}.`,
      denied: `Location is off. Showing walks from ${area.origin.label}.`,
      unavailable: `Couldn't find your location. Showing walks from ${area.origin.label}.`,
    }
    const message = messages[location.status]
    if (message) setToast({ text: message })
  }, [location.status, area.name, area.origin.label])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), toast.venueId ? 9000 : 4200)
    return () => clearTimeout(timer)
  }, [toast])

  // Heads-up when a favourite's happy hour is about to start (once a day each).
  // The iOS app does this with local notifications instead.
  useEffect(() => {
    if (now.isPreview || demoing) return
    const day = torontoDate()
    const due = startingSoon(everything, favourites.ids).find((rv) => !headsUpGiven(day).includes(rv.venue.id))
    if (!due || due.status.kind !== 'soon') return
    rememberHeadsUp(day, due.venue.id)
    setToast({ text: `⭐ ${due.venue.name}: happy hour starts at ${formatTime(due.status.startsAt, { compact: true })}`, venueId: due.venue.id })
  }, [everything, favourites.ids, now.isPreview, demoing])

  // Links: keep the address bar clean once read, and turn a venue owner's key into posting rights on this device.
  useEffect(() => {
    if (!LINK.venueId && !LINK.venueKey) return
    const owner = new URLSearchParams(window.location.search).has('owner')
    window.history.replaceState(null, '', window.location.pathname + (owner ? '?owner' : ''))
    const key = LINK.venueKey
    if (!key) return
    void fetch('/api/venue-key', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key }) })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok || typeof data.venueId !== 'string') throw new Error(data.error ?? 'Couldn’t check that venue key.')
        addVenueKey(data.venueId, key)
        const keyArea = areaById(data.areaId) ?? area
        choose(keyArea.id)
        setSelectedId(data.venueId)
        const name = (await LOADERS[keyArea.id]()).venues.find((v) => v.id === data.venueId)?.name ?? 'your venue'
        setToast({ text: `You can now post deals for ${name} from this device.` })
      })
      .catch((e: Error) => setToast({ text: e.message }))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, for the link this page opened with
  }, [addVenueKey])

  const snapHeights: Record<Snap, number> = {
    peek: 190,
    half: Math.round(vh * 0.5),
    full: vh - TOP_BAR - 10,
  }

  const insets: Insets = isDesktop
    ? { top: TOP_BAR + 8, right: GUTTER * 4, bottom: GUTTER * 3, left: GUTTER * 2 + SIDEBAR + (selected ? SIDEBAR + GUTTER : 0) }
    : { top: TOP_BAR + 8, right: 24, bottom: (selected ? Math.round(vh * DETAIL_SHARE) : snapHeights[snap]) + 12, left: 24 }

  const covered = isDesktop
    ? { bottom: 0, left: GUTTER * 2 + SIDEBAR + (selected ? SIDEBAR + GUTTER : 0) }
    : { bottom: insets.bottom - 12, left: 0 }

  // On phones the map buttons float just above the sheet: stacked when there's
  // room, side by side when it's tight, hidden once the sheet covers the map.
  const coverTop = vh - insets.bottom + 12
  const room = coverTop - CONTROL_GAP - (TOP_BAR + 8)
  const controlsLayout = isDesktop
    ? { className: '', style: undefined }
    : room >= CONTROL * 2 + CONTROL_GAP
      ? { className: '', style: { top: coverTop - CONTROL_GAP - (CONTROL * 2 + CONTROL_GAP) } }
      : room >= CONTROL
        ? { className: ' map-controls--row', style: { top: coverTop - CONTROL_GAP - CONTROL } }
        : { className: ' is-hidden', style: { top: TOP_BAR + 8 } }

  const locate = () => {
    track('locate')
    if (location.status === 'near' && location.position) {
      setRecenter({ point: location.position, nonce: Date.now(), areaId: area.id })
    } else {
      location.request()
      setRecenter({ point: area.origin, nonce: Date.now(), areaId: area.id })
    }
  }

  return (
    <LayoutGroup>
      <div className={`app${isDesktop ? ' app--desktop' : ''}`}>
        <RefractionFilter />

        <MapView
          // A new map for each area, framed on it.
          key={area.id}
          area={area}
          items={mapItems}
          selectedId={selectedId}
          onSelect={setSelectedId}
          user={location.position}
          dark={dark}
          insets={insets}
          covered={covered}
          recenterOn={recenter?.areaId === area.id ? recenter : undefined}
          now={now}
          daily={daily}
        />

        <TopBar
          area={area}
          here={here}
          onArea={(id) => {
            setSelectedId(null)
            setSearchOpen(false)
            if (id !== area.id) track(`area:${id}`)
            choose(id)
          }}
          splashing={showSplash}
          onLogo={() => setShowSplash(true)}
          themeMode={themeMode}
          onThemeMode={setThemeMode}
          onContribute={communityOn ? () => setContribute({}) : undefined}
          onSearch={() => setSearchOpen(true)}
        />

        <div className={`map-controls${controlsLayout.className}`} style={controlsLayout.style}>
          <button type="button" className="glass-button glass glass--refract icon-button" onClick={locate} aria-label="Show my location">
            <LocateIcon size={19} />
          </button>
          <button
            type="button"
            className={`glass-button glass glass--refract icon-button${now.isPreview ? ' glass--honey' : ''}`}
            onClick={() => setTimeOpen(true)}
            aria-label="Preview a different time"
          >
            <ClockIcon size={19} />
          </button>
        </div>

        <AnimatePresence>
          {(now.isPreview || demoing) && (
            <motion.div
              className="preview-banner glass glass--honey"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {[now.isPreview && `Previewing ${DAY_SHORT[now.day]} ${formatTime(now.minutes, { compact: true })}`, demoing && 'Demo data']
                .filter(Boolean)
                .join(' · ')}
              {now.isPreview && (
                <button type="button" onClick={() => setPreview(null)}>
                  Back to now
                </button>
              )}
              {demoing && (
                <button type="button" onClick={() => toggleDemo(false)}>
                  Real deals
                </button>
              )}
            </motion.div>
          )}
          {communityOn && !now.isPreview && !toast && location.status === 'near' && (
            <ArrivalNudge
              key="nudge"
              live={rightNow.live}
              position={location.position}
              hasVoted={(id) => community.myVoteToday(id) !== undefined}
              onVote={community.vote}
            />
          )}
          {toast && !now.isPreview && !demoing && (
            <motion.div
              className="toast glass glass--strong"
              role="status"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={() => {
                if (toast.venueId) setSelectedId(toast.venueId)
                setToast(null)
              }}
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>

        <NowSheet
          area={area}
          loading={loading}
          demo={demoing}
          now={now}
          rightNow={rightNow}
          filter={filter}
          onFilter={setFilter}
          selectedId={selectedId}
          onSelect={setSelectedId}
          originLabel={location.originLabel}
          isDesktop={isDesktop}
          snap={snap}
          onSnap={setSnap}
          snapHeights={snapHeights}
          onTime={() => setTimeOpen(true)}
          votes={communityOn ? community.votes : {}}
          onContribute={communityOn ? () => setContribute({}) : undefined}
          onSearch={() => setSearchOpen(true)}
          favourites={favouriteItems}
        />

        <AnimatePresence>
          {selected && (
            <VenueDetail
              key={selected.venue.id}
              rv={selected}
              now={now}
              isDesktop={isDesktop}
              onClose={() => setSelectedId(null)}
              checkIn={
                communityOn
                  ? {
                      tally: community.votes[selected.venue.id],
                      mine: community.myVoteToday(selected.venue.id),
                      onVote: (worked) => community.vote(selected.venue.id, worked),
                    }
                  : undefined
              }
              onSuggest={communityOn ? () => setContribute({ venueId: selected.venue.id }) : undefined}
              favourite={favourites.has(selected.venue.id)}
              onFavourite={() => favourites.toggle(selected.venue.id)}
              onShare={() => setSharing(true)}
              city={area.addressCity ?? area.city}
              meet={selected.venue.id === LINK.venueId ? LINK.meet : undefined}
              onPostAsVenue={
                communityOn && venueKeys.keys[selected.venue.id] ? () => setContribute({ venueId: selected.venue.id, asVenue: true }) : undefined
              }
              // Only listed venues have a page to claim (not places the community added).
              onClaim={communityOn && listed.some((v) => v.id === selected.venue.id) ? () => setClaiming(true) : undefined}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>{sharing && selected && <ShareSheet rv={selected} areaId={area.id} now={now} onClose={() => setSharing(false)} />}</AnimatePresence>

        <AnimatePresence>{claiming && selected && <ClaimSheet venue={selected.venue} onClose={() => setClaiming(false)} />}</AnimatePresence>

        <AnimatePresence>
          {timeOpen && (
            <TimePreview
              current={now}
              isPreview={now.isPreview}
              onApply={setPreview}
              onClose={() => setTimeOpen(false)}
              demo={demoing}
              onDemo={area.id === LEGACY_AREA_ID ? toggleDemo : undefined}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {searchOpen && (
            <SearchSheet
              items={everything}
              now={now}
              query={searchQuery}
              onQuery={setSearchQuery}
              onSelect={pickFromSearch}
              onClose={closeSearch}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {contribute && (
            <ContributeSheet
              venues={venues}
              city={area.addressCity ?? area.city}
              initialVenueId={contribute.venueId}
              venueKey={contribute.asVenue && contribute.venueId ? venueKeys.keys[contribute.venueId] : undefined}
              position={location.status === 'near' ? location.position : undefined}
              onSubmit={community.submit}
              onClose={() => setContribute(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {ownerOpen && (
            <OwnerPanel
              venueName={(id) => venues.find((v) => v.id === id)?.name ?? id}
              onChanged={community.refresh}
              onClose={() => {
                setOwnerOpen(false)
                window.history.replaceState(null, '', window.location.pathname)
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>{showSplash && <Splash onDone={finishSplash} />}</AnimatePresence>
      </div>
    </LayoutGroup>
  )
}
