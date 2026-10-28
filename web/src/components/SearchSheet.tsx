import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { formatItem, formatPrice, type RankedVenue } from '../lib/deals'
import { openLabel, openState } from '../lib/hours'
import {
  browseOptions,
  canSortByPrice,
  EMPTY_QUERY,
  searchVenues,
  toggleToken,
  tokenInfo,
  tokensOf,
  WHENS,
  type BrowseOption,
  type SearchQuery,
  type SearchResult,
  type SearchToken,
} from '../lib/search'
import type { Clock } from '../lib/time'
import { CloseIcon, SearchIcon, WalkIcon } from './icons'
import { scrollRow } from './scrollRow'
import { statusLine } from './status'
import { VIBE_GLYPH } from './vibes'

interface Props {
  items: RankedVenue[]
  now: Clock
  query: SearchQuery
  onQuery: Dispatch<SetStateAction<SearchQuery>>
  onSelect: (id: string) => void
  onClose: () => void
}

/** Food and places show this many tiles until "More". */
const FIRST_TILES = 5
const sameToken = (a: SearchToken, b: SearchToken) => a.group === b.group && a.id === b.id

function ResultRow({ result, now, onSelect }: { result: SearchResult; now: Clock; onSelect: (id: string) => void }) {
  const { rv, note, deal } = result
  const { venue } = rv
  const on = result.on
  // A spot without a happy hour says whether it's open instead.
  const status = venue.happyHours.length ? statusLine(rv.status) : openLabel(openState(venue, now), now.day) || undefined
  return (
    <li>
      <button type="button" className={`row ${deal ? 'row--price' : 'row--result'}`} onClick={() => onSelect(venue.id)}>
        {deal ? (
          <span className={`row__price${deal.on ? ' is-on' : ''}`}>{formatPrice(deal.price)}</span>
        ) : (
          <span className={`row__glyph${on ? ' is-on' : ''}`} aria-hidden="true">
            {VIBE_GLYPH[venue.vibe]}
          </span>
        )}
        <span className="row__body">
          <span className="row__name">
            {venue.name}
            {on && !deal && <span className="on-badge">On now</span>}
          </span>
          {deal ? (
            <span className="row__meta">
              <span className="row__deal">{formatItem(deal.special.item)}</span>
              <span className="dot-sep" aria-hidden="true" />
              <span className={deal.on ? 'row__open' : undefined}>{deal.when}</span>
            </span>
          ) : (
            <span className="row__meta">
              {venue.category}
              {(note || status) && (
                <>
                  <span className="dot-sep" aria-hidden="true" />
                  <span className={note ? 'row__deal' : undefined}>{note ?? status}</span>
                </>
              )}
            </span>
          )}
        </span>
        <span className="card__walk">
          <WalkIcon size={13} />
          {rv.walkMin} min
        </span>
      </button>
    </li>
  )
}

/** One group of browse tiles (drinks, food or places); long groups show "More". */
function TileGroup({ title, options, picked, onPick }: { title: string; options: BrowseOption[]; picked: SearchToken[]; onPick: (t: SearchToken) => void }) {
  const [all, setAll] = useState(false)
  const long = options.length > FIRST_TILES + 1
  const shown = long && !all ? options.slice(0, FIRST_TILES) : options
  if (!options.length) return null
  return (
    <section className="browse__group" aria-label={title}>
      <h3 className="browse__title">{title}</h3>
      <div className="browse__grid">
        {shown.map((o) => {
          const on = picked.some((p) => sameToken(p, o.token))
          return (
            <button key={o.token.id} type="button" aria-pressed={on} className={`tile${on ? ' is-on' : ''}`} onClick={() => onPick(o.token)}>
              <span className="tile__emoji" aria-hidden="true">
                {o.emoji}
              </span>
              <span className="tile__label">{o.label}</span>
              <span className="tile__count">{o.count}</span>
            </button>
          )
        })}
        {long && (
          <button type="button" className="tile tile--more" aria-expanded={all} onClick={() => setAll((a) => !a)}>
            <span className="tile__emoji" aria-hidden="true">
              {all ? '−' : '＋'}
            </span>
            <span className="tile__label">{all ? 'Fewer' : `${options.length - FIRST_TILES} more`}</span>
          </button>
        )}
      </div>
    </section>
  )
}

/**
 * Search every spot: type a name, a drink, a food or a kind of place (typos and accents
 * forgiven), or browse the tiles; picks become tokens in the bar. Opened from the top bar.
 */
