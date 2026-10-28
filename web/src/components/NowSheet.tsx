import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react'
import { useMemo, useState, type ReactNode } from 'react'
import type { VoteTally } from '../lib/community'
import { dailyBoard, dailyToday, type DailyEntry } from '../lib/daily'
import { allOf, FILTERS, type DealFilter, type RankedVenue, type RightNow } from '../lib/deals'
import type { FavouriteLine } from '../lib/favourites'
import type { Area } from '../lib/types'
import { freshness } from '../lib/freshness'
import { mightBeOpen, openLabel, openState } from '../lib/hours'
import { DAY_NAMES, formatTime, type Clock } from '../lib/time'
import { DailyRow, DealCard, DealRow, SpotRow } from './DealCard'
import { ChevronDown, ClockIcon, SearchIcon } from './icons'
import { scrollRow } from './scrollRow'

export type Snap = 'peek' | 'half' | 'full'

interface Props {
  area: Area
  /** The area's spots are still loading. */
  loading: boolean
  demo: boolean
  now: Clock & { isPreview: boolean }
  rightNow: RightNow
  filter: DealFilter
  onFilter: (f: DealFilter) => void
  selectedId: string | null
  onSelect: (id: string) => void
  originLabel: string
  isDesktop: boolean
  snap: Snap
  onSnap: (s: Snap) => void
  /** Visible height of the sheet at each snap point. */
  snapHeights: Record<Snap, number>
  onTime: () => void
  votes: Record<string, VoteTally>
  /** Opens the add-a-deal form; omitted when the community API isn't available. */
  onContribute?: () => void
  /** Opens search. */
  onSearch: () => void
  /** Starred spots with what's on at each; the strip shows only when there are some. */
  favourites: FavouriteLine[]
}

const SNAPS: Snap[] = ['peek', 'half', 'full']

const reveal = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] },
  style: { overflow: 'hidden' },
} as const

