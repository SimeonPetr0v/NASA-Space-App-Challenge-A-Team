import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { EASE_OUT } from '@/components/motion-config'
import { StatusBadge } from '@/components/StatusBadge'
import { MISSIONS } from '@/data/missions'
import { delayText } from '@/lib/format'
import { useStore, type Transmission } from '@/state/store'

/*
  Shown whenever a report leaves the crew side: a data capsule flies from the
  spacecraft to Earth. The flight is symbolic; the caption states the real
  one-way light time. Reduced motion skips straight to the arrival state.
*/

const PATH = 'M 190 430 C 420 120, 780 90, 1000 270'

function Flight({ t, onDone }: { t: Transmission; onDone: () => void }) {
  const { mode } = useStore()
  const reduce = useReducedMotion()
  const pathRef = useRef<SVGPathElement>(null)
  const shipRef = useRef<SVGGElement>(null)
  const progress = useMotionValue(reduce ? 1 : 0)
  const [arrived, setArrived] = useState(Boolean(reduce))
  const closeRef = useRef<HTMLButtonElement>(null)
  const origin = mode === 'iss' ? 'Station' : mode === 'lunar' ? 'Moon' : mode === 'mars-surface' ? 'Mars' : 'Spacecraft'
  const live = t.delaySec < 5

  useEffect(() => {
    const place = (p: number) => {
      const path = pathRef.current
      const ship = shipRef.current
      if (!path || !ship) return
      const len = path.getTotalLength()
      const a = path.getPointAtLength(p * len)
      const b = path.getPointAtLength(Math.min(len, p * len + 1))
      const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
      ship.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${angle})`)
      ship.style.opacity = p > 0.97 ? String(Math.max(0, (1 - p) / 0.03)) : '1'
    }
    place(progress.get())
    const unsub = progress.on('change', place)
    if (reduce) return unsub
    const controls = animate(progress, 1, { duration: 2.6, ease: [0.65, 0, 0.35, 1], delay: 0.35, onComplete: () => setArrived(true) })
    return () => {
      controls.stop()
      unsub()
    }
  }, [progress, reduce])

  useEffect(() => {
    if (!arrived) return
    closeRef.current?.focus()
    const id = window.setTimeout(onDone, 4200)
    return () => window.clearTimeout(id)
  }, [arrived, onDone])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onDone()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-title"
      className="bg-space fixed inset-0 z-[60] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      transition={{ duration: 0.35 }}
      onClick={() => arrived && onDone()}
    >
      <svg viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid meet" className="h-[60vh] w-full flex-none sm:flex-1" aria-hidden="true">
        <defs>
          <radialGradient id="tx-earth-glow">
            <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="tx-earth" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--signal)" />
            <stop offset="100%" stopColor="var(--space-3)" />
          </linearGradient>
          <linearGradient id="tx-trail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--signal)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--signal)" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {Array.from({ length: 60 }, (_, i) => (
          <circle key={i} cx={(i * 197) % 1200} cy={(i * 131) % 560} r={i % 7 === 0 ? 1.6 : 0.8} fill="var(--space-foreground)" opacity={0.25 + ((i * 37) % 60) / 100} />
        ))}

        {/* Origin */}
        <circle cx="190" cy="430" r="26" fill="var(--space-2)" stroke="var(--space-foreground)" strokeOpacity="0.4" />
        <text x="190" y="490" textAnchor="middle" fill="var(--space-muted)" fontSize="14" letterSpacing="2">
          {origin.toUpperCase()}
        </text>

        {/* Earth */}
        <circle cx="1000" cy="270" r="170" fill="url(#tx-earth-glow)" />
        <motion.circle cx="1000" cy="270" r="70" fill="url(#tx-earth)" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: EASE_OUT }} style={{ transformOrigin: '1000px 270px' }} />
        <clipPath id="tx-earth-clip">
          <circle cx="1000" cy="270" r="70" />
        </clipPath>
        <g clipPath="url(#tx-earth-clip)" fill="var(--space-1)" opacity="0.3">
          <path d="M935 225c18-14 44-16 58-6 10 7 6 18-6 22-14 5-10 16-24 22-16 7-34-4-38-18-2-8 2-15 10-20z" />
          <path d="M1010 230c14-6 34-2 46 10 10 10 4 24-10 26-10 2-12 12-24 14-14 2-22-10-18-22 2-8 0-22 6-28z" />
          <path d="M990 300c12-4 26 2 30 14 3 10-6 20-18 20-14 0-24-8-24-18 0-8 4-13 12-16z" />
        </g>
        <circle cx="1000" cy="270" r="70" fill="none" stroke="var(--space-foreground)" strokeOpacity="0.25" />
        <text x="1000" y="380" textAnchor="middle" fill="var(--space-muted)" fontSize="14" letterSpacing="2">
          EARTH · MISSION CONTROL
        </text>
        {arrived &&
          [0, 0.35, 0.7].map((d) => (
            <motion.circle
              key={d}
              cx="1000"
              cy="270"
              r="70"
              fill="none"
              stroke="var(--signal)"
              strokeWidth="2"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 2.1, opacity: 0 }}
              transition={{ duration: 1.6, delay: d, ease: EASE_OUT }}
              style={{ transformOrigin: '1000px 270px' }}
            />
          ))}

        {/* Trajectory, trail and capsule */}
        <path ref={pathRef} d={PATH} fill="none" stroke="var(--space-foreground)" strokeOpacity="0.25" strokeDasharray="2 8" />
        <motion.path d={PATH} fill="none" stroke="url(#tx-trail)" strokeWidth="2.5" strokeLinecap="round" style={{ pathLength: progress }} />
        <g ref={shipRef}>
          <path d="M-30 0 L-70 0" stroke="var(--signal)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          <path d="M-20 -8 L10 -8 L24 0 L10 8 L-20 8 Z" fill="var(--space-foreground)" />
          <path d="M-20 -8 L-30 -16 L-26 0 L-30 16 L-20 8 Z" fill="var(--space-foreground)" opacity="0.65" />
          <rect x="-6" y="-3" width="9" height="6" rx="1" fill="var(--space-3)" />
        </g>
      </svg>

      <div className="mx-auto w-full max-w-xl px-6 pb-12 text-center" aria-live="polite">
        <AnimatePresence mode="wait">
          {!arrived ? (
            <motion.div key="go" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              <p className="label text-space-muted">Transmitting</p>
              <h2 id="tx-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {t.title}
              </h2>
              <p className="text-space-muted mt-2 text-sm">{t.detail}</p>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT }}>
              <p className="label text-signal">{live ? 'Delivered' : 'Sent'}</p>
              <h2 id="tx-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {live ? 'Mission Control has your report' : 'Your report is on its way to Earth'}
              </h2>
              <p className="text-space-muted mt-2 text-sm">
                {live
                  ? 'The flight surgeon can see it now.'
                  : `Real signal time from ${MISSIONS[mode].short}: ${delayText(t.delaySec)} one way. The guidance on your screen applies now; you do not need to wait for Earth.`}
              </p>
              <div className="mt-3 flex justify-center">
                <span className="bg-space-chip border-space-line inline-flex items-center rounded-sm border px-3 py-1.5 [&_span]:text-space-foreground">
                  <StatusBadge status={t.worst} />
                </span>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onDone}
                className="bg-space-foreground text-space-1 mt-6 inline-flex min-h-11 items-center rounded-sm px-6 text-sm font-semibold"
              >
                Continue
              </button>
              <p className="text-space-muted mt-4 text-xs">Animation is symbolic. Simulated link; no data leaves this device.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function TransmitOverlay() {
  const { transmission, clearTransmission } = useStore()
  return <AnimatePresence>{transmission && <Flight key={transmission.id} t={transmission} onDone={clearTransmission} />}</AnimatePresence>
}
