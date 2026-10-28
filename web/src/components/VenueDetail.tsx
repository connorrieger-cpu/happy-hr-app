import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react'
import { useEffect, useState } from 'react'
import { usePlacePhoto } from '../hooks/usePlacePhoto'
import { dailyDays, dailyDetail, dailyHours, dailyLabel, dailyOn, dailyToday } from '../lib/daily'
import { focusWindow, formatItem, formatPrice, formatSpecial, hasDeals, headlineSpecial, isEndingSoon, type RankedVenue } from '../lib/deals'
import type { VoteTally } from '../lib/community'
import { freshness, type Freshness } from '../lib/freshness'
import { formatDistance } from '../lib/geo'
import { CLOSING_SOON_MINUTES, openLabel, openState, weekHours } from '../lib/hours'
import { dealLine } from '../lib/share'
import { DAY_SHORT, formatDuration, formatRange, formatTime, type Clock, type VenueStatus } from '../lib/time'
import type { DailySpecial, DealProvenance, HappyHourWindow, Special, Venue, Weekday } from '../lib/types'
import { venueVibes } from '../lib/vibes'
import {
  BellIcon,
  CalendarIcon,
  ChevronDown,
  CloseIcon,
  DirectionsIcon,
  DrinkIcon,
  ExternalIcon,
  FoodIcon,
  GlobeIcon,
  MenuIcon,
  PhoneIcon,
  PinIcon,
  ShareIcon,
  StarIcon,
  WalkIcon,
} from './icons'
import { CheckIn } from './CheckIn'
import { downloadReminder } from './remind'
import { VIBE_GLYPH } from './vibes'
import { StatusRing } from './status'

const PROVENANCE_TITLE: Record<DealProvenance, string> = {
  venue: 'From the venue',
  reported: 'Reported online',
  community: 'From the community',
  sample: 'Sample deal',
  none: 'No deals listed',
}

const BOOKING_LABEL: Record<NonNullable<Venue['booking']>['provider'], string> = {
  opentable: 'Book on OpenTable',
  resy: 'Book on Resy',
  google: 'Reserve on Google',
}

/** "(416) 532-8000" → "tel:+14165328000". */
const telHref = (phone: string) => `tel:+1${phone.replace(/\D/g, '')}`

/** "https://www.thehaifaroom.com/" → "thehaifaroom.com". */
const siteLabel = (url: string) => new URL(url).hostname.replace(/^www\./, '')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2026-09" → "Sep 2026"; "2025" and "undated" stay as they are. */
function formatSourceDate(date: string): string {
  const [year, month] = date.split('-')
  return month ? `${MONTHS[Number(month) - 1]} ${year}` : year
}

interface Props {
  rv: RankedVenue
  now: Clock
  isDesktop: boolean
  onClose: () => void
  /** Community check-ins; omitted when the community API isn't available. */
  checkIn?: { tally?: VoteTally; mine?: boolean; onVote: (worked: boolean) => Promise<void> }
  /** Opens the "add a happy hour" form for this venue. */
  onSuggest?: () => void
  favourite: boolean
  onFavourite: () => void
  onShare: () => void
  /** For directions: "Toronto", "Guelph". */
  city: string
  /** A meeting time from a shared plan link (`&meet=`), minutes after midnight. */
  meet?: number
  /** This device holds the venue's key: post deals as the venue. */
  onPostAsVenue?: () => void
  /** Ask to manage this venue's page. */
  onClaim?: () => void
}

function headline(s: VenueStatus): { title: string; sub: string } {
  switch (s.kind) {
    case 'live':
      return {
        title: isEndingSoon(s) ? 'Ending soon. Go now!' : 'Happy hour is on',
        sub: `Ends ${formatTime(s.endsAt, { compact: true })} · ${formatDuration(s.minutesLeft)} left`,
      }
    case 'soon':
      return { title: `Starts in ${formatDuration(s.startsIn)}`, sub: `Today at ${formatTime(s.startsAt, { compact: true })}` }
    case 'later':
      return { title: 'Later today', sub: `Starts at ${formatTime(s.startsAt, { compact: true })}` }
    case 'none':
      return s.next
        ? { title: 'Not today', sub: `Next: ${DAY_SHORT[s.next.day]} at ${formatTime(s.next.startsAt, { compact: true })}` }
        : { title: 'No happy hour listed', sub: '' }
  }
}

