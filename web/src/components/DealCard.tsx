import { motion } from 'motion/react'
import { voteSummary, type VoteTally } from '../lib/community'
import { dailyDetail, dailyHours, dailyLabel, dailyRunning, type DailyEntry } from '../lib/daily'
import { focusWindow, formatSpecial, headlineSpecial, isEndingSoon, type RankedVenue } from '../lib/deals'
import { DAY_SHORT, formatTime, type VenueStatus } from '../lib/time'
import type { DailySpecial } from '../lib/types'
import { ChevronRight, WalkIcon } from './icons'
import { statusLine, StatusRing } from './status'
import { VIBE_GLYPH } from './vibes'

interface Props {
  rv: RankedVenue
  selected: boolean
  onSelect: (id: string) => void
  index: number
  tally?: VoteTally
  /** Today's daily special, shown as a small pill. */
  today?: DailySpecial
  /** The deal may be out of date (old listing, no recent check-ins). */
  stale?: boolean
}

/** A quiet note about today's daily special; never competes with the happy-hour timer. */
function TodayPill({ special }: { special: DailySpecial }) {
  return <span className="today-pill">Today · {dailyLabel(special)}</span>
}

export function DealCard({ rv, selected, onSelect, index, tally, today, stale }: Props) {
  const { venue, status, walkMin } = rv
  const specials = focusWindow(status)?.specials ?? []
  const shown = specials.slice(0, 3)

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.035, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <button
        type="button"
        className={`card card--${status.kind}${selected ? ' is-selected' : ''}`}
        onClick={() => onSelect(venue.id)}
      >
        <StatusRing status={status} />
        <span className="card__body">
          <span className="card__top">
            <span className="card__name">{venue.name}</span>
            <span className="card__walk">
              <WalkIcon size={13} />
              {walkMin} min
            </span>
          </span>
          <span className="card__meta">
            {venue.category}
            <span className="dot-sep" aria-hidden="true" />
            <span className={isEndingSoon(status) ? 'card__status is-ending' : 'card__status'}>{statusLine(status)}</span>
          </span>
          {shown.length > 0 && (
            <span className="card__specials">
              {shown.map((s, i) => (
                <span key={i} className={`special-pill special-pill--${s.kind}`}>
                  {formatSpecial(s)}
                </span>
              ))}
              {venue.deals === 'sample' && <span className="sample-tag">Sample</span>}
              {venue.deals === 'community' && <span className="sample-tag">Community</span>}
              <VoteBadge tally={tally} />
              {stale && voteSummary(tally).mood === 'none' && <span className="sample-tag sample-tag--stale">May be out of date</span>}
            </span>
          )}
          {today && <TodayPill special={today} />}
        </span>
        <ChevronRight className="card__chevron" size={18} />
      </button>
    </motion.li>
  )
}

/** Tiny hint on a card: "✓ 3" when people confirmed it lately, "Not working?" when they didn't. */
function VoteBadge({ tally }: { tally?: VoteTally }) {
  const { mood } = voteSummary(tally)
  if (mood === 'confirmed') return <span className="vote-badge vote-badge--ok" title="People said this deal worked">✓ {tally!.yes}</span>
  if (mood === 'disputed') return <span className="vote-badge vote-badge--bad">Not working?</span>
  return null
}

function rowWhen(s: VenueStatus): [day: string, time: string] {
  switch (s.kind) {
    case 'live':
      return ['Now', formatTime(s.endsAt, { compact: true })]
    case 'soon':
    case 'later':
      return ['', formatTime(s.startsAt, { compact: true })]
    case 'none':
      return s.next ? [DAY_SHORT[s.next.day], formatTime(s.next.startsAt, { compact: true })] : ['', '—']
  }
}

