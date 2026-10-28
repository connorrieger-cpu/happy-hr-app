import { motion, type MotionProps } from 'motion/react'
import { useId, type SVGProps } from 'react'

// The Happy HR mark: a glossy honey smiley with a beer mug and a coupe
// clinking over its shoulder. The pieces are exported separately so the
// splash screen can animate them one by one.

const INK = '#2B1D00'

type GProps = SVGProps<SVGGElement> & MotionProps

export function LogoDefs({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-face`} cx="38%" cy="30%" r="78%">
        <stop offset="0" stopColor="#FFF3A0" />
        <stop offset="0.38" stopColor="#FFDF2E" />
        <stop offset="0.78" stopColor="#FFC300" />
        <stop offset="1" stopColor="#F29A00" />
      </radialGradient>
      <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}-beer`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFD24A" />
        <stop offset="1" stopColor="#F29A00" />
      </linearGradient>
      <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
        <stop offset="1" stopColor="#FFF4D0" stopOpacity="0.75" />
      </linearGradient>
    </defs>
  )
}

export function LogoFace({ id, ...props }: GProps & { id: string }) {
  return (
    <motion.g {...props}>
      <circle cx="56" cy="76" r="45" fill={`url(#${id}-face)`} />
      <circle cx="56" cy="76" r="44.25" fill="none" stroke="#C77A00" strokeOpacity="0.45" strokeWidth="1.5" />
      {/* glass highlight */}
      <ellipse cx="42" cy="50" rx="24" ry="13" fill={`url(#${id}-shine)`} opacity="0.75" transform="rotate(-24 42 50)" />
      {/* happy closed eyes */}
      <path d="M31 70 q7 -9 14 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M63 70 q7 -9 14 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      {/* cheeks */}
      <circle cx="27" cy="82" r="6" fill="#FF8A00" opacity="0.35" />
      <circle cx="85" cy="82" r="6" fill="#FF8A00" opacity="0.35" />
      {/* open smile */}
      <path d="M34 84 Q56 110 78 84 Q56 92 34 84 Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M46 96 Q56 90 66 96 Q56 103 46 96 Z" fill="#FF7A45" />
    </motion.g>
  )
}

/** Beer mug, origin at the centre of its rim. */
export function LogoMug({ id, ...props }: GProps & { id: string }) {
  return (
    <motion.g {...props}>
      <path d="M-11 6 h-4 a5 5 0 0 0 -5 5 v7 a5 5 0 0 0 5 5 h4" fill="none" stroke={INK} strokeWidth="6" />
      <path d="M-11 6 h-4 a5 5 0 0 0 -5 5 v7 a5 5 0 0 0 5 5 h4" fill="none" stroke="#FFF4D0" strokeWidth="2.4" />
      <rect x="-11" y="0" width="22" height="28" rx="4" fill={`url(#${id}-glass)`} stroke={INK} strokeWidth="2.5" />
      <rect x="-8" y="7" width="16" height="18" rx="2" fill={`url(#${id}-beer)`} />
      <path d="M-4 10 v12 M2 10 v12" stroke="#FFF6C8" strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
      {/* foam */}
      <path
        d="M-12 3 a5 5 0 0 1 6 -6 a6 6 0 0 1 10 -1 a5 5 0 0 1 8 5 a3.5 3.5 0 0 1 -1 6 h-22 a3.5 3.5 0 0 1 -1 -4 z"
        fill="#FFFDF4"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </motion.g>
  )
}

/** Cocktail coupe, origin at the centre of its rim. */
export function LogoCoupe({ id, ...props }: GProps & { id: string }) {
  return (
    <motion.g {...props}>
      <path d="M-13 0 h26 q0 15 -13 16 q-13 -1 -13 -16 z" fill={`url(#${id}-glass)`} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M-10 4 h20 q-1.5 9 -10 9.5 q-8.5 -0.5 -10 -9.5 z" fill={`url(#${id}-beer)`} />
      <path d="M0 16 v11 M-7 28 h14" stroke={INK} strokeWidth="5.6" strokeLinecap="round" />
      <path d="M0 16 v11 M-7 28 h14" stroke="#FFF4D0" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="7" cy="-2" r="3.4" fill="#E8344E" stroke={INK} strokeWidth="1.8" />
      <path d="M7 -5 q2 -5 6 -6" fill="none" stroke="#7BC74D" strokeWidth="1.8" strokeLinecap="round" />
    </motion.g>
  )
}

export function LogoSparks(props: GProps) {
  return (
    <motion.g stroke="#FFE45C" strokeWidth="3.2" strokeLinecap="round" {...props}>
      <path d="M100 13 v-8" />
      <path d="M90 16 l-5 -5" />
      <path d="M110 16 l5 -5" />
    </motion.g>
  )
}

// The rims touch at about (100, 25); the sparks fan out above that point.
export const MUG_TRANSFORM = 'translate(90 22) rotate(18)'
export const COUPE_TRANSFORM = 'translate(111 21) rotate(-16)'

export function LogoMark({ size = 40, title = 'Happy HR', ...props }: { size?: number; title?: string } & SVGProps<SVGSVGElement>) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" role="img" aria-label={title} {...props}>
      <LogoDefs id={id} />
      <LogoFace id={id} />
      <g transform={MUG_TRANSFORM}>
        <LogoMug id={id} />
      </g>
      <g transform={COUPE_TRANSFORM}>
        <LogoCoupe id={id} />
      </g>
      <LogoSparks />
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`}>
      Happy<span className="wordmark__hr">HR</span>
    </span>
  )
}