/** Only worth a line when it changes how much to trust the deal. */
function FreshLine({ fresh }: { fresh?: Freshness }) {
  if (fresh?.confirmed) return <p className="status-block__fresh is-confirmed">{fresh.label}</p>
  if (fresh?.stale) return <p className="status-block__fresh is-stale">May be out of date · {fresh.label}</p>
  return null
}

function SpecialRow({ special }: { special: Special }) {
  return (
    <li className="special-row">
      <span className="special-row__price">{special.price != null ? formatPrice(special.price) : '✦'}</span>
      <span className="special-row__item">{formatItem(special.item)}</span>
    </li>
  )
}

/** A small bell that hands over a weekly calendar reminder for one deal. */
function RemindButton({ venue, deal, kind }: { venue: Venue; deal: HappyHourWindow | DailySpecial; kind: 'happy-hour' | 'daily' }) {
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const timer = setTimeout(() => setDone(false), 3000)
    return () => clearTimeout(timer)
  }, [done])
  return (
    <button
      type="button"
      className={`remind${done ? ' is-done' : ''}`}
      onClick={() => {
        downloadReminder(venue, deal, kind)
        setDone(true)
      }}
      title="Weekly reminder, 15 minutes before"
      aria-label={kind === 'daily' ? `Remind me about ${dailyLabel(deal as DailySpecial)} every week` : 'Remind me every week before happy hour'}
    >
      <BellIcon size={14} />
      <span>{done ? 'Check your calendar' : 'Remind me'}</span>
    </button>
  )
}

