import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { voteSummary, type VoteTally } from '../lib/community'
import type { RankedVenue } from '../lib/deals'
import { distanceMeters } from '../lib/geo'
import { torontoDate } from '../lib/time'
import type { LatLng } from '../lib/types'
import { CloseIcon } from './icons'

interface CheckInProps {
  tally?: VoteTally
  /** This device's answer today, if it has voted. */
  mine?: boolean
  onVote: (worked: boolean) => Promise<void>
  /** The deal to ask about, e.g. "$6 pints" or "Taco Tuesday". */
  deal?: string
}

/** "Did the deal work?" row for a venue's detail view. */
export function CheckIn({ tally, mine, onVote, deal }: CheckInProps) {
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const summary = voteSummary(tally)

  const vote = async (worked: boolean) => {
    setBusy(true)
    setProblem(null)
    try {
      await onVote(worked)
    } catch (e) {
      setProblem(e instanceof Error ? e.message : 'Couldn’t save that.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={`checkin checkin--${summary.mood}`}>
      <div className="checkin__text">
        <p className="checkin__title">
          {mine !== undefined ? 'Thanks for checking in' : deal ? `Here now? Did you get the ${deal}?` : 'Been here today? Did the deal work?'}
        </p>
        <p className="checkin__summary">
          {mine !== undefined && `You said it ${mine ? 'worked' : 'didn’t work'} today. `}
          {summary.text}
        </p>
        {problem && <p className="form-problem">{problem}</p>}
      </div>
      <div className="checkin__buttons" role="group" aria-label="Did the deal work?">
        <button type="button" className={`vote${mine === true ? ' is-mine' : ''}`} onClick={() => vote(true)} disabled={busy}>
          👍 <span>Worked</span>
        </button>
        <button type="button" className={`vote${mine === false ? ' is-mine' : ''}`} onClick={() => vote(false)} disabled={busy}>
          👎 <span>Didn’t</span>
        </button>
      </div>
    </section>
  )
}

const ARRIVED_METERS = 45
const NUDGED_KEY = 'happyhr:nudged'

function nudgedToday(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(NUDGED_KEY) ?? '{}')
    return saved.day === torontoDate() ? saved.ids : []
  } catch {
    return []
  }
}

function rememberNudge(id: string) {
  try {
    localStorage.setItem(NUDGED_KEY, JSON.stringify({ day: torontoDate(), ids: [...nudgedToday(), id] }))
  } catch {
    // Storage unavailable: the nudge may show again after a reload, which is harmless.
  }
}

interface NudgeProps {
  live: RankedVenue[]
  position?: LatLng
  hasVoted: (venueId: string) => boolean
  onVote: (venueId: string, worked: boolean) => Promise<void>
}

/**
 * When you're standing at a venue during its happy hour, a small pill asks
 * whether the deal worked. Once per venue per day; dismissing counts.
 */
export function ArrivalNudge({ live, position, hasVoted, onVote }: NudgeProps) {
  const [dismissed, setDismissed] = useState(nudgedToday)
  const [thanks, setThanks] = useState(false)

  const here = useMemo(() => {
    if (!position) return undefined
    return live.find(
      (rv) => distanceMeters(position, rv.venue) <= ARRIVED_METERS && !dismissed.includes(rv.venue.id) && !hasVoted(rv.venue.id),
    )
  }, [live, position, dismissed, hasVoted])

  useEffect(() => {
    if (!thanks) return
    const timer = setTimeout(() => setThanks(false), 2500)
    return () => clearTimeout(timer)
  }, [thanks])

  const close = (id: string) => {
    rememberNudge(id)
    setDismissed((prev) => [...prev, id])
  }

  const answer = async (id: string, worked: boolean) => {
    close(id)
    setThanks(true)
    await onVote(id, worked).catch(() => undefined)
  }

  return (
    <AnimatePresence>
      {(here || thanks) && (
        <motion.div
          className="nudge glass glass--strong"
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          role="status"
        >
          {thanks || !here ? (
            <span className="nudge__text">Thanks, that helps everyone 🍻</span>
          ) : (
            <>
              <span className="nudge__text">
                At <strong>{here.venue.name}</strong>? Did the deal work?
              </span>
              <button type="button" className="vote vote--small" onClick={() => answer(here.venue.id, true)} aria-label="It worked">
                👍
              </button>
              <button type="button" className="vote vote--small" onClick={() => answer(here.venue.id, false)} aria-label="It didn't work">
                👎
              </button>
              <button type="button" className="icon-plain" onClick={() => close(here.venue.id)} aria-label="Not now">
                <CloseIcon size={14} />
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
