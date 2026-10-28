import type { PinModel } from './usePinLabels'
import './pins.css'

interface Props {
  pin: PinModel
  selected: boolean
  onSelect: (id: string) => void
}

/** A zero-size anchor: the dot is centred on the venue, the label floats beside it. */
export function VenuePin({ pin, selected, onSelect }: Props) {
  const { rv, label, side } = pin
  const kind = pin.daily ? 'daily' : rv.status.kind
  const classes = ['pin', `pin--${kind}`, pin.quiet && 'pin--quiet', pin.special && 'pin--special', selected && 'is-selected']
  return (
    <div className={classes.filter(Boolean).join(' ')}>
      <button
        type="button"
        className="pin__hit"
        aria-label={`${rv.venue.name}${label ? `, ${label}` : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(rv.venue.id)
        }}
      >
        <span className="pin__dot" />
        {label && side && (
          <span className={`pin__label pin__label--${side} glass ${kind === 'live' || kind === 'daily' ? 'glass--honey' : 'glass--strong'}`}>
            {label}
          </span>
        )}
      </button>
      {selected && <span className="pin__name glass glass--strong">{rv.venue.name}</span>}
    </div>
  )
}

export function UserDot() {
  return (
    <div className="user-dot" aria-label="Your location">
      <span />
    </div>
  )
}
