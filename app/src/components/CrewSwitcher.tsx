import { StatusGlyph } from '@/components/StatusBadge'
import { STATUS_META } from '@/components/status-meta'
import { CREW, CREW_ORDER, type CrewId } from '@/data/crew'
import { cn } from '@/lib/utils'
import { useStore } from '@/state/store'
import { useCrewHealth } from '@/state/useHealth'

/* Whose data the app shows. Each member carries their overall status (shape + colour, word in the label). */
export function CrewSwitcher() {
  const { crewId, setCrew } = useStore()
  const crew = useCrewHealth()
  return (
    <>
      <div role="radiogroup" aria-label="Crew member" className="border-border-strong hidden h-9 items-stretch rounded-sm border lg:flex">
        {CREW_ORDER.map((id, i) => {
          const status = crew[id].summary.overall
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={crewId === id}
              aria-label={`${CREW[id].callsign}, ${CREW[id].role}, ${STATUS_META[status].word}`}
              title={`${CREW[id].callsign} · ${CREW[id].role}`}
              onClick={() => setCrew(id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 text-xs font-medium whitespace-nowrap transition-colors',
                i > 0 && 'border-border-strong border-l',
                crewId === id ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <span className={cn('flex size-4 items-center justify-center rounded-full', crewId === id ? 'bg-background' : 'bg-card')}>
                <StatusGlyph status={status} className="size-2.5" />
              </span>
              <span className="num">{CREW[id].callsign}</span>
            </button>
          )
        })}
      </div>
      <label className="lg:hidden">
        <span className="sr-only">Crew member</span>
        <select
          value={crewId}
          onChange={(e) => setCrew(e.target.value as CrewId)}
          className="border-border-strong bg-card h-11 rounded-sm border px-2 text-sm md:h-9"
        >
          {CREW_ORDER.map((id) => (
            <option key={id} value={id}>
              {CREW[id].callsign} · {STATUS_META[crew[id].summary.overall].word}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}
