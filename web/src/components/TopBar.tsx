import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { LogoMark, Wordmark } from '../brand/Logo'
import { AREA_LIST } from '../data/areas'
import type { ThemeMode } from '../hooks/useTheme'
import type { Area } from '../lib/types'
import { ChevronDown, MoonIcon, PinIcon, SearchIcon, SunIcon, SystemIcon } from './icons'

interface Props {
  area: Area
  /** The area someone's location puts them in. */
  here?: Area
  onArea: (id: string) => void
  /** The splash is still showing, so the shared logo lives there for now. */
  splashing: boolean
  onLogo: () => void
  themeMode: ThemeMode
  onThemeMode: (mode: ThemeMode) => void
  /** Shown only where community updates work. */
  onContribute?: () => void
  onSearch: () => void
}

const THEME_OPTIONS = [
  { id: 'system', label: 'System', Icon: SystemIcon },
  { id: 'light', label: 'Light', Icon: SunIcon },
  { id: 'dark', label: 'Dark', Icon: MoonIcon },
] as const

/** The menu's groups: each city's neighbourhoods under its name, then the cities listed whole. */
const AREA_GROUPS = (() => {
  const groups: { heading: string; areas: Area[] }[] = []
  const add = (heading: string, area: Area) => {
    const group = groups.find((g) => g.heading === heading)
    if (group) group.areas.push(area)
    else groups.push({ heading, areas: [area] })
  }
  for (const a of AREA_LIST) if (a.name !== a.city) add(a.city, a)
  for (const a of AREA_LIST) if (a.name === a.city) add('More cities', a)
  return groups
})()

/** How long the bar stays above the fading splash while the logo flies into place. */
const HANDOFF_MS = 900

export function TopBar({ area, here, onArea, splashing, onLogo, themeMode, onThemeMode, onContribute, onSearch }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [lifted, setLifted] = useState(splashing)

  useEffect(() => {
    if (splashing) return setLifted(true)
    const timer = setTimeout(() => setLifted(false), HANDOFF_MS)
    return () => clearTimeout(timer)
  }, [splashing])

  return (
    <header className={`topbar${splashing ? ' topbar--intro' : ''}${lifted ? ' topbar--lifted' : ''}`}>
      <button type="button" className="brand glass glass--refract" onClick={onLogo} aria-label="Happy HR. Replay intro">
        <span className="brand__mark">
          {!splashing && (
            <motion.span layoutId="brand-mark" className="brand__mark-inner" transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
              <LogoMark size={34} />
            </motion.span>
          )}
        </span>
        <motion.span initial={false} animate={{ opacity: splashing ? 0 : 1 }} transition={{ delay: 0.25 }}>
          <Wordmark className="brand__word" />
        </motion.span>
      </button>

      <div className="area">
        <button type="button" className="search-button glass glass--refract" onClick={onSearch} aria-label="Search spots and deals">
          <SearchIcon size={19} />
        </button>
        <button
          type="button"
          className="area__chip glass glass--refract"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <PinIcon size={15} />
          <span>{area.name}</span>
          <ChevronDown size={15} className={menuOpen ? 'flip' : ''} />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="scrim scrim--clear" onClick={() => setMenuOpen(false)} />
              <motion.ul
                className="area__menu glass glass--strong"
                role="menu"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.18 }}
              >
                {AREA_GROUPS.map((group, i) => (
                  <li key={group.heading} role="none">
                    {i > 0 && <div className="area__divider" role="separator" />}
                    <div className="area__heading">{group.heading}</div>
                    <ul role="group" aria-label={group.heading}>
                      {group.areas.map((a) => (
                        <li key={a.id} role="menuitemradio" aria-checked={a.id === area.id}>
                          <button
                            type="button"
                            className={`area__item${a.id === area.id ? ' is-active' : ''}`}
                            onClick={() => {
                              setMenuOpen(false)
                              if (a.id !== area.id) onArea(a.id)
                            }}
                          >
                            {a.name}
                            {a.id === here?.id && <span className="here-badge">You’re here</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
                {onContribute && (
                  <>
                    <li className="area__divider" role="separator" />
                    <li className="area__heading">Community</li>
                    <li role="menuitem">
                      <button
                        type="button"
                        className="area__item"
                        onClick={() => {
                          setMenuOpen(false)
                          onContribute()
                        }}
                      >
                        Add a happy hour or special
                        <span aria-hidden="true">＋</span>
                      </button>
                    </li>
                  </>
                )}
                <li className="area__divider" role="separator" />
                <li className="area__heading">Appearance</li>
                <li>
                  <div className="segmented segmented--theme" role="radiogroup" aria-label="Appearance">
                    {THEME_OPTIONS.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={themeMode === id}
                        className={themeMode === id ? 'is-active' : ''}
                        onClick={() => onThemeMode(id)}
                      >
                        {themeMode === id && (
                          <motion.span
                            layoutId="theme-pill"
                            className="chip__pill"
                            transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                          />
                        )}
                        <Icon size={14} />
                        {label}
                      </button>
                    ))}
                  </div>
                </li>
              </motion.ul>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