export function VenueDetail(props: Props) {
  const { rv, now, isDesktop, onClose, checkIn, onSuggest, favourite, onFavourite, onShare, city, meet, onPostAsVenue, onClaim } = props
  const { venue, status, walkMin, distanceM } = rv
  const hh = focusWindow(status)
  const drinks = hh?.specials.filter((s) => s.kind === 'drink') ?? []
  const food = hh?.specials.filter((s) => s.kind === 'food') ?? []
  const { title, sub } = headline(status)
  const dailies = venue.dailySpecials ?? []
  const todaysSpecial = dailyToday(venue, now)
  const unlisted = venue.happyHours.length === 0
  const anyDeal = hasDeals(venue)
  const lead = headlineSpecial(hh) ?? (unlisted ? todaysSpecial?.specials[0] : undefined)
  // The next day with a daily special, for "No special today · Next: Wed".
  const nextDaily = Array.from({ length: 6 }, (_, i) => ((now.day + i + 1) % 7) as Weekday)
    .map((day) => ({ day, special: dailyOn(venue, day)[0] }))
    .find((d) => d.special)
  const controls = useDragControls()
  const week: Weekday[] = Array.from({ length: 7 }, (_, i) => ((now.day + i) % 7) as Weekday)
  const photo = usePlacePhoto(venue.placeId)
  const [photoReady, setPhotoReady] = useState(false)
  const open = openState(venue, now)
  const [showHours, setShowHours] = useState(false)
  const vibes = venueVibes(venue, now)
  const fresh = freshness(venue, checkIn?.tally)
  // Name the deal when asking if it worked: "Got the $6 pints today?"
  const meetDeal = meet != null ? dealLine(rv, now) : undefined
  const checkInDeal = status.kind === 'live' && lead ? formatSpecial(lead) : unlisted && todaysSpecial ? dailyLabel(todaysSpecial) : undefined

  const query = encodeURIComponent(`${venue.name}, ${venue.address}, ${city}, ON`)
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=walking`
  const placeUrl = venue.googleMapsUrl ?? `https://www.google.com/maps/search/?api=1&query=${query}`

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose()
  }

  return (
    <motion.aside
      className={`detail glass glass--strong ${isDesktop ? 'detail--side' : 'detail--bottom'}`}
      initial={isDesktop ? { x: -24, opacity: 0 } : { y: '100%' }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      exit={isDesktop ? { x: -24, opacity: 0 } : { y: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 40 }}
      drag={isDesktop ? false : 'y'}
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.6 }}
      onDragEnd={onDragEnd}
      aria-label={venue.name}
    >
      {/* Only the header drags the sheet, so the body below can scroll freely. */}
      <div
        className={`detail__hero vibe--${venue.vibe}${photo && photoReady ? ' has-photo' : ''}`}
        onPointerDown={(e) => !isDesktop && controls.start(e)}
      >
        {photo && <img className="detail__photo" src={photo.url} alt="" draggable={false} onLoad={() => setPhotoReady(true)} />}
        <span className="detail__bubbles" aria-hidden="true" />
        {!isDesktop && <span className="sheet__handle sheet__handle--static" aria-hidden="true" />}
        <span className={`detail__status detail__status--${status.kind}`}>
          {status.kind === 'live' && <span className="live-dot" aria-hidden="true" />}
          {unlisted
            ? todaysSpecial
              ? 'Special today'
              : dailies.length
                ? 'Daily specials'
                : 'No deals listed'
            : status.kind === 'live'
              ? 'On now'
              : status.kind === 'soon'
                ? 'Starting soon'
                : status.kind === 'later'
                  ? 'Later today'
                  : 'Not today'}
        </span>
        <span className="detail__glyph" aria-hidden="true">
          {VIBE_GLYPH[venue.vibe]}
        </span>
        {lead && (
          <span className={`detail__lead glass ${status.kind === 'live' || (unlisted && todaysSpecial) ? 'glass--honey' : 'glass--strong'}`}>
            {formatSpecial(lead)}
          </span>
        )}
        <div className="detail__tools" onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" className="glass-button glass detail__tool" onClick={onShare} aria-label={`Share ${venue.name}`}>
            <ShareIcon size={17} />
          </button>
          <button
            type="button"
            className={`glass-button glass detail__tool${favourite ? ' is-on' : ''}`}
            onClick={onFavourite}
            aria-pressed={favourite}
            aria-label={favourite ? 'Saved to your spots' : 'Save to your spots'}
          >
            <StarIcon size={17} filled={favourite} />
          </button>
          <button type="button" className="glass-button glass detail__tool" onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>
        {photo?.author && photoReady && (
          <a
            className="detail__credit"
            href={photo.author.url}
            target="_blank"
            rel="noreferrer"
            onPointerDown={(e) => e.stopPropagation()}
          >
            Photo: {photo.author.name}
          </a>
        )}
      </div>

      <div className="detail__body">
        <h2 className="detail__name">{venue.name}</h2>
        <p className="detail__meta">
          {venue.category}
          <span className="dot-sep" aria-hidden="true" />
          <PinIcon size={13} /> {venue.address}
        </p>
        <p className="detail__meta">
          <WalkIcon size={13} /> {walkMin} min walk · {formatDistance(distanceM)}
          {open.kind !== 'unknown' && (
            <>
              <span className="dot-sep" aria-hidden="true" />
              <button
                type="button"
                className={`open-line open-line--${open.kind}${open.kind === 'open' && open.closesIn <= CLOSING_SOON_MINUTES ? ' is-closing' : ''}`}
                onClick={() => setShowHours((v) => !v)}
                aria-expanded={showHours}
              >
                {openLabel(open, now.day)}
                <ChevronDown size={13} className={showHours ? 'flip' : ''} />
              </button>
            </>
          )}
        </p>
        <AnimatePresence initial={false}>
          {showHours && (
            <motion.ul
              className="schedule schedule--hours"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              {weekHours(venue, now.day).map((h, i) => (
                <li key={h.day} className={`schedule__row${i === 0 ? ' is-today' : ''}`}>
                  <span className="schedule__day">{i === 0 ? 'Today' : DAY_SHORT[h.day]}</span>
                  <span className="schedule__times">{h.text === 'Closed' ? <span className="faint">Closed</span> : h.text}</span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
        {meet != null && (
          <div className="meet-banner glass glass--honey" role="note">
            <strong>Meet here at {formatTime(meet, { compact: true })}?</strong>
            {meetDeal && <span>{meetDeal}</span>}
          </div>
        )}
        {(vibes.length > 0 || venue.tags.length > 0) && (
          <ul className="tags">
            {vibes.map((v) => (
              <li key={v.id} className="tag tag--vibe">
                <span aria-hidden="true">{v.emoji}</span> {v.label}
              </li>
            ))}
            {venue.tags.map((t) => (
              <li key={t} className="tag">
                {t}
              </li>
            ))}
          </ul>
        )}

        {unlisted && todaysSpecial ? (
          <div className="status-block glass status-block--today">
            <span className="status-block__glyph" aria-hidden="true">
              🗓️
            </span>
            <div>
              <p className="status-block__title">Today: {dailyLabel(todaysSpecial)}</p>
              <p className="status-block__sub">
                {todaysSpecial.title ? `${dailyDetail(todaysSpecial)} · ` : ''}
                {dailyHours(todaysSpecial)}
              </p>
              <FreshLine fresh={fresh} />
            </div>
          </div>
        ) : unlisted && nextDaily ? (
          <div className="status-block glass status-block--none">
            <span className="status-block__glyph" aria-hidden="true">
              🗓️
            </span>
            <div>
              <p className="status-block__title">No special today</p>
              <p className="status-block__sub">
                Next: {DAY_SHORT[nextDaily.day]} · {dailyLabel(nextDaily.special)}
              </p>
            </div>
          </div>
        ) : unlisted ? (
          <div className="status-block glass status-block--none">
            <span className="status-block__glyph" aria-hidden="true">
              🍻
            </span>
            <div>
              <p className="status-block__title">No deals listed yet</p>
              <p className="status-block__sub">
                {onSuggest ? (
                  <>
                    Know one?{' '}
                    <button type="button" className="link-button" onClick={onSuggest}>
                      Add it for everyone
                    </button>
                  </>
                ) : (
                  'Ask the venue about specials.'
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className={`status-block glass status-block--${status.kind}`}>
            <StatusRing status={status} size={64} />
            <div>
              <p className="status-block__title">{title}</p>
              {sub && <p className="status-block__sub">{sub}</p>}
              <FreshLine fresh={fresh} />
            </div>
          </div>
        )}

        {hh && (
          <section className="detail__section">
            <h3 className="section-title">
              {status.kind === 'live' ? 'The specials' : status.kind === 'none' ? 'Next specials' : "Today's specials"}
              <span className="section-title__note">{formatRange(hh)}</span>
            </h3>
            {hh.note && <p className="window-note">{hh.note}</p>}
            <div className="specials-grid">
              {drinks.length > 0 && (
                <div>
                  <p className="specials-grid__label">
                    <DrinkIcon size={14} /> Drinks
                  </p>
                  <ul className="special-rows">
                    {drinks.map((s, i) => (
                      <SpecialRow key={i} special={s} />
                    ))}
                  </ul>
                </div>
              )}
              {food.length > 0 && (
                <div>
                  <p className="specials-grid__label">
                    <FoodIcon size={14} /> Food
                  </p>
                  <ul className="special-rows">
                    {food.map((s, i) => (
                      <SpecialRow key={i} special={s} />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {dailies.length > 0 && (
          <section className="detail__section">
            <h3 className="section-title">Daily specials</h3>
            <ul className="daily-list">
              {dailies.map((d, i) => (
                <li key={i} className={`daily-item${d.days.includes(now.day) ? ' is-today' : ''}`}>
                  <span className="daily-item__days">{dailyDays(d)}</span>
                  <span className="daily-item__body">
                    {d.title && <span className="daily-item__title">{d.title}</span>}
                    <span className="daily-item__detail">{dailyDetail(d)}</span>
                    {d.note && <span className="daily-item__note">{d.note}</span>}
                  </span>
                  <span className="daily-item__side">
                    <span className="daily-item__hours">{dailyHours(d)}</span>
                    {venue.deals !== 'sample' && <RemindButton venue={venue} deal={d} kind="daily" />}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!unlisted && (
          <section className="detail__section">
            <h3 className="section-title">
              This week
              {hh && venue.deals !== 'sample' && <RemindButton venue={venue} deal={hh} kind="happy-hour" />}
            </h3>
            <ul className="schedule">
              {week.map((day, i) => {
                const windows = venue.happyHours.filter((w) => w.days.includes(day)).sort((a, b) => a.start - b.start)
                return (
                  <li key={day} className={`schedule__row${i === 0 ? ' is-today' : ''}`}>
                    <span className="schedule__day">{i === 0 ? 'Today' : DAY_SHORT[day]}</span>
                    <span className="schedule__times">
                      {windows.length ? windows.map((w) => formatRange(w)).join('  ·  ') : <span className="faint">None</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <div className="detail__actions">
          <a className="glass-button glass glass--honey action" href={directionsUrl} target="_blank" rel="noreferrer">
            <DirectionsIcon size={17} /> Directions
          </a>
          {venue.booking ? (
            <a className="glass-button glass action" href={venue.booking.url} target="_blank" rel="noreferrer">
              <CalendarIcon size={17} /> {BOOKING_LABEL[venue.booking.provider]}
            </a>
          ) : venue.phone ? (
            <a className="glass-button glass action" href={telHref(venue.phone)}>
              <PhoneIcon size={17} /> Call
            </a>
          ) : (
            <a className="glass-button glass action" href={placeUrl} target="_blank" rel="noreferrer">
              <ExternalIcon size={17} /> Google Maps
            </a>
          )}
        </div>

        <div className="detail__links">
          {venue.menuUrl && (
            <a className="link-chip" href={venue.menuUrl} target="_blank" rel="noreferrer">
              <MenuIcon size={14} /> Menu
            </a>
          )}
          {venue.phone && (
            <a className="link-chip" href={telHref(venue.phone)}>
              <PhoneIcon size={14} /> {venue.phone}
            </a>
          )}
          {venue.website && (
            <a className="link-chip" href={venue.website} target="_blank" rel="noreferrer">
              <GlobeIcon size={14} /> {siteLabel(venue.website)}
            </a>
          )}
          {(venue.booking || venue.phone) && (
            <a className="link-chip" href={placeUrl} target="_blank" rel="noreferrer">
              <ExternalIcon size={14} /> Google Maps
            </a>
          )}
        </div>

        {anyDeal && (
          <section className={`provenance provenance--${venue.deals}`}>
            <p className="provenance__title">
              {PROVENANCE_TITLE[venue.deals]}
              {fresh && !fresh.confirmed && <span className="provenance__fresh">{fresh.label}</span>}
            </p>
            <p className="provenance__text">
              {venue.deals === 'sample'
                ? `These specials are placeholders for the beta and haven't been confirmed with ${venue.name}.`
                : venue.deals === 'reported'
                  ? `From listings, not confirmed by ${venue.name}. Check with them before you go.`
                  : venue.deals === 'community'
                    ? 'Added by people using Happy HR and not checked by us. Check-ins show whether it’s still on.'
                    : 'Happy hours change, so check with the venue before you go.'}
            </p>
            {venue.sources && venue.sources.length > 0 && (
              <ul className="provenance__sources">
                {venue.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.label}
                      <ExternalIcon size={12} />
                    </a>
                    <span className="faint"> · {formatSourceDate(s.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {checkIn && anyDeal && <CheckIn {...checkIn} deal={checkInDeal} />}

        {onPostAsVenue ? (
          <p className="suggest suggest--venue">
            You manage this page.{' '}
            <button type="button" className="link-button" onClick={onPostAsVenue}>
              Post a deal
            </button>
          </p>
        ) : (
          onSuggest &&
          anyDeal && (
            <p className="suggest">
              Something changed, or missing a deal?{' '}
              <button type="button" className="link-button" onClick={onSuggest}>
                Suggest an update
              </button>
            </p>
          )
        )}
        {onClaim && !onPostAsVenue && (
          <p className="suggest suggest--quiet">
            Run {venue.name}?{' '}
            <button type="button" className="link-button" onClick={onClaim}>
              Claim this page
            </button>
          </p>
        )}
      </div>
    </motion.aside>
  )
}