export function NowSheet(props: Props) {
  const {
    area,
    loading,
    demo,
    now,
    rightNow,
    filter,
    onFilter,
    selectedId,
    onSelect,
    originLabel,
    isDesktop,
    snap,
    onSnap,
    snapHeights,
    onTime,
    votes,
    onContribute,
    onSearch,
    favourites,
  } = props
  const controls = useDragControls()
  const full = snapHeights.full
  const offset = full - snapHeights[snap]

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // Project the fling a little so a flick moves one snap point.
    const projected = offset + info.offset.y + info.velocity.y * 0.18
    const nearest = SNAPS.reduce((best, s) =>
      Math.abs(full - snapHeights[s] - projected) < Math.abs(full - snapHeights[best] - projected) ? s : best,
    )
    onSnap(nearest)
  }

  const cycle = () => onSnap(snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'half')

  const [showWeek, setShowWeek] = useState(false)
  const [showSpots, setShowSpots] = useState(false)
  const [showDailyWeek, setShowDailyWeek] = useState(false)

  const daily = filter === 'daily'
  const board = useMemo(() => (daily ? dailyBoard(allOf(rightNow), now) : null), [daily, rightNow, now])

  const liveCount = rightNow.live.length
  const next = rightNow.soon[0] ?? rightNow.later[0]
  const nextAt = next && 'startsAt' in next.status ? formatTime(next.status.startsAt, { compact: true }) : undefined
  const nothing = daily
    ? !board?.today.length && !board?.week.length
    : !liveCount && !rightNow.soon.length && !rightNow.later.length && !rightNow.rest.length && !rightNow.unlisted.length
  // Quiet hours: nothing on and nothing starting within two hours.
  const quiet = !liveCount && !rightNow.soon.length && filter === 'all'
  const todayFor = (rv: RankedVenue) => dailyToday(rv.venue, now)

  let index = 0
  const cards = (title: string, items: RankedVenue[], tone?: 'live') =>
    items.length > 0 && (
      <section className="sheet__section" key={title}>
        <h3 className={`section-title${tone ? ` section-title--${tone}` : ''}`}>
          {title}
          <span className="section-title__count">{items.length}</span>
        </h3>
        <ul className="card-list">
          <AnimatePresence initial={false}>
            {items.map((rv) => (
              <DealCard
                key={rv.venue.id}
                rv={rv}
                selected={rv.venue.id === selectedId}
                onSelect={onSelect}
                index={index++}
                tally={votes[rv.venue.id]}
                today={todayFor(rv)}
                stale={freshness(rv.venue, votes[rv.venue.id])?.stale}
              />
            ))}
          </AnimatePresence>
        </ul>
      </section>
    )

  const rows = (items: RankedVenue[]) => (
    <ul className="row-list">
      <AnimatePresence initial={false}>
        {items.map((rv) => (
          <DealRow key={rv.venue.id} rv={rv} selected={rv.venue.id === selectedId} onSelect={onSelect} today={todayFor(rv)} />
        ))}
      </AnimatePresence>
    </ul>
  )

  const dailyRows = (entries: DailyEntry[], dayLabel: string) => (
    <ul className="row-list">
      {entries.map((e, i) => (
        <DailyRow
          key={`${e.rv.venue.id}-${i}`}
          entry={e}
          dayLabel={dayLabel}
          minutes={dayLabel === 'Today' ? now.minutes : undefined}
          closed={dayLabel === 'Today' && !mightBeOpen(e.rv.venue, now)}
          selected={e.rv.venue.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )

  const toggle = (label: string, count: number, open: boolean, onToggle: () => void, body: ReactNode) => (
    <section className="sheet__section">
      <button type="button" className="section-title section-title--toggle" onClick={onToggle} aria-expanded={open}>
        {label}
        <span className="section-title__count">{count}</span>
        <ChevronDown size={15} className={open ? 'flip' : ''} />
      </button>
      <AnimatePresence initial={false}>{open && <motion.div {...reveal}>{body}</motion.div>}</AnimatePresence>
    </section>
  )

  const todayCount = board?.today.length ?? 0
  const title = daily ? (
    todayCount > 0 ? (
      <>
        {todayCount} daily special{todayCount === 1 ? '' : 's'} today
      </>
    ) : (
      'No daily specials left today'
    )
  ) : liveCount > 0 ? (
    <>
      <span className="live-dot" aria-hidden="true" />
      {liveCount} happy hour{liveCount === 1 ? '' : 's'} on now
    </>
  ) : (
    'Nothing on right now'
  )
  const sub = daily
    ? `Deals by day of the week · walking from ${originLabel}`
    : liveCount > 0 || !next
      ? `Nearest first · walking from ${originLabel}`
      : `Next up: ${next.venue.name} at ${nextAt}`

  return (
    <motion.section
      className={`sheet glass glass--strong ${isDesktop ? 'sheet--side' : 'sheet--bottom'}`}
      style={isDesktop ? undefined : { height: full }}
      initial={isDesktop ? { x: -40, opacity: 0 } : { y: full }}
      // Every axis in both layouts, so widening the window past 900px drops the phone's drag offset.
      animate={isDesktop ? { x: 0, y: 0, opacity: 1 } : { x: 0, y: offset, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 360, damping: 38 }}
      drag={isDesktop ? false : 'y'}
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ top: 0, bottom: full - snapHeights.peek }}
      dragElastic={0.06}
      dragMomentum={false}
      onDragEnd={onDragEnd}
      aria-label="Happy hours right now"
    >
      <header
        className="sheet__header"
        onPointerDown={(e) => !isDesktop && controls.start(e)}
        onClick={() => !isDesktop && snap === 'peek' && onSnap('half')}
      >
        {!isDesktop && (
          <button
            type="button"
            className="sheet__handle"
            aria-label={snap === 'full' ? 'Collapse list' : 'Expand list'}
            onClick={(e) => {
              e.stopPropagation()
              cycle()
            }}
          />
        )}
        <button
          type="button"
          className="eyebrow"
          onClick={(e) => {
            e.stopPropagation()
            onTime()
          }}
          title="Preview a different time"
        >
          <ClockIcon size={13} />
          {DAY_NAMES[now.day]} · {formatTime(now.minutes)}
          {now.isPreview && <span className="eyebrow__tag">Preview</span>}
        </button>
        <h2 className="sheet__title">{title}</h2>
        <p className="sheet__sub">{sub}</p>
      </header>

      <div className="chips" role="tablist" aria-label="Filter deals" ref={scrollRow}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`chip${filter === f.id ? ' is-active' : ''}${f.id === 'daily' ? ' chip--quiet' : ''}`}
            onClick={() => onFilter(f.id)}
          >
            {filter === f.id && (
              <motion.span layoutId="chip-pill" className="chip__pill" transition={{ type: 'spring', stiffness: 520, damping: 38 }} />
            )}
            <span className="chip__label">{f.label}</span>
          </button>
        ))}
      </div>

      <div className="sheet__scroll" style={isDesktop ? undefined : { paddingBottom: offset + 28 }}>
        {daily && board ? (
          <>
            {board.today.length > 0 && (
              <section className="sheet__section">
                <h3 className="section-title section-title--live">
                  Today
                  <span className="section-title__count">{board.today.length}</span>
                </h3>
                {dailyRows(board.today, 'Today')}
              </section>
            )}
            {board.week.length > 0 &&
              toggle(
                'Rest of the week',
                board.week.reduce((n, d) => n + d.entries.length, 0),
                showDailyWeek,
                () => setShowDailyWeek((v) => !v),
                board.week.map((d) => (
                  <div key={d.day} className="day-group">
                    <h4 className="day-group__title">{d.label}</h4>
                    {dailyRows(d.entries, d.label)}
                  </div>
                )),
              )}
          </>
        ) : (
          <>
            {quiet && next && (
              <div className="callout">
                <span className="callout__icon" aria-hidden="true">
                  {now.minutes < 6 * 60 ? '🌙' : '☀️'}
                </span>
                <p>
                  <strong>{now.minutes < 6 * 60 ? "Last call's come and gone." : "It's quiet on the strip."}</strong> The next
                  happy hours start at {nextAt}.
                </p>
              </div>
            )}
            {favourites.length > 0 && (
              <section className="sheet__section">
                <h3 className="section-title">Your spots</h3>
                <ul className="fav-strip" aria-label="Your spots" ref={scrollRow}>
                  {favourites.map(({ rv, label, tone }) => (
                    <li key={rv.venue.id}>
                      <button
                        type="button"
                        className={`fav fav--${tone}${rv.venue.id === selectedId ? ' is-selected' : ''}`}
                        onClick={() => onSelect(rv.venue.id)}
                      >
                        <span className="fav__name">{rv.venue.name}</span>
                        <span className="fav__label">
                          {tone === 'live' && <span className="live-dot" aria-hidden="true" />}
                          {label}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {cards('On now', rightNow.live, 'live')}
            {cards('Starting soon', rightNow.soon)}
            {rightNow.later.length > 0 && (
              <section className="sheet__section">
                <h3 className="section-title">
                  Later today
                  <span className="section-title__count">{rightNow.later.length}</span>
                </h3>
                {rows(rightNow.later)}
              </section>
            )}
            {rightNow.rest.length > 0 && toggle('Later this week', rightNow.rest.length, showWeek, () => setShowWeek((v) => !v), rows(rightNow.rest))}
            {rightNow.unlisted.length > 0 &&
              toggle(
                'More spots',
                rightNow.unlisted.length,
                showSpots,
                () => setShowSpots((v) => !v),
                <>
                  <p className="spot-hint">No happy hour listed. Tap one for directions, booking and its number.</p>
                  <button type="button" className="spot-search-link" onClick={onSearch}>
                    <SearchIcon size={15} /> Search by name, food or deal
                  </button>
                  <ul className="row-list">
                    {rightNow.unlisted.map((rv) => (
                      <SpotRow
                        key={rv.venue.id}
                        rv={rv}
                        selected={rv.venue.id === selectedId}
                        onSelect={onSelect}
                        today={todayFor(rv)}
                        open={openLabel(openState(rv.venue, now), now.day)}
                      />
                    ))}
                  </ul>
                  {onContribute && (
                    <p className="suggest">
                      Know a deal at one of these?{' '}
                      <button type="button" className="link-button" onClick={onContribute}>
                        Add it
                      </button>
                    </p>
                  )}
                </>,
              )}
          </>
        )}
        {loading ? (
          <p className="empty">Finding spots in {area.name}…</p>
        ) : (
          nothing && <p className="empty">{daily ? 'No daily specials found yet.' : 'No spots match this filter right now.'}</p>
        )}
        <p className="sheet__footnote">
          {demo
            ? `Demo data · Sample specials at real ${area.name} venues, for showing off the app. Not real deals.`
            : `Beta · Restaurants and bars that serve alcohol in ${area.covers ?? area.name}. Deals come from venue websites, booking pages and published listings, checked October 2026. “Reported” deals are unconfirmed, so check with the venue before you go.`}
        </p>
      </div>
    </motion.section>
  )
}
