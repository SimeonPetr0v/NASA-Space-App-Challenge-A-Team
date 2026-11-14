import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { EASE_OUT } from '@/components/motion-config'
import type { LinkMessage, MissionMode } from '@/engine/types'
import { CREW, DEFAULT_CREW } from '@/data/crew'
import { countdown } from '@/lib/format'

/*
  Crew <-> Earth signal scene. Purpose: explanation (messages really take
  minutes to cross) and feedback (a ring pulse where a message lands).
  Packet positions come from the simulated clock; planet rotation, cloud drift,
  hover and thruster flicker are ambient CSS and stop under reduced motion.
  The scene keeps a fixed aspect ratio so HTML labels can be placed in %.
*/

const W = 1000
const H = 300
const ORIGIN = { x: 130, y: 205 }
const SHIP = { x: 205, y: 150 }
const EARTH = { x: 860, y: 150, r: 74 }
const P0 = { x: 235, y: 138 }
const CTRL = { x: 520, y: -40 }
const P2 = { x: EARTH.x - EARTH.r - 8, y: 120 }

const ARC = `M ${P0.x} ${P0.y} Q ${CTRL.x} ${CTRL.y} ${P2.x} ${P2.y}`

const at = (t: number) => ({
  x: (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * CTRL.x + t ** 2 * P2.x,
  y: (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * CTRL.y + t ** 2 * P2.y,
})
const tangent = (t: number) => {
  const dx = 2 * (1 - t) * (CTRL.x - P0.x) + 2 * t * (P2.x - CTRL.x)
  const dy = 2 * (1 - t) * (CTRL.y - P0.y) + 2 * t * (P2.y - CTRL.y)
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

const STARS = Array.from({ length: 80 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453
    return x - Math.floor(x)
  }
  return { x: r(1) * W, y: r(2) * H, s: r(3) < 0.85 ? 0.6 + r(4) * 0.5 : 1.2 + r(4) * 0.6, o: 0.25 + r(5) * 0.6, tw: r(6) < 0.3, td: r(7) * 4 }
})

const CONTINENTS =
  'M10 40c14-12 38-14 52-4 8 6 4 16-6 20-12 4-8 14-20 20-14 6-30-4-34-16-2-8 2-14 8-20z' +
  'M92 30c16-8 40-4 54 10 10 10 2 26-12 28-10 2-14 14-28 14-16 0-22-12-18-26 2-10-4-20 4-26z' +
  'M60 96c12-4 28 2 32 16 3 12-6 24-20 24-14 0-24-10-24-20 0-10 4-16 12-20z' +
  'M120 104c10-2 22 4 22 14s-10 14-20 12-14-8-12-16 4-8 10-10z'

const CLOUDS =
  'M0 22c20-6 40-4 60 2s40 6 58 0M30 70c18-4 36-2 52 4s30 4 44-2M8 120c24-6 44-4 64 4M96 54c14-4 30-4 44 2M70 140c18-4 34-2 50 4'

function Earth() {
  const { x, y, r } = EARTH
  return (
    <g>
      <circle cx={x} cy={y} r={r * 2.1} fill="url(#sp-atmo)" />
      <circle cx={x} cy={y} r={r} fill="url(#sp-ocean)" />
      <g clipPath="url(#sp-earth-clip)">
        <g transform={`translate(${x - r} ${y - r})`}>
          <g className="planet-spin" style={{ ['--spin' as string]: `${-r * 2}px`, ['--spin-dur' as string]: '48s' }}>
            {[0, r * 2].map((dx) => (
              <path key={dx} d={CONTINENTS} transform={`translate(${dx} 0) scale(${(r * 2) / 160})`} fill="oklch(0.6 0.08 140)" opacity="0.8" filter="url(#sp-soft)" />
            ))}
          </g>
          <g className="planet-spin" style={{ ['--spin' as string]: `${-r * 2}px`, ['--spin-dur' as string]: '30s' }}>
            {[0, r * 2].map((dx) => (
              <path
                key={dx}
                d={CLOUDS}
                transform={`translate(${dx} 0) scale(${(r * 2) / 160})`}
                fill="none"
                stroke="white"
                strokeOpacity="0.5"
                strokeWidth="9"
                filter="url(#sp-haze)"
                strokeLinecap="round"
              />
            ))}
          </g>
        </g>
        <circle cx={x} cy={y} r={r} fill="url(#sp-terminator)" />
      </g>
      <circle cx={x} cy={y} r={r} fill="none" stroke="oklch(0.85 0.1 220)" strokeOpacity="0.55" strokeWidth="1.5" />
    </g>
  )
}

function Origin({ mode }: { mode: MissionMode }) {
  if (mode === 'mars-transit' || mode === 'iss') return null
  const mars = mode === 'mars-surface'
  const r = 48
  const { x, y } = ORIGIN
  return (
    <g>
      <circle cx={x} cy={y} r={r * 1.6} fill={mars ? 'url(#sp-mars-glow)' : 'url(#sp-moon-glow)'} />
      <circle cx={x} cy={y} r={r} fill={mars ? 'url(#sp-mars)' : 'url(#sp-moon)'} />
      <g clipPath="url(#sp-origin-clip)">
        <g transform={`translate(${x - r} ${y - r})`}>
          <g className="planet-spin" style={{ ['--spin' as string]: `${-r * 2}px`, ['--spin-dur' as string]: '70s' }}>
            {[0, r * 2].map((dx) => (
              <g key={dx} transform={`translate(${dx} 0)`} fill={mars ? 'oklch(0.42 0.1 40)' : 'oklch(0.55 0.005 260)'} opacity={mars ? 0.55 : 0.5}>
                <circle cx={r * 0.4} cy={r * 0.7} r={r * 0.16} />
                <circle cx={r * 1.2} cy={r * 1.1} r={r * 0.24} />
                <circle cx={r * 1.6} cy={r * 0.5} r={r * 0.1} />
                <circle cx={r * 0.8} cy={r * 1.5} r={r * 0.12} />
              </g>
            ))}
          </g>
        </g>
        {mars && <ellipse cx={x} cy={y - r + 4} rx={r * 0.45} ry={7} fill="white" opacity="0.8" />}
        <circle cx={x} cy={y} r={r} fill="url(#sp-terminator)" />
      </g>
    </g>
  )
}

function Ship() {
  return (
    <g transform={`translate(${SHIP.x} ${SHIP.y}) rotate(-18) scale(1.5)`}>
      <g className="ship-bob">
        <rect x="-10" y="-30" width="12" height="20" rx="1.5" fill="oklch(0.45 0.08 255)" stroke="oklch(0.8 0.03 255)" strokeWidth="0.75" />
        <rect x="-10" y="10" width="12" height="20" rx="1.5" fill="oklch(0.45 0.08 255)" stroke="oklch(0.8 0.03 255)" strokeWidth="0.75" />
        <path d="M-4 -10 L-4 10" stroke="oklch(0.8 0.02 255)" strokeWidth="1.5" />
        <path d="M-22 -7 L12 -7 L26 0 L12 7 L-22 7 Z" fill="oklch(0.94 0.01 260)" />
        <path d="M-22 -7 L-30 -13 L-27 0 L-30 13 L-22 7 Z" fill="oklch(0.8 0.01 260)" />
        <circle cx="12" cy="0" r="3" fill="oklch(0.52 0.15 235)" />
        <path className="thruster" d="M-30 -4 L-48 0 L-30 4 Z" fill="url(#sp-flame)" />
      </g>
    </g>
  )
}

function Ring({ cx, cy, r, k }: { cx: number; cy: number; r: number; k?: number }) {
  const reduce = useReducedMotion()
  if (reduce || k === undefined) return null
  return (
    <AnimatePresence>
      {[0, 0.3].map((d) => (
        <motion.circle
          key={`${k}-${d}`}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--signal)"
          strokeWidth="2"
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 1.4, delay: d, ease: EASE_OUT }}
        />
      ))}
    </AnimatePresence>
  )
}

