import { StatusGlyph } from '@/components/StatusBadge'
import { STATUS_META } from '@/components/status-meta'
import { FEATURES } from '@/config/features'
import { CREW, CREW_ORDER } from '@/data/crew'
import { MISSION_DAY_TODAY, MISSIONS } from '@/data/missions'
import { inWords, nextCheck } from '@/features/schedule/schedule'
import { delayText, pad, utcTime } from '@/lib/format'
import { LENGTH_DAYS, met } from '@/lib/mission-clock'
import { cn } from '@/lib/utils'
import { useSimNow, useStore } from '@/state/store'
import { useCrewHealth } from '@/state/useHealth'

/*
  Mission rail: a slim instrument strip in the empty left margin of wide
  screens (1600 px and up). Mission, clock, crew status (click to switch)
  and the next scheduled check. Hidden on smaller screens, where the same
  information is already in the top bar and on Overview.
*/
export function MissionRail() {
  const { mode, delaySec, crewId, setCrew, history } = useStore()
  const crew = useCrewHealth()
  const now = useSimNow(1000)
  const { d, h, m, s } = met(now)
  const mission = MISSIONS[mode]
  const total = LENGTH_DAYS[mode]
  const day = Math.min(MISSION_DAY_TODAY, total)
  const due = FEATURES.scheduleReminders ? nextCheck(now, history) : null

  return (
    <aside aria-label="Mission status" className="panel fixed top-1/2 left-5 z-20 hidden w-44 -translate-y-1/2 flex-col gap-5 p-4 text-xs min-[1600px]:flex">
      <section className="grid gap-1.5">
        <p className="label text-muted-foreground">Mission</p>
        <p className="text-sm leading-snug font-medium">{mission.name}</p>
        <p className="num text-foreground text-lg font-semibold">
          Day {day}
          <span className="text-muted-foreground text-sm font-normal">/{total}</span>
        </p>
        <div className="bg-muted h-1 overflow-hidden rounded-full" aria-hidden="true">
          <div className="bg-teal h-full rounded-full" style={{ width: `${(day / total) * 100}%` }} />
        </div>
        <dl className="text-muted-foreground mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt>Gravity</dt>
          <dd className="num text-foreground text-right">{mission.gravity}</dd>
          <dt>Earth link</dt>
          <dd className="num text-foreground text-right">{delayText(delaySec)}</dd>
        </dl>
      </section>

      <section className="border-border grid gap-1.5 border-t pt-4">
        <p className="label text-muted-foreground">Clock</p>
        <dl className="text-muted-foreground grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt>MET</dt>
          <dd className="num text-foreground text-right">
            {d}d {pad(h)}:{pad(m)}:{pad(s)}
          </dd>
          <dt>UTC</dt>
          <dd className="num text-foreground text-right">{utcTime(now)}</dd>
        </dl>
      </section>

      <section className="border-border grid gap-1.5 border-t pt-4">
        <p className="label text-muted-foreground">Crew</p>
        <ul className="grid gap-1">
          {CREW_ORDER.map((id) => {
            const status = crew[id].summary.overall
            const on = id === crewId
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setCrew(id)}
                  aria-pressed={on}
                  aria-label={`Show ${CREW[id].callsign}, ${STATUS_META[status].word}`}
                  className={cn('flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors', on ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground')}
                >
                  <StatusGlyph status={status} />
                  <span className="num font-medium">{CREW[id].callsign}</span>
                  <span className={cn('ml-auto', STATUS_META[status].ink)}>{STATUS_META[status].word}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {due && (
        <section className="border-border grid gap-1 border-t pt-4">
          <p className="label text-muted-foreground">Next check</p>
          <p className="text-sm font-medium">{due.label}</p>
          <p className={cn(due.state === 'overdue' ? 'text-status-caution-ink font-medium' : 'text-muted-foreground')}>
            {due.state === 'overdue' ? `Overdue by ${inWords(due.inMin)}` : `In ${inWords(due.inMin)}`}
          </p>
        </section>
      )}
    </aside>
  )
}
