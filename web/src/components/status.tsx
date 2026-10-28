import { isEndingSoon } from '../lib/deals'
import { DAY_SHORT, formatDuration, formatTime, type VenueStatus } from '../lib/time'

/** One-line status, e.g. "Ends 6 PM · 47 min left". */
export function statusLine(s: VenueStatus): string {
  switch (s.kind) {
    case 'live':
      return `Ends ${formatTime(s.endsAt, { compact: true })} · ${formatDuration(s.minutesLeft)} left`
    case 'soon':
      return `Starts ${formatTime(s.startsAt, { compact: true })} · in ${formatDuration(s.startsIn)}`
    case 'later':
      return `Starts ${formatTime(s.startsAt, { compact: true })}`
    case 'none':
      return s.next ? `Next: ${DAY_SHORT[s.next.day]} ${formatTime(s.next.startsAt, { compact: true })}` : 'No happy hour listed'
  }
}

function ringText(s: VenueStatus): [string, string] {
  switch (s.kind) {
    case 'live':
      return s.minutesLeft < 60
        ? [String(s.minutesLeft), 'min left']
        : [`${Math.floor(s.minutesLeft / 60)}:${String(s.minutesLeft % 60).padStart(2, '0')}`, 'left']
    case 'soon':
    case 'later': {
      const [time, suffix] = formatTime(s.startsAt, { compact: true }).split(' ')
      return [time, suffix]
    }
    case 'none':
      return s.next ? [DAY_SHORT[s.next.day], formatTime(s.next.startsAt, { compact: true })] : ['—', '']
  }
}

/** Countdown ring: the honey arc is the share of happy hour that's left. */
export function StatusRing({ status, size = 52 }: { status: VenueStatus; size?: number }) {
  const stroke = size > 60 ? 5 : 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const remaining = status.kind === 'live' ? 1 - status.progress : 0
  const [big, small] = ringText(status)
  const ending = isEndingSoon(status)

  return (
    <div
      className={`ring ring--${status.kind}${ending ? ' ring--ending' : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        {status.kind === 'live' && (
          <circle
            className="ring__arc"
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={c * (1 - remaining)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      <span className="ring__big" style={{ fontSize: size * (big.length > 3 ? 0.27 : 0.33) }}>
        {big}
      </span>
      {small && (
        <span className="ring__small" style={{ fontSize: Math.max(8.5, size * 0.17) }}>
          {small}
        </span>
      )}
    </div>
  )
}
