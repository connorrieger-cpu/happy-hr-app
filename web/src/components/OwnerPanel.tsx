import { motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import type { CommunitySubmission } from '../lib/community'
import { formatSpecial } from '../lib/deals'
import { formatDays, formatRange } from '../lib/time'
import { CloseIcon } from './icons'

// Private owner page, opened with ?owner. Lists venue claims to approve,
// reported chat messages to act on, and every community update (hidden ones
// too) to hide or restore. The owner password is entered once and kept on this
// device only.

const TOKEN_KEY = 'happyhr:owner-token'

interface OwnerSubmission extends CommunitySubmission {
  hidden: boolean
  device: string
  ipHash: string
}

interface OwnerVote {
  venueId: string
  device: string
  day: string
  worked: boolean
  ipHash: string
  createdAt: string
  hidden: boolean
}

interface OwnerClaim {
  id: string
  venueId: string
  venueName: string
  name: string
  role?: string
  contact: string
  message?: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
}

interface OwnerChatMessage {
  id: number
  userId: string
  name: string
  body: string
  createdAt: string
  hidden: boolean
  banned: boolean
  reports: number
  reasons?: string
}

function savedToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

const shortWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-CA', { timeZone: 'America/Toronto', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export function OwnerPanel({ venueName, onClose, onChanged }: { venueName: (id: string) => string; onClose: () => void; onChanged: () => void }) {
  const [token, setToken] = useState(savedToken)
  const [draft, setDraft] = useState('')
  const [data, setData] = useState<{ submissions: OwnerSubmission[]; votes: OwnerVote[]; claims?: OwnerClaim[] } | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  // The link for a just-approved claim. Shown once: only its hash is stored.
  const [issued, setIssued] = useState<{ claimId: string; link: string; copied: boolean } | null>(null)
  // The group chat (iPhone app): reported messages and the latest ones.
  const [chat, setChat] = useState<{ reported: OwnerChatMessage[]; recent: OwnerChatMessage[] } | null>(null)

  const forget = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // Nothing to forget.
    }
    setToken('')
    setData(null)
  }, [])

  const load = useCallback(async () => {
    if (!token) return
    setProblem(null)
    const res = await fetch('/api/owner', { headers: { authorization: `Bearer ${token}` } }).catch(() => null)
    if (res?.status === 401) {
      // Don't keep a wrong password: show the field again.
      forget()
      setProblem('Wrong password.')
      return
    }
    if (!res?.ok) {
      setProblem('Couldn’t reach the community API.')
      setData(null)
      return
    }
    setData(await res.json())
    // Older servers have no chat yet: the section just doesn't show.
    const chatRes = await fetch('/api/owner-chat', { headers: { authorization: `Bearer ${token}` } }).catch(() => null)
    setChat(chatRes?.ok ? await chatRes.json() : null)
  }, [token, forget])

  const moderate = async (action: 'hide' | 'restore' | 'dismiss' | 'ban' | 'unban', target: { messageId?: number; userId?: string }) => {
    if (action === 'ban' && !window.confirm('Remove this person from the chat? Their messages will be hidden too.')) return
    const res = await fetch('/api/owner-chat', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ action, ...target }),
    }).catch(() => null)
    if (!res?.ok) return setProblem('Couldn’t save that change.')
    await load()
  }

  useEffect(() => {
    void load()
  }, [load])

  const saveToken = () => {
    const value = draft.trim()
    try {
      localStorage.setItem(TOKEN_KEY, value)
    } catch {
      // Storage unavailable: the token lasts until reload.
    }
    setToken(value)
    setDraft('')
  }


  const setHidden = async (target: 'submission' | 'vote', key: string, hidden: boolean) => {
    const res = await fetch('/api/owner', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ target, key, hidden }),
    }).catch(() => null)
    if (!res?.ok) return setProblem('Couldn’t save that change.')
    await load()
    onChanged()
  }

  const decide = async (claimId: string, action: 'approve' | 'reject') => {
    if (action === 'approve' && !window.confirm('Approve? This makes a new link for the venue and stops any older one working.')) return
    const res = await fetch('/api/owner', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ target: 'claim', key: claimId, action }),
    }).catch(() => null)
    if (!res?.ok) return setProblem('Couldn’t save that change.')
    const result = await res.json()
    if (action === 'approve' && result.key) {
      setIssued({ claimId, link: `${window.location.origin}/?venuekey=${encodeURIComponent(result.key)}`, copied: false })
    }
    await load()
  }

  const copyIssued = async () => {
    if (!issued) return
    try {
      await navigator.clipboard.writeText(issued.link)
      setIssued({ ...issued, copied: true })
    } catch {
      window.prompt('Copy this link', issued.link)
    }
  }

  const claims = data?.claims ?? []
  const pending = claims.filter((c) => c.status === 'pending').length

  return (
    <>
      <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="contribute owner glass glass--strong"
        role="dialog"
        aria-label="Owner tools"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
      >
        <div className="popover__head">
          <div>
            <h2 className="popover__title">Owner tools</h2>
            <p className="popover__sub">Hide anything wrong or spammy. Hidden items disappear for everyone; you can restore them.</p>
          </div>
          <button type="button" className="glass-button glass icon-button" onClick={onClose} aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="contribute__body">
          {!token ? (
            <fieldset className="field">
              <legend>Owner password</legend>
              <div className="field__row">
                <input
                  className="input"
                  type="password"
                  autoComplete="off"
                  placeholder="Password"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && draft.trim() && saveToken()}
                  aria-label="Owner password"
                />
                <button type="button" className="glass-button glass glass--honey" onClick={saveToken} disabled={!draft.trim()}>
                  Unlock
                </button>
              </div>
            </fieldset>
          ) : (
            <p className="owner__meta">
              Unlocked on this device.{' '}
              <button type="button" className="link-button" onClick={forget}>
                Lock again
              </button>
            </p>
          )}

          {problem && <p className="form-problem">{problem}</p>}

          {data && (
            <>
              <h3 className="section-title">
                Venue claims <span className="section-title__count">{pending ? `${pending} new` : claims.length}</span>
              </h3>
              {claims.length === 0 && <p className="empty">Nothing yet.</p>}
              <ul className="owner__list">
                {claims.map((c) => (
                  <li key={c.id} className={`owner__item owner__item--claim${c.status === 'rejected' ? ' is-hidden' : ''}`}>
                    <div>
                      <p className="owner__title">
                        {c.venueName}
                        {c.status !== 'pending' && <span className="sample-tag">{c.status === 'approved' ? 'Approved' : 'Turned down'}</span>}
                      </p>
                      <p className="owner__detail">
                        {c.name}
                        {c.role && ` · ${c.role}`} · {c.contact}
                      </p>
                      {c.message && <p className="owner__detail">“{c.message}”</p>}
                      <p className="owner__meta">{shortWhen(c.createdAt)} · call or email the venue to check before approving</p>
                      {issued?.claimId === c.id && (
                        <div className="owner__issued">
                          <p className="owner__detail">Send this link to the venue. It’s shown only once.</p>
                          <code className="owner__link">{issued.link}</code>
                          <button type="button" className="glass-button glass glass--honey" onClick={copyIssued}>
                            {issued.copied ? 'Copied' : 'Copy link'}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="owner__buttons">
                      <button type="button" className="glass-button glass" onClick={() => decide(c.id, 'approve')}>
                        {c.status === 'approved' ? 'New link' : 'Approve'}
                      </button>
                      {c.status === 'pending' && (
                        <button type="button" className="glass-button glass" onClick={() => decide(c.id, 'reject')}>
                          Turn down
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {chat && (
                <>
                  <h3 className="section-title">
                    Chat reports <span className="section-title__count">{chat.reported.length ? `${chat.reported.length} to check` : 0}</span>
                  </h3>
                  <p className="owner__meta">App Review expects reports dealt with within a day.</p>
                  {chat.reported.length === 0 && <p className="empty">Nothing reported.</p>}
                  <ul className="owner__list">
                    {chat.reported.map((m) => (
                      <li key={m.id} className={`owner__item${m.hidden ? ' is-hidden' : ''}`}>
                        <div>
                          <p className="owner__title">
                            {m.name}
                            <span className="sample-tag">
                              {m.reports} report{m.reports === 1 ? '' : 's'}
                            </span>
                            {m.hidden && <span className="sample-tag">Hidden</span>}
                            {m.banned && <span className="sample-tag">Removed</span>}
                          </p>
                          <p className="owner__detail">“{m.body}”</p>
                          {m.reasons && <p className="owner__detail">Reasons: {m.reasons}</p>}
                          <p className="owner__meta">{shortWhen(m.createdAt)}</p>
                        </div>
                        <div className="owner__buttons">
                          <button type="button" className="glass-button glass" onClick={() => moderate(m.hidden ? 'restore' : 'hide', { messageId: m.id })}>
                            {m.hidden ? 'Restore' : 'Hide'}
                          </button>
                          <button type="button" className="glass-button glass" onClick={() => moderate('dismiss', { messageId: m.id })}>
                            It’s fine
                          </button>
                          <button type="button" className="glass-button glass" onClick={() => moderate(m.banned ? 'unban' : 'ban', { userId: m.userId })}>
                            {m.banned ? 'Let back in' : 'Remove person'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <h3 className="section-title">
                    Latest chat <span className="section-title__count">{chat.recent.length}</span>
                  </h3>
                  {chat.recent.length === 0 && <p className="empty">Nothing yet.</p>}
                  <ul className="owner__list">
                    {chat.recent.map((m) => (
                      <li key={m.id} className={`owner__item${m.hidden ? ' is-hidden' : ''}`}>
                        <div>
                          <p className="owner__title">
                            {m.name}
                            {m.hidden && <span className="sample-tag">Hidden</span>}
                            {m.banned && <span className="sample-tag">Removed</span>}
                          </p>
                          <p className="owner__detail">“{m.body}”</p>
                          <p className="owner__meta">{shortWhen(m.createdAt)}</p>
                        </div>
                        <button type="button" className="glass-button glass" onClick={() => moderate(m.hidden ? 'restore' : 'hide', { messageId: m.id })}>
                          {m.hidden ? 'Restore' : 'Hide'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <h3 className="section-title">
                Added happy hours <span className="section-title__count">{data.submissions.length}</span>
              </h3>
              {data.submissions.length === 0 && <p className="empty">Nothing yet.</p>}
              <ul className="owner__list">
                {data.submissions.map((s) => (
                  <li key={s.id} className={`owner__item${s.hidden ? ' is-hidden' : ''}`}>
                    <div>
                      <p className="owner__title">
                        {s.venueName}
                        {!s.venueId && <span className="sample-tag">New place</span>}
                        {s.byVenue && <span className="sample-tag">From the venue</span>}
                        {s.hidden && <span className="sample-tag">Hidden</span>}
                      </p>
                      <p className="owner__detail">
                        {s.kind === 'daily' && `Daily special${s.title ? ` “${s.title}”` : ''} · `}
                        {formatDays(s.days)} ·{' '}
                        {s.start != null && s.end != null ? formatRange({ days: s.days, start: s.start, end: s.end, specials: [] }) : 'All day'} ·{' '}
                        {s.specials.map(formatSpecial).join(', ')}
                      </p>
                      {s.address && !s.venueId && <p className="owner__detail">{s.address}</p>}
                      {s.note && <p className="owner__detail">“{s.note}”</p>}
                      <p className="owner__meta">
                        {shortWhen(s.createdAt)} · device {s.device.slice(0, 6)} · network {s.ipHash.slice(0, 6)}
                      </p>
                    </div>
                    <button type="button" className="glass-button glass" onClick={() => setHidden('submission', s.id, !s.hidden)}>
                      {s.hidden ? 'Restore' : 'Hide'}
                    </button>
                  </li>
                ))}
              </ul>

              <h3 className="section-title">
                Check-ins <span className="section-title__count">{data.votes.length}</span>
              </h3>
              {data.votes.length === 0 && <p className="empty">Nothing yet.</p>}
              <ul className="owner__list">
                {data.votes.map((v) => (
                  <li key={`${v.venueId}|${v.device}|${v.day}`} className={`owner__item${v.hidden ? ' is-hidden' : ''}`}>
                    <div>
                      <p className="owner__title">
                        {v.worked ? '👍' : '👎'} {venueName(v.venueId)}
                        {v.hidden && <span className="sample-tag">Hidden</span>}
                      </p>
                      <p className="owner__meta">
                        {shortWhen(v.createdAt)} · device {v.device.slice(0, 6)} · network {v.ipHash.slice(0, 6)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="glass-button glass"
                      onClick={() => setHidden('vote', `${v.venueId}|${v.device}|${v.day}`, !v.hidden)}
                    >
                      {v.hidden ? 'Restore' : 'Hide'}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}
