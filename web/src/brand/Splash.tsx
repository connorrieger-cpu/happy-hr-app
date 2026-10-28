import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useMemo } from 'react'
import { COUPE_TRANSFORM, LogoCoupe, LogoDefs, LogoFace, LogoMug, LogoSparks, MUG_TRANSFORM, Wordmark } from './Logo'
import './splash.css'

const DURATION_MS = 2600
const CLINK = 1.0 // seconds into the animation when the glasses touch

export function Splash({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion()
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  useEffect(() => {
    const timer = setTimeout(onDone, reduce ? 900 : DURATION_MS)
    return () => clearTimeout(timer)
  }, [onDone, reduce])

  const bubbles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: 30 + ((i * 37) % 40),
        size: 4 + ((i * 7) % 9),
        delay: CLINK + (i % 7) * 0.08,
        drift: ((i * 13) % 30) - 15,
      })),
    [],
  )

  return (
    <motion.div
      className="splash"
      onClick={onDone}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45, ease: 'easeOut' } }}
      role="presentation"
    >
      <motion.div
        className="splash__glow"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduce ? 0.2 : 1.1, ease: 'easeOut' }}
      />

      <div className="splash__stage">
        {!reduce &&
          bubbles.map((b, i) => (
            <motion.span
              key={i}
              className="splash__bubble"
              style={{ left: `${b.left}%`, width: b.size, height: b.size }}
              initial={{ y: 40, x: 0, opacity: 0 }}
              animate={{ y: -220, x: b.drift, opacity: [0, 0.9, 0] }}
              transition={{ delay: b.delay, duration: 1.4, ease: 'easeOut' }}
            />
          ))}

        <motion.div layoutId="brand-mark" className="splash__mark">
          <svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true">
            <LogoDefs id={id} />
            <LogoFace
              id={id}
              initial={reduce ? false : { scale: 0.2, rotate: -25, opacity: 0 }}
              animate={reduce ? undefined : { scale: [0.2, 1.08, 1, 1.06, 1], rotate: [-25, 6, 0, 0, 0], opacity: 1 }}
              transition={{
                default: { duration: 1.4, times: [0, 0.32, 0.5, 0.74, 1], ease: 'easeOut', delay: 0.1 },
                opacity: { duration: 0.2, delay: 0.1 },
              }}
            />
            <g transform={MUG_TRANSFORM}>
              <LogoMug
                id={id}
                initial={reduce ? false : { x: -60, y: 30, rotate: -50, opacity: 0 }}
                animate={reduce ? undefined : { x: [-60, 3, 0], y: [30, 0, 0], rotate: [-50, 8, 0], opacity: 1 }}
                transition={{
                  default: { duration: 0.55, times: [0, 0.8, 1], delay: CLINK - 0.45, ease: 'easeOut' },
                  opacity: { duration: 0.15, delay: CLINK - 0.45 },
                }}
              />
            </g>
            <g transform={COUPE_TRANSFORM}>
              <LogoCoupe
                id={id}
                initial={reduce ? false : { x: 50, y: 30, rotate: 50, opacity: 0 }}
                animate={reduce ? undefined : { x: [50, -3, 0], y: [30, 0, 0], rotate: [50, -8, 0], opacity: 1 }}
                transition={{
                  default: { duration: 0.55, times: [0, 0.8, 1], delay: CLINK - 0.45, ease: 'easeOut' },
                  opacity: { duration: 0.15, delay: CLINK - 0.45 },
                }}
              />
            </g>
            <LogoSparks
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              animate={reduce ? undefined : { scale: [0, 1.4, 1], opacity: [0, 1, 1] }}
              transition={{ duration: 0.4, delay: CLINK + 0.05, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>

        {!reduce && (
          <motion.div
            className="splash__ring"
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 2.4, opacity: [0, 0.7, 0] }}
            transition={{ delay: CLINK + 0.05, duration: 0.8, ease: 'easeOut' }}
          />
        )}
      </div>

      <motion.div
        className="splash__title"
        initial={{ y: 18, opacity: 0, filter: 'blur(8px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        transition={{ delay: reduce ? 0 : CLINK + 0.2, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <Wordmark />
      </motion.div>
      <motion.p
        className="splash__tagline"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : CLINK + 0.55, duration: 0.5 }}
      >
        Happy hours near you, right now
      </motion.p>
    </motion.div>
  )
}