type Props = { mode: MissionMode; inFlight: LinkMessage[]; now: number; lastToEarth?: number; lastToCrew?: number }

const pct = (v: number, of: number) => `${(v / of) * 100}%`

export function SignalPath({ mode, inFlight, now, lastToEarth, lastToCrew }: Props) {
  const fresh = (t?: number) => (t !== undefined && now - t < 20_000 ? t : undefined)
  const packets = inFlight.map((m) => {
    const s = Date.parse(m.createdAt)
    const e = Date.parse(m.arrivesAt)
    const p = Math.min(1, Math.max(0, (now - s) / Math.max(1, e - s)))
    const toEarth = m.direction === 'to-earth'
    const t = toEarth ? p : 1 - p
    return { m, e, toEarth, pos: at(t), angle: tangent(t) + (toEarth ? 0 : 180) }
  })
  const crewLabel = mode === 'mars-surface' ? 'Crew · Mars' : mode === 'lunar' ? 'Crew · Moon' : mode === 'iss' ? 'Crew · Station' : 'Crew · in transit'

  return (
    <div className="bg-space relative aspect-[1000/300] w-full overflow-hidden select-none" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} className="night-warm absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="sp-ocean" cx="38%" cy="35%" r="70%">
            <stop offset="0%" stopColor="oklch(0.72 0.12 235)" />
            <stop offset="55%" stopColor="oklch(0.5 0.14 250)" />
            <stop offset="100%" stopColor="oklch(0.3 0.1 260)" />
          </radialGradient>
          <radialGradient id="sp-atmo">
            <stop offset="45%" stopColor="oklch(0.75 0.12 225)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="oklch(0.75 0.12 225)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sp-terminator" cx="25%" cy="25%" r="95%">
            <stop offset="45%" stopColor="black" stopOpacity="0" />
            <stop offset="100%" stopColor="oklch(0.12 0.04 270)" stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id="sp-mars" cx="35%" cy="35%" r="75%">
            <stop offset="0%" stopColor="oklch(0.72 0.14 50)" />
            <stop offset="100%" stopColor="oklch(0.45 0.13 35)" />
          </radialGradient>
          <radialGradient id="sp-mars-glow">
            <stop offset="55%" stopColor="oklch(0.65 0.14 45)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="oklch(0.65 0.14 45)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sp-moon" cx="35%" cy="35%" r="75%">
            <stop offset="0%" stopColor="oklch(0.92 0.005 260)" />
            <stop offset="100%" stopColor="oklch(0.62 0.01 260)" />
          </radialGradient>
          <radialGradient id="sp-moon-glow">
            <stop offset="55%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sp-flame" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="oklch(0.9 0.12 80)" />
            <stop offset="100%" stopColor="oklch(0.7 0.18 40)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sp-tail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--signal)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--signal)" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="sp-photon">
            <stop offset="0%" stopColor="white" />
            <stop offset="35%" stopColor="var(--signal)" />
            <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
          </radialGradient>
          <filter id="sp-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6" /></filter>
          <filter id="sp-haze" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3" /></filter>
          <clipPath id="sp-earth-clip">
            <circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r} />
          </clipPath>
          <clipPath id="sp-origin-clip">
            <circle cx={ORIGIN.x} cy={ORIGIN.y} r={48} />
          </clipPath>
        </defs>

        {STARS.map((st, i) => (
          <circle
            key={i}
            cx={st.x}
            cy={st.y}
            r={st.s}
            fill="var(--space-foreground)"
            opacity={st.tw ? undefined : st.o}
            className={st.tw ? 'twinkle' : undefined}
            style={st.tw ? { ['--td' as string]: `${st.td}s` } : undefined}
          />
        ))}

        <Origin mode={mode} />
        <Earth />

        <path d={ARC} fill="none" stroke="var(--space-foreground)" strokeOpacity="0.22" strokeWidth="1.25" strokeDasharray="2 7" />
        <path
          d={ARC}
          fill="none"
          stroke="var(--signal)"
          strokeWidth="1.5"
          strokeLinecap="round"
          pathLength={100}
          className="signal-flow"
          opacity={packets.length ? 0.75 : 0.3}
        />

        <Ship />
        <Ring cx={EARTH.x} cy={EARTH.y} r={EARTH.r} k={fresh(lastToEarth)} />
        <Ring cx={SHIP.x} cy={SHIP.y} r={30} k={fresh(lastToCrew)} />

        {packets.map(({ m, pos, angle, toEarth }) => (
          <g key={m.id} style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, transition: 'transform 250ms linear' }}>
            <g style={{ transform: `rotate(${angle}deg)` }}>
              <rect x="-70" y="-2" width="70" height="4" rx="2" fill="url(#sp-tail)" />
              <circle r="14" fill="url(#sp-photon)" opacity="0.7" className="photon-pulse" />
              <circle r="3.5" fill={toEarth ? 'white' : 'oklch(0.9 0.1 80)'} />
            </g>
          </g>
        ))}
      </svg>

      {packets.map(({ m, e, pos, toEarth }) => (
        <span
          key={m.id}
          className="text-space-foreground bg-space-1/80 border-space-line num absolute rounded-sm border px-1.5 py-0.5 text-[11px] whitespace-nowrap backdrop-blur-sm"
          style={{
            left: pct(pos.x, W),
            top: pct(pos.y, H),
            transform: pos.y < 90 ? 'translate(-50%, 14px)' : 'translate(-50%, calc(-100% - 14px))',
            transition: 'left 250ms linear, top 250ms linear',
          }}
        >
          {toEarth ? 'Report' : 'Reply'} · {CREW[m.payload.crewId ?? DEFAULT_CREW].callsign} · {countdown(e - now)}
        </span>
      ))}

      <span
        className="label text-space-muted absolute whitespace-nowrap"
        style={{ left: pct(mode === 'mars-transit' || mode === 'iss' ? SHIP.x : ORIGIN.x + 40, W), bottom: '6%', transform: 'translateX(-50%)' }}
      >
        {crewLabel}
      </span>
      <span className="label text-space-muted absolute whitespace-nowrap" style={{ left: pct(EARTH.x, W), bottom: '6%', transform: 'translateX(-50%)' }}>
        Earth
      </span>
    </div>
  )
}
