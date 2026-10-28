import { motion } from 'motion/react'
import { useState } from 'react'
import { DAY_SHORT, formatTime, type Clock } from '../lib/time'
import type { Weekday } from '../lib/types'
import { CloseIcon } from './icons'
import { scrollRow } from './scrollRow'

interface Props {
  current: Clock
  isPreview: boolean
  onApply: (clock: Clock | null) => void
  onClose: () => void
  demo: boolean
  /** Only where there's demo data (Ossington). */
  onDemo?: (on: boolean) => void
}

const PRESETS: { label: string; clock: Clock }[] = [
  { label: 'Fri after work', clock: { day: 5, minutes: 17 * 60 + 30 } },
  { label: 'Sat late night', clock: { day: 6, minutes: 23 * 60 + 30 } },
  { label: 'Sun afternoon', clock: { day: 0, minutes: 15 * 60 } },
  { label: 'Tue 4 PM', clock: { day: 2, minutes: 16 * 60 } },
]

/** Pick any day and time to see what the app looks like then. */
export function TimePreview({ current, isPreview, onApply, onClose, demo, onDemo }: Props) {
  const [day, setDay] = useState<Weekday>(current.day)
  const [minutes, setMinutes] = useState(Math.round(current.minutes / 15) * 15)

  const apply = (clock: Clock) => {
    onApply(clock)
    onClose()
  }

  return (
    <>
      <motion.div
        className="scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="popover glass glass--strong"
        role="dialog"
        aria-label="Preview a time"
        initial={{ opacity: 0, scale: 0.94, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -6 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      >
        <div className="popover__head">
          <div>
            <h2 className="popover__title">Preview a time</h2>
            <p className="popover__sub">See what's on at any hour</p>
          </div>
          <button type="button" className="glass-button glass icon-button" onClick={onClose} aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="segmented" role="radiogroup" aria-label="Day">
          {DAY_SHORT.map((label, d) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={day === d}
              className={day === d ? 'is-active' : ''}
              onClick={() => setDay(d as Weekday)}
            >
              {day === d && (
                <motion.span layoutId="day-pill" className="chip__pill" transition={{ type: 'spring', stiffness: 520, damping: 38 }} />
              )}
              {label.slice(0, 2)}
            </button>
          ))}
        </div>

        <p className="popover__time">{formatTime(minutes)}</p>
        <input
          className="slider"
          type="range"
          min={0}
          max={24 * 60 - 15}
          step={15}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          aria-label="Time of day"
        />

        <div className="presets" ref={scrollRow}>
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="chip" onClick={() => apply(p.clock)}>
              {p.label}
            </button>
          ))}
        </div>

        {onDemo && (
          <label className="demo-toggle">
            <span>
              <strong>Demo data</strong>
              <span className="demo-toggle__sub">Fill every venue with sample deals. Not real.</span>
            </span>
            <input type="checkbox" role="switch" checked={demo} onChange={(e) => onDemo(e.target.checked)} />
          </label>
        )}

        <div className="popover__actions">
          <button
            type="button"
            className="glass-button glass"
            onClick={() => {
              onApply(null)
              onClose()
            }}
            disabled={!isPreview}
          >
            Back to now
          </button>
          <button type="button" className="glass-button glass glass--honey" onClick={() => apply({ day, minutes })}>
            Preview
          </button>
        </div>
      </motion.div>
    </>
  )
}
