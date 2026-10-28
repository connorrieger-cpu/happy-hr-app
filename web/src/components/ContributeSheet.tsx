import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { AREA_LIST } from '../data/areas'
import { LIMITS, validateSubmission, type SubmissionInput, type SubmissionKind } from '../lib/community'
import { DAY_SHORT, formatTime } from '../lib/time'
import type { LatLng, Special, Venue, Weekday } from '../lib/types'
import { CloseIcon, PinIcon } from './icons'

interface Props {
  venues: Venue[]
  /** Where new addresses are looked up. */
  city: string
  /** Pre-selects a listed venue ("Suggest an update"). */
  initialVenueId?: string
  /** The venue's own key: posts as the venue, for that venue only. */
  venueKey?: string
  position?: LatLng
  onSubmit: (input: Omit<SubmissionInput, 'device'>) => Promise<void>
  onClose: () => void
}

type SpecialDraft = { kind: Special['kind']; item: string; price: string }

const STEP = 15
const START_OPTIONS = Array.from({ length: ((24 - 6) * 60) / STEP }, (_, i) => 6 * 60 + i * STEP)
const blankSpecial = (): SpecialDraft => ({ kind: 'drink', item: '', price: '' })

/** Turns "Ossington Ave" into coordinates with Google's geocoder, when Google Maps is loaded. */
async function geocode(address: string, city: string): Promise<LatLng | undefined> {
  if (typeof google === 'undefined' || !google.maps?.importLibrary) return undefined
  try {
    const { Geocoder } = (await google.maps.importLibrary('geocoding')) as google.maps.GeocodingLibrary
    const { results } = await new Geocoder().geocode({ address: `${address}, ${city}, ON`, region: 'ca' })
    const loc = results[0]?.geometry.location
    return loc ? { lat: loc.lat(), lng: loc.lng() } : undefined
  } catch {
    return undefined
  }
}