/** Row for a spot with no known happy hour: what it is, how far, and today's special or whether it's open. */
export function SpotRow({ rv, selected, onSelect, today, open }: Omit<Props, 'index'> & { open?: string }) {
  const { venue, walkMin } = rv
  return (
    <motion.li layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" className={`row row--spot${selected ? ' is-selected' : ''}`} onClick={() => onSelect(venue.id)}>
        <span className="row__glyph" aria-hidden="true">
          {VIBE_GLYPH[venue.vibe]}
        </span>
        <span className="row__body">
          <span className="row__name">{venue.name}</span>
          <span className="row__meta">
            {venue.category}
            <span className="dot-sep" aria-hidden="true" />
            {today ? (
              <span className="row__deal">Today · {dailyLabel(today)}</span>
            ) : open ? (
              <span className={open.startsWith('Open') ? 'row__open' : undefined}>{open}</span>
            ) : (
              venue.address
            )}
          </span>
        </span>
        <span className="card__walk">
          <WalkIcon size={13} />
          {walkMin} min
        </span>
      </button>
    </motion.li>
  )
}

/** Compact row for venues whose happy hour isn't on yet. */
export function DealRow({ rv, selected, onSelect, today }: Omit<Props, 'index'>) {
  const { venue, status, walkMin } = rv
  const best = headlineSpecial(focusWindow(status))
  const [day, time] = rowWhen(status)

  return (
    <motion.li layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" className={`row${selected ? ' is-selected' : ''}`} onClick={() => onSelect(venue.id)}>
        <span className="row__when">
          {day && <span className="row__day">{day}</span>}
          <span className="row__time">{time}</span>
        </span>
        <span className="row__body">
          <span className="row__name">{venue.name}</span>
          <span className="row__meta">
            {venue.category}
            {best && (
              <>
                <span className="dot-sep" aria-hidden="true" />
                <span className="row__deal">{formatSpecial(best)}</span>
              </>
            )}
          </span>
          {today && <TodayPill special={today} />}
        </span>
        <span className="card__walk">
          <WalkIcon size={13} />
          {walkMin} min
        </span>
      </button>
    </motion.li>
  )
}

interface DailyRowProps {
  entry: DailyEntry
  /** "Today", "Tomorrow", "Wednesday"… */
  dayLabel: string
  /** Minutes now, for today's rows: marks the ones running. */
  minutes?: number
  /** The venue is closed right now (by its hours), so nothing there is on. */
  closed?: boolean
  selected: boolean
  onSelect: (id: string) => void
}

/** A daily special in the Daily specials view: when, where and what. */
export function DailyRow({ entry, dayLabel, minutes, closed, selected, onSelect }: DailyRowProps) {
  const { rv, special } = entry
  const on = minutes != null && !closed && dailyRunning(special, minutes)
  const allDay = dailyHours(special) === 'All day'
  // Running with hours: say when it ends. Otherwise when it starts, or "All day".
  const [when, time] = allDay
    ? [on ? 'On' : dayLabel === 'Today' ? 'Today' : dayLabel.slice(0, 3), 'All day']
    : on
      ? ['Till', formatTime(special.end!, { compact: true })]
      : [dayLabel === 'Today' ? 'Today' : dayLabel.slice(0, 3), formatTime(special.start!, { compact: true })]
  return (
    <li>
      <button type="button" className={`row row--daily${selected ? ' is-selected' : ''}`} onClick={() => onSelect(rv.venue.id)}>
        <span className="row__when">
          <span className={`row__day${on ? ' is-on' : ''}`}>{when}</span>
          <span className="row__time">{time}</span>
        </span>
        <span className="row__body">
          <span className="row__name">{rv.venue.name}</span>
          <span className="row__meta">
            {special.title && (
              <>
                <span className="row__deal">{special.title}</span>
                <span className="dot-sep" aria-hidden="true" />
              </>
            )}
            {dailyDetail(special)}
          </span>
        </span>
        <span className="card__walk">
          <WalkIcon size={13} />
          {rv.walkMin} min
        </span>
      </button>
    </li>
  )
}
