import { motion, useReducedMotion } from 'motion/react'
import { EASE_OUT } from '@/components/motion-config'
import { MISSION_DAY_TODAY, MISSIONS } from '@/data/missions'
import type { MissionMode } from '@/engine/types'
import { delayText } from '@/lib/format'
import { cn } from '@/lib/utils'

/*
  The mission at a glance: origin -> spacecraft -> destination, today's position
  along the mission and the current one-way signal delay to Earth.
  Synthetic scenario length; science owner to confirm per mission.
  Motion: the craft travels to today's position once (explanation), then a
  small signal pulse runs back to Earth (the link is live). Both are off under
  reduced motion.
*/
const LENGTH_DAYS: Record<MissionMode, number> = { iss: 180, lunar: 30, 'mars-transit': 210, 'mars-surface': 500 }
const DESTINATION: Record<MissionMode, string> = { iss: 'Station', lunar: 'Moon', 'mars-transit': 'Mars', 'mars-surface': 'Mars' }

export function MissionTrack({ mode, delaySec, className }: { mode: MissionMode; delaySec: number; className?: string }) {
  const total = LENGTH_DAYS[mode]
  const day = Math.min(MISSION_DAY_TODAY, total)
  const progress = day / total
  const mission = MISSIONS[mode]
  const reduce = useReducedMotion()
  const at = `${progress * 100}%`
  const travel = { duration: reduce ? 0 : 1.2, ease: EASE_OUT, delay: reduce ? 0 : 0.15 }
  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 text-sm', className)}
      role="img"
      aria-label={`${mission.name}: day ${day} of ${total}; one-way signal delay to Earth ${delayText(delaySec)}`}
    >
      <span className="text-muted-foreground">Earth</span>
      <span className="relative block h-5 w-36 shrink-0 [overflow-x:clip] [overflow-clip-margin:10px] sm:w-56">
        <span className="bg-border-strong absolute top-1/2 h-px w-full -translate-y-1/2" />
        <motion.span
          key={`fill-${mode}`}
          className="bg-foreground absolute top-1/2 left-0 h-0.5 w-full origin-left -translate-y-1/2 rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={travel}
        />
        <span className="bg-muted-foreground absolute top-1/2 left-0 size-1.5 -translate-y-1/2 rounded-full" />
        <span className="border-muted-foreground absolute top-1/2 right-0 size-2.5 -translate-y-1/2 rounded-full border" />
        {!reduce && (
          <motion.span
            key={`photon-${mode}`}
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-full"
            initial={{ x: at, opacity: 0 }}
            animate={{ x: [at, '0%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.6, ease: 'linear', delay: 1.6, repeat: Infinity, repeatDelay: 2.8, times: [0, 0.1, 0.85, 1] }}
          >
            <span className="bg-primary absolute top-1/2 left-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_22%,transparent)]" />
          </motion.span>
        )}
        <motion.span
          key={`craft-${mode}`}
          className="pointer-events-none absolute inset-y-0 left-0 w-full"
          initial={{ x: '0%' }}
          animate={{ x: at }}
          transition={travel}
        >
          <span className="border-foreground bg-card absolute top-1/2 left-0 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" />
        </motion.span>
      </span>
      <span className="text-muted-foreground">{DESTINATION[mode]}</span>
      <span className="num text-foreground text-base font-semibold">
        Day {day}
        <span className="text-muted-foreground font-medium">/{total}</span>
      </span>
      <span className="text-muted-foreground border-border border-l pl-4">
        Earth link <span className="num text-foreground text-base font-semibold">{delayText(delaySec)}</span> one way
      </span>
    </div>
  )
}