export function ContributeSheet({ venues, city, initialVenueId, venueKey, position, onSubmit, onClose }: Props) {
  const listed = useMemo(() => [...venues].filter((v) => v.deals !== 'sample').sort((a, b) => a.name.localeCompare(b.name)), [venues])
  const [kind, setKind] = useState<SubmissionKind>('happy-hour')
  const [title, setTitle] = useState('')
  const [allDay, setAllDay] = useState(true)
  const [mode, setMode] = useState<'listed' | 'new'>(initialVenueId || listed.length ? 'listed' : 'new')
  const [venueId, setVenueId] = useState(initialVenueId ?? listed[0]?.id ?? '')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [here, setHere] = useState(false)
  const [days, setDays] = useState<Weekday[]>([])
  const [start, setStart] = useState(16 * 60)
  const [end, setEnd] = useState(18 * 60)
  const [specials, setSpecials] = useState<SpecialDraft[]>([blankSpecial()])
  const [note, setNote] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  // With a venue key the form posts for that venue only, as the venue.
  const asVenue = Boolean(venueKey && initialVenueId)
  const venueName = listed.find((v) => v.id === initialVenueId)?.name

  // End times run up to 12 hours after the start, past midnight if needed.
  const endOptions = useMemo(() => Array.from({ length: (12 * 60) / STEP }, (_, i) => start + (i + 1) * STEP), [start])

  const toggleDay = (d: Weekday) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  const updateSpecial = (i: number, patch: Partial<SpecialDraft>) =>
    setSpecials((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)))

  const submit = async () => {
    setProblem(null)
    const cleaned: Special[] = specials
      .filter((s) => s.item.trim())
      .map((s) => ({ kind: s.kind, item: s.item.trim(), ...(s.price.trim() && { price: Number(s.price) }) }))
    const venue = listed.find((v) => v.id === venueId)
    const daily = kind === 'daily'
    const deal = {
      kind,
      days,
      ...(!(daily && allDay) && { start, end }),
      ...(daily && title.trim() && { title: title.trim() }),
      specials: cleaned,
      note: note.trim() || undefined,
    }
    const input: Omit<SubmissionInput, 'device'> =
      mode === 'listed' && venue ? { venueId: venue.id, venueName: venue.name, ...deal } : { venueName: name, address, ...deal }
    if (asVenue) input.venueKey = venueKey

    // Check the cheap things before touching the network.
    const early = validateSubmission({ ...input, device: 'checking-locally' }, AREA_LIST)
    if (early) return setProblem(early)

    setBusy(true)
    try {
      if (mode === 'new') {
        const point = here && position ? position : await geocode(address, city)
        if (!point) {
          setBusy(false)
          return setProblem('Couldn’t find that address. Check it, or tap “I’m here now”.')
        }
        input.lat = point.lat
        input.lng = point.lng
        const far = validateSubmission({ ...input, device: 'checking-locally' }, AREA_LIST)
        if (far) {
          setBusy(false)
          return setProblem(far)
        }
      }
      await onSubmit(input)
      setDone(true)
    } catch (e) {
      setProblem(e instanceof Error ? e.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="contribute glass glass--strong"
        role="dialog"
        aria-label="Add a deal"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      >
        <div className="popover__head">
          <div>
            <h2 className="popover__title">{done ? 'Thanks! It’s live' : asVenue ? `Post a deal at ${venueName}` : 'Add a deal'}</h2>
            <p className="popover__sub">
              {asVenue
                ? done
                  ? 'It shows now, marked From the venue.'
                  : 'It goes live right away, marked From the venue. Post again to change it; ask us to remove an old one.'
                : done
                  ? 'It shows now, marked Community. Others can confirm it when they visit.'
                  : 'New spot, new times or new prices: it goes live right away, marked Community.'}
            </p>
          </div>
          <button type="button" className="glass-button glass icon-button" onClick={onClose} aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </div>

        {done ? (
          <div className="contribute__actions">
            <button type="button" className="glass-button glass glass--honey" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <div className="contribute__body">
            <fieldset className="field">
              <legend>What</legend>
              <div className="segmented segmented--two" role="radiogroup" aria-label="Kind of deal">
                {(['happy-hour', 'daily'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={kind === k}
                    className={kind === k ? 'is-active' : ''}
                    onClick={() => setKind(k)}
                  >
                    {kind === k && <motion.span layoutId="kind-pill" className="chip__pill" />}
                    {k === 'happy-hour' ? 'Happy hour' : 'Daily special'}
                  </button>
                ))}
              </div>
              {kind === 'daily' && (
                <input
                  className="input"
                  placeholder="Name, if it has one (e.g. Taco Tuesday)"
                  value={title}
                  maxLength={LIMITS.title}
                  onChange={(e) => setTitle(e.target.value)}
                  aria-label="Special’s name (optional)"
                />
              )}
            </fieldset>

            {!asVenue && (
            <fieldset className="field">
              <legend>Where</legend>
              <div className="segmented segmented--two" role="radiogroup" aria-label="Venue">
                {(['listed', 'new'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={mode === m}
                    className={mode === m ? 'is-active' : ''}
                    onClick={() => setMode(m)}
                    disabled={m === 'listed' && listed.length === 0}
                  >
                    {mode === m && <motion.span layoutId="where-pill" className="chip__pill" />}
                    {m === 'listed' ? 'A spot in the app' : 'Somewhere new'}
                  </button>
                ))}
              </div>
              {mode === 'listed' ? (
                <select className="input" value={venueId} onChange={(e) => setVenueId(e.target.value)} aria-label="Venue">
                  {listed.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} · {v.address}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="field__row field__row--stack">
                  <input
                    className="input"
                    placeholder="Name, e.g. Bar Raval"
                    value={name}
                    maxLength={LIMITS.name}
                    onChange={(e) => setName(e.target.value)}
                    aria-label="Venue name"
                  />
                  <input
                    className="input"
                    placeholder="Street address, e.g. 505 College St"
                    value={address}
                    maxLength={LIMITS.address}
                    onChange={(e) => setAddress(e.target.value)}
                    aria-label="Street address"
                  />
                  {position && (
                    <label className="check">
                      <input type="checkbox" checked={here} onChange={(e) => setHere(e.target.checked)} />
                      <PinIcon size={14} /> I’m here now (use my location for the pin)
                    </label>
                  )}
                </div>
              )}
            </fieldset>
            )}

            <fieldset className="field">
              <legend>When</legend>
              <div className="segmented" role="group" aria-label="Days">
                {DAY_SHORT.map((label, d) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={days.includes(d as Weekday)}
                    className={days.includes(d as Weekday) ? 'is-active is-picked' : ''}
                    onClick={() => toggleDay(d as Weekday)}
                  >
                    {label.slice(0, 2)}
                  </button>
                ))}
              </div>
              {kind === 'daily' && (
                <label className="check">
                  <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
                  All day (whenever they’re open)
                </label>
              )}
              {!(kind === 'daily' && allDay) && (
                <div className="field__row">
                  <select
                    className="input"
                    value={start}
                    onChange={(e) => {
                      const s = Number(e.target.value)
                      setStart(s)
                      if (end <= s || end > s + 12 * 60) setEnd(s + 2 * 60)
                    }}
                    aria-label="Starts"
                  >
                    {START_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {formatTime(m)}
                      </option>
                    ))}
                  </select>
                  <span className="field__to">to</span>
                  <select className="input" value={end} onChange={(e) => setEnd(Number(e.target.value))} aria-label="Ends">
                    {endOptions.map((m) => (
                      <option key={m} value={m}>
                        {formatTime(m)}
                        {m >= 24 * 60 ? ' (next day)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </fieldset>

            <fieldset className="field">
              <legend>Specials</legend>
              {specials.map((s, i) => (
                <div className="special-input" key={i}>
                  <button
                    type="button"
                    className="kind-toggle"
                    onClick={() => updateSpecial(i, { kind: s.kind === 'drink' ? 'food' : 'drink' })}
                    aria-label={`Kind: ${s.kind}. Tap to switch.`}
                  >
                    {s.kind === 'drink' ? '🍺' : '🍽️'}
                  </button>
                  <input
                    className="input input--price"
                    inputMode="decimal"
                    placeholder="$"
                    value={s.price}
                    onChange={(e) => updateSpecial(i, { price: e.target.value.replace(/[^0-9.]/g, '') })}
                    aria-label="Price (optional)"
                  />
                  <input
                    className="input"
                    placeholder={i === 0 ? 'pints of lager' : 'what’s on special'}
                    value={s.item}
                    maxLength={LIMITS.item}
                    onChange={(e) => updateSpecial(i, { item: e.target.value })}
                    aria-label="Special"
                  />
                  {specials.length > 1 && (
                    <button
                      type="button"
                      className="icon-plain"
                      onClick={() => setSpecials((prev) => prev.filter((_, j) => j !== i))}
                      aria-label="Remove this special"
                    >
                      <CloseIcon size={14} />
                    </button>
                  )}
                </div>
              ))}
              {specials.length < LIMITS.specials && (
                <button type="button" className="link-button" onClick={() => setSpecials((prev) => [...prev, blankSpecial()])}>
                  + Add another special
                </button>
              )}
            </fieldset>

            <fieldset className="field">
              <legend>{asVenue ? 'Anything to add? (optional)' : 'Where did you see it? (optional)'}</legend>
              <input
                className="input"
                placeholder={asVenue ? 'e.g. bar and patio only, not on holidays' : 'e.g. chalkboard by the door, their Instagram'}
                value={note}
                maxLength={LIMITS.note}
                onChange={(e) => setNote(e.target.value)}
                aria-label="Note"
              />
            </fieldset>

            {problem && (
              <p className="form-problem" role="alert">
                {problem}
              </p>
            )}

            <div className="contribute__actions">
              <button type="button" className="glass-button glass" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="glass-button glass glass--honey" onClick={submit} disabled={busy}>
                {busy ? 'Posting…' : asVenue ? 'Post it' : 'Share it'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  )
}
