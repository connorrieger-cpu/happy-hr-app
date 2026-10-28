import { motion } from 'motion/react'
import { useState } from 'react'
import type { RankedVenue } from '../lib/deals'
import { meetOptions, shareMessage, venueLink } from '../lib/share'
import { formatTime, type Clock } from '../lib/time'
import { CloseIcon, LinkIcon, ShareIcon } from './icons'
import { scrollRow } from './scrollRow'

interface Props {
  rv: RankedVenue
  /** Links name the area, so they open on it. */
  areaId: string
  now: Clock
  onClose: () => void
}

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

/** Send a spot to friends, optionally as a plan: "Meet at Manita at 5:30?". */
export function ShareSheet({ rv, areaId, now, onClose }: Props) {
  const [meet, setMeet] = useState<number | undefined>()
  const [copied, setCopied] = useState(false)
  const times = meetOptions(rv, now)
  const url = venueLink(window.location.href, rv.venue.id, meet, areaId)
  const text = shareMessage(rv, now, meet)
  const pick = (m: number | undefined) => {
    setMeet(m)
    setCopied(false)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      setCopied(true)
    } catch {
      // Clipboard blocked: the link is still shown to copy by hand.
      window.prompt('Copy this link', url)
    }
  }

  const send = async () => {
    try {
      await navigator.share({ title: rv.venue.name, text, url })
      onClose()
    } catch (e) {
      // Cancelled is fine; anything else falls back to copying.
      if (!(e instanceof DOMException && e.name === 'AbortError')) await copy()
    }
  }

  return (
    <>
      <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="popover share glass glass--strong"
        role="dialog"
        aria-label={`Share ${rv.venue.name}`}
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      >
        <div className="popover__head">
          <div>
            <h2 className="popover__title">Share {rv.venue.name}</h2>
            <p className="popover__sub">Send the spot, or suggest a time to meet.</p>
          </div>
          <button type="button" className="glass-button glass icon-button" onClick={onClose} aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="presets share__times" role="radiogroup" aria-label="Meet at" ref={scrollRow}>
          <button type="button" role="radio" aria-checked={meet == null} className={`chip${meet == null ? ' is-active' : ''}`} onClick={() => pick(undefined)}>
            {meet == null && <motion.span layoutId="meet-pill" className="chip__pill" />}
            <span className="chip__label">Just the spot</span>
          </button>
          {times.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={meet === m} className={`chip${meet === m ? ' is-active' : ''}`} onClick={() => pick(m)}>
              {meet === m && <motion.span layoutId="meet-pill" className="chip__pill" />}
              <span className="chip__label">{formatTime(m, { compact: true })}</span>
            </button>
          ))}
        </div>

        <p className="share__preview">{text}</p>

        <div className="popover__actions">
          <button type="button" className={`glass-button glass${canShare ? '' : ' glass--honey'}`} onClick={copy}>
            <LinkIcon size={16} /> {copied ? 'Copied' : 'Copy link'}
          </button>
          {canShare && (
            <button type="button" className="glass-button glass glass--honey" onClick={send}>
              <ShareIcon size={16} /> Send
            </button>
          )}
        </div>
      </motion.div>
    </>
  )
}