export function SearchSheet({ items, now, query, onQuery, onSelect, onClose }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [adding, setAdding] = useState(false)
  const tokens = tokensOf(query)
  const browsing = !query.text.trim() && tokens.length === 0
  const options = useMemo(() => browseOptions(items, now), [items, now])
  const priced = canSortByPrice(query)
  const results = useMemo(() => searchVenues(items, { ...query, sort: priced ? query.sort : 'nearest' }, now), [items, query, now, priced])

  useEffect(() => {
    input.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Functional updates, so quick taps on two tiles both count.
  const set = (patch: Partial<SearchQuery>) => onQuery((q) => ({ ...q, ...patch }))
  const pick = (token: SearchToken) => {
    onQuery((q) => toggleToken(q, token))
    setAdding(false)
  }

  return (
    <>
      <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="search glass glass--strong"
        role="dialog"
        aria-label="Search"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
      >
        <div className="search__bar" onClick={() => input.current?.focus()}>
          <SearchIcon size={18} />
          <div className="search__field">
            {tokens.map((t) => (
              <button
                key={`${t.group}-${t.id}`}
                type="button"
                className="token"
                onClick={(e) => {
                  e.stopPropagation()
                  pick(t)
                }}
                aria-label={`Remove ${tokenInfo(t).label}`}
              >
                <span aria-hidden="true">{tokenInfo(t).emoji}</span> {tokenInfo(t).label}
                <CloseIcon size={11} />
              </button>
            ))}
            <input
              ref={input}
              className="search__input"
              type="search"
              placeholder={tokens.length ? 'Add a word…' : 'Beer, tacos, patio, a name…'}
              value={query.text}
              onChange={(e) => set({ text: e.target.value })}
              onKeyDown={(e) => {
                // Backspace in an empty field takes the last token off, like a mail app.
                if (e.key === 'Backspace' && !query.text && tokens.length) pick(tokens[tokens.length - 1])
              }}
              aria-label="Search spots"
              enterKeyHint="search"
            />
          </div>
          <button type="button" className="glass-button glass icon-button search__close" onClick={onClose} aria-label="Close search">
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="search__filters">
          <div className="chips chips--tight" role="radiogroup" aria-label="When" ref={scrollRow}>
            {WHENS.map((w) => (
              <button
                key={w.id}
                type="button"
                role="radio"
                aria-checked={query.when === w.id}
                className={`chip${query.when === w.id ? ' is-active' : ''}`}
                onClick={() => set({ when: w.id })}
              >
                {query.when === w.id && <motion.span layoutId="search-when-pill" className="chip__pill" />}
                <span className="chip__label">{w.label}</span>
              </button>
            ))}
            {!browsing && (
              <>
                <span className="chips__divider" aria-hidden="true" />
                <button type="button" className={`chip chip--quiet${adding ? ' is-open' : ''}`} aria-expanded={adding} onClick={() => setAdding((a) => !a)}>
                  <span className="chip__label">＋ Filter</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="search__results">
          {(browsing || adding) && (
            <div className="browse">
              <TileGroup title="Drinks" options={options.drinks} picked={tokens} onPick={pick} />
              <TileGroup title="Food" options={options.food} picked={tokens} onPick={pick} />
              <TileGroup title="Places" options={options.places} picked={tokens} onPick={pick} />
            </div>
          )}

          <div className="search__count">
            <span>
              {results.length} {results.length === 1 ? 'spot' : 'spots'}
            </span>
            <span className="search__tools">
              {priced && (
                <span className="segmented segmented--sort" role="radiogroup" aria-label="Sort">
                  {(['nearest', 'cheapest'] as const).map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={query.sort === s} className={query.sort === s ? 'is-active' : ''} onClick={() => set({ sort: s })}>
                      {query.sort === s && <motion.span layoutId="search-sort-pill" className="chip__pill" />}
                      {s === 'nearest' ? 'Nearest' : 'Cheapest'}
                    </button>
                  ))}
                </span>
              )}
              {!browsing || query.when !== 'any' ? (
                <button type="button" className="link-button" onClick={() => onQuery(EMPTY_QUERY)}>
                  Clear
                </button>
              ) : null}
            </span>
          </div>
          {results.length > 0 ? (
            <ul className="row-list">
              {results.map((r) => (
                <ResultRow key={r.rv.venue.id} result={r} now={now} onSelect={onSelect} />
              ))}
            </ul>
          ) : (
            <p className="empty">Nothing matches. Try another word, or take a filter off.</p>
          )}
        </div>
      </motion.div>
    </>
  )
}
