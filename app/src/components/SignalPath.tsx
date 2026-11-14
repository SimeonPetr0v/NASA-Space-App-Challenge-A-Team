import { Earth, Rocket } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { EASE_OUT } from '@/components/motion-config'
import type { LinkMessage } from '@/engine/types'
import { countdown } from '@/lib/format'
import { cn } from '@/lib/utils'

/*
  Crew <-> Earth signal path. Purpose: explanation (messages really take minutes
  to cross) and feedback (a ring pulse when something arrives). Packet positions
  come from the simulated clock; the arc and the dash flow are visual only.
*/

const P0 = { x: 6, y: 78 }
const C = { x: 50, y: -8 }
const P2 = { x: 94, y: 78 }

const onArc = (t: number) => ({
  x: (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * C.x + t ** 2 * P2.x,
  y: (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * C.y + t ** 2 * P2.y,
})

const ARC = `M ${P0.x * 10} ${P0.y * 1.2} Q ${C.x * 10} ${C.y * 1.2} ${P2.x * 10} ${P2.y * 1.2}`

type Props = {
  inFlight: LinkMessage[]
  now: number
  lastToEarth?: number
  lastToCrew?: number
}

function ArrivalRing({ pulseKey }: { pulseKey?: number }) {
  const reduce = useReducedMotion()
  if (reduce || pulseKey === undefined) return null
  return (
    <AnimatePresence>
      <motion.span
        key={pulseKey}
        aria-hidden="true"
        className="border-primary absolute inset-0 rounded-full border-2"
        initial={{ scale: 1, opacity: 0.7 }}
        animate={{ scale: 2.1, opacity: 0 }}
        transition={{ duration: 1.1, ease: EASE_OUT }}
      />
    </AnimatePresence>
  )
}

export function SignalPath({ inFlight, now, lastToEarth, lastToCrew }: Props) {
  return (
    <div className="relative h-32 w-full select-none sm:h-36" aria-hidden="true">
      <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <path d={ARC} fill="none" stroke="var(--border-strong)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        <path
          d={ARC}
          fill="none"
          stroke="var(--primary)"
          pathLength={100}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          className="signal-flow"
          opacity={inFlight.length ? 0.9 : 0.35}
        />
      </svg>

      <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5" style={{ left: `${P0.x}%`, top: `${P0.y}%` }}>
        <span className="bg-card border-border-strong relative flex size-10 items-center justify-center rounded-full border">
          <Rocket className="size-4" />
          <ArrivalRing pulseKey={lastToCrew} />
        </span>
        <span className="label text-muted-foreground">Crew</span>
      </div>

      <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5" style={{ left: `${P2.x}%`, top: `${P2.y}%` }}>
        <span className="bg-card border-border-strong relative flex size-10 items-center justify-center rounded-full border">
          <Earth className="size-4" />
          <ArrivalRing pulseKey={lastToEarth} />
        </span>
        <span className="label text-muted-foreground">Earth</span>
      </div>

      {inFlight.map((m) => {
        const s = Date.parse(m.createdAt)
        const e = Date.parse(m.arrivesAt)
        const p = Math.min(1, Math.max(0, (now - s) / Math.max(1, e - s)))
        const t = m.direction === 'to-earth' ? p : 1 - p
        const pos = onArc(t)
        const toEarth = m.direction === 'to-earth'
        return (
          <motion.div
            key={m.id}
            className="absolute"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transition: 'left 250ms linear, top 250ms linear' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
          >
            <span
              className={cn('absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full', toEarth ? 'bg-primary' : 'bg-foreground')}
              style={{ boxShadow: `0 0 0 5px color-mix(in oklab, ${toEarth ? 'var(--primary)' : 'var(--foreground)'} 18%, transparent)` }}
            />
            <span className="bg-card border-border num absolute bottom-3 -translate-x-1/2 rounded-sm border px-1.5 py-0.5 text-[11px] whitespace-nowrap shadow-sm">
              {toEarth ? 'Report' : 'Reply'} · {countdown(e - now)}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
