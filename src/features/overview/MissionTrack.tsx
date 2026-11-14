import type { Mission } from '@/data/mission'

/*
  The mission at a glance: origin → spacecraft → destination, with today's
  position along the transfer and the current one-way signal delay to Earth.
*/
export function MissionTrack({ mission }: { mission: Mission }) {
  const progress = Math.min(1, Math.max(0, mission.day / mission.totalDays))
  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm"
      role="img"
      aria-label={`${mission.modeLabel}: day ${mission.day} of ${mission.totalDays}; one-way signal delay to Earth ${mission.oneWayDelayMinutes} minutes`}
    >
      <span className="text-muted-foreground">{mission.origin}</span>
      <span className="relative block h-5 w-28 shrink-0 sm:w-40">
        <span className="bg-border absolute top-1/2 h-px w-full -translate-y-1/2" />
        <span className="bg-primary absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full" style={{ width: `${progress * 100}%` }} />
        <span className="border-primary bg-card absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" style={{ left: `${progress * 100}%` }} />
        <span className="bg-muted-foreground absolute top-1/2 left-0 size-1.5 -translate-y-1/2 rounded-full" />
        <span className="border-muted-foreground absolute top-1/2 right-0 size-2 -translate-y-1/2 rounded-full border" />
      </span>
      <span className="text-muted-foreground">{mission.destination}</span>
      <span className="font-numeric text-foreground text-[15px] font-semibold whitespace-nowrap tabular">
        Day {mission.day}
        <span className="text-muted-foreground font-medium">/{mission.totalDays}</span>
      </span>
      <span className="text-muted-foreground border-l pl-3 whitespace-nowrap">
        Earth link <span className="font-numeric text-foreground text-[15px] font-semibold tabular">{mission.oneWayDelayMinutes} min</span>
      </span>
    </div>
  )
}
