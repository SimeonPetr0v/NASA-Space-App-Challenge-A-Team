import { MISSION_DAY_TODAY, MISSIONS } from '@/data/missions'
import type { MissionMode } from '@/engine/types'
import { delayText } from '@/lib/format'
import { cn } from '@/lib/utils'

/*
  The mission at a glance: origin -> spacecraft -> destination, today's position
  along the mission and the current one-way signal delay to Earth.
  Synthetic scenario length; science owner to confirm per mission.
*/
const LENGTH_DAYS: Record<MissionMode, number> = { iss: 180, lunar: 30, 'mars-transit': 210, 'mars-surface': 500 }
const DESTINATION: Record<MissionMode, string> = { iss: 'Station', lunar: 'Moon', 'mars-transit': 'Mars', 'mars-surface': 'Mars' }

export function MissionTrack({ mode, delaySec, className }: { mode: MissionMode; delaySec: number; className?: string }) {
  const total = LENGTH_DAYS[mode]
  const day = Math.min(MISSION_DAY_TODAY, total)
  const progress = day / total
  const mission = MISSIONS[mode]
  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 text-sm', className)}
      role="img"
      aria-label={`${mission.name}: day ${day} of ${total}; one-way signal delay to Earth ${delayText(delaySec)}`}
    >
      <span className="text-muted-foreground">Earth</span>
      <span className="relative block h-5 w-36 shrink-0 sm:w-56">
        <span className="bg-border-strong absolute top-1/2 h-px w-full -translate-y-1/2" />
        <span className="bg-foreground absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full" style={{ width: `${progress * 100}%` }} />
        <span className="bg-muted-foreground absolute top-1/2 left-0 size-1.5 -translate-y-1/2 rounded-full" />
        <span className="border-muted-foreground absolute top-1/2 right-0 size-2.5 -translate-y-1/2 rounded-full border" />
        <span
          className="border-foreground bg-card absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{ left: `${progress * 100}%` }}
        />
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
