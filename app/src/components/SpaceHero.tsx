import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { CountUp } from '@/components/motion'
import { EASE_OUT } from '@/components/motion-config'
import { StatusGlyph } from '@/components/StatusBadge'
import { STATUS_META } from '@/components/status-meta'
import { INDICATOR_ORDER } from '@/data/indicators'
import { CREW } from '@/data/crew'
import { MISSION_DAY_TODAY, MISSIONS } from '@/data/missions'
import { cn } from '@/lib/utils'
import { href } from '@/state/route'
import { useStore } from '@/state/store'
import { useHealth } from '@/state/useHealth'

/* Deterministic star field so the hero is identical on every load */
const STARS = Array.from({ length: 90 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453
    return x - Math.floor(x)
  }
  return { x: r(1) * 100, y: r(2) * 100, s: r(3) < 0.85 ? 0.6 + r(4) * 0.6 : 1.4 + r(4), tw: 2.5 + r(5) * 4, td: r(6) * 4, twinkle: r(7) < 0.35 }
})

const ARC = 'M 40 470 C 380 180, 760 110, 1048 225'

const TAGLINE: Record<string, string> = {
  iss: 'Seconds from Mission Control.',
  lunar: 'A heartbeat away from Earth.',
  'mars-transit': 'Even minutes away from Earth.',
  'mars-surface': 'Even on another planet.',
}

export function SpaceHero() {
  const { mode, delaySec, crewId } = useStore()
  const { summary, assessments } = useHealth()
  const meta = STATUS_META[summary.overall]
  const off = summary.counts.caution + summary.counts.danger
  const delayMin = delaySec / 60
  const stats = [
    { value: MISSION_DAY_TODAY, label: 'Mission day', decimals: 0 },
    delaySec >= 60 ? { value: delayMin, label: 'Min to Earth, one way', decimals: 0 } : { value: delaySec, label: 'Sec to Earth, one way', decimals: 1 },
    { value: INDICATOR_ORDER.length, label: 'Vitals tracked', decimals: 0 },
    { value: off, label: 'Need attention', decimals: 0 },
  ]

  return (
    <section aria-labelledby="hero-title" className="bg-space relative isolate overflow-hidden">
      {/* Stars */}
      <svg aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full">
        {STARS.map((st, i) => (
          <circle
            key={i}
            cx={`${st.x}%`}
            cy={`${st.y}%`}
            r={st.s}
            fill="currentColor"
            className={cn('text-space-foreground', st.twinkle ? 'twinkle' : 'opacity-50')}
            style={{ ['--tw' as string]: `${st.tw}s`, ['--td' as string]: `${st.td}s` }}
          />
        ))}
      </svg>

      {/* Trajectory: spacecraft travelling toward Earth */}
      <svg aria-hidden="true" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 -z-10 h-full w-full">
        <defs>
          <radialGradient id="earth-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="earth-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--signal)" />
            <stop offset="100%" stopColor="var(--space-3)" />
          </linearGradient>
        </defs>
        <circle cx="1120" cy="230" r="190" fill="url(#earth-glow)" />
        <circle cx="1120" cy="230" r="72" fill="url(#earth-fill)" opacity="0.92" />
        <circle cx="1120" cy="230" r="72" fill="none" stroke="var(--signal)" strokeOpacity="0.6" className="earth-pulse" />
        <motion.path
          d={ARC}
          fill="none"
          stroke="var(--space-foreground)"
          strokeOpacity="0.35"
          strokeWidth="1.25"
          strokeDasharray="2 8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.2, ease: EASE_OUT, delay: 0.3 }}
        />
        <g className="orbit-travel" style={{ offsetPath: `path('${ARC}')` }}>
          <path d="M-14 -5 L8 -5 L16 0 L8 5 L-14 5 Z" fill="var(--space-foreground)" />
          <path d="M-14 -5 L-22 -10 L-18 0 L-22 10 L-14 5 Z" fill="var(--space-foreground)" opacity="0.6" />
          <path d="M-22 0 L-48 0" stroke="var(--signal)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </g>
      </svg>

      {/* Heartbeat trace along the bottom */}
      <svg aria-hidden="true" viewBox="0 0 1200 80" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 -z-10 h-20 w-full opacity-60">
        <path
          d="M0 50 H300 L320 50 L335 20 L352 72 L368 8 L384 62 L398 50 H700 L720 50 L735 22 L752 70 L768 12 L784 60 L798 50 H1200"
          fill="none"
          stroke="var(--signal)"
          strokeWidth="1.75"
          pathLength={1}
          className="ecg"
        />
      </svg>

      <div className="mx-auto max-w-[1200px] px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-20 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="label text-space-muted"
        >
          Mission day {MISSION_DAY_TODAY} · {MISSIONS[mode].name} · Crew member {CREW[crewId].callsign}
        </motion.p>
        <h1 id="hero-title" className="mt-4 max-w-4xl text-4xl leading-[1.05] tracking-tight uppercase sm:text-6xl">
          <motion.span
            className="block font-bold"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.1 }}
          >
            Your health, at a glance.
          </motion.span>
          <motion.span
            key={mode}
            className="text-space-muted block font-light"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.22 }}
          >
            {TAGLINE[mode]}
          </motion.span>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center gap-4"
        >
          <span className="border-space-line bg-space-chip inline-flex min-h-11 items-center gap-2.5 rounded-sm border px-4 text-sm font-semibold tracking-[0.08em] uppercase backdrop-blur">
            <StatusGlyph status={summary.overall} className={cn('size-3.5', meta.glyph)} />
            {meta.word}
            <span className="text-space-muted font-normal tracking-normal normal-case">
              · {off === 0 ? 'all vitals nominal' : `${off} of ${assessments.length} vitals off-nominal`}
            </span>
          </span>
          <a
            href={href('log')}
            className="bg-space-foreground text-space-1 inline-flex min-h-11 items-center gap-2 rounded-sm px-5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
          >
            Log today’s check <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <a href={href('overview')} className="text-space-foreground inline-flex min-h-11 items-center gap-2 px-2 text-sm font-medium underline-offset-4 hover:underline">
            Open my status <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </motion.div>

        <dl className="mt-14 grid grid-cols-2 gap-y-8 sm:grid-cols-4">
          {stats.map((st, i) => (
            <motion.div
              key={st.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.55 + i * 0.08 }}
              className="border-space-line border-l pl-4 sm:pl-5"
            >
              <dd className="num text-4xl font-light sm:text-5xl">
                <CountUp value={st.value} decimals={st.decimals} />
              </dd>
              <dt className="label text-space-muted mt-1">{st.label}</dt>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  )
}
