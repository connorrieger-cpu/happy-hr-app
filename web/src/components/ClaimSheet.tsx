import { motion } from 'motion/react'
import { useState } from 'react'
import { LIMITS, validateClaim, type ClaimInput } from '../lib/community'
import type { Venue } from '../lib/types'
import { deviceId } from '../hooks/useCommunity'
import { CloseIcon } from './icons'

interface Props {
  venue: Venue
  onClose: () => void
}

/**
 * "Run this place?": staff ask to manage the venue's page. We check it's them,
 * then send a link that lets this device post the venue's own deals.
 */
export function ClaimSheet({ venue, onClose }: Props) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    const input: ClaimInput = {
      device: deviceId(),
      venueId: venue.id,
      name: name.trim(),
      role: role.trim() || undefined,
      contact: contact.trim(),
      message: message.trim() || undefined,
    }
    const early = validateClaim(input)
    if (early) return setProblem(early)
    setBusy(true)
    setProblem(null)
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Something went wrong. Try again.')
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
        className="contribute contribute--short glass glass--strong"
        role="dialog"
        aria-label={`Manage ${venue.name}`}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      >
        <div className="popover__head">
          <div>
            <h2 className="popover__title">{done ? 'Thanks, we’ll be in touch' : `Run ${venue.name}?`}</h2>
            <p className="popover__sub">
              {done
                ? 'We check every request by phone or email, then send you a link to manage this page. Usually within a day or two.'
                : 'Post your own happy hours and specials, marked From the venue. Free. We’ll check it’s you first.'}
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
            <div className="field__row field__row--stack">
              <input className="input" placeholder="Your name" value={name} maxLength={LIMITS.name} onChange={(e) => setName(e.target.value)} aria-label="Your name" autoComplete="name" />
              <input className="input" placeholder="Your role (owner, manager…)" value={role} maxLength={LIMITS.role} onChange={(e) => setRole(e.target.value)} aria-label="Your role (optional)" />
              <input
                className="input"
                placeholder="Email or phone, ideally the venue’s"
                value={contact}
                maxLength={LIMITS.contact}
                onChange={(e) => setContact(e.target.value)}
                aria-label="Email or phone"
                autoComplete="email"
              />
              <textarea
                className="input input--area"
                placeholder="Anything we should know (optional)"
                value={message}
                maxLength={LIMITS.note}
                onChange={(e) => setMessage(e.target.value)}
                aria-label="Message (optional)"
                rows={2}
              />
            </div>
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
                {busy ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  )
}
