import { ArrowLeft, ExternalLink, Plus } from 'lucide-react'
import { RangeGauge } from '@/components/RangeGauge'
import { STATUS_META, StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import type { Mission } from '@/data/mission'
import type { BodyRegion, IndicatorId } from '@/engine/types'
import { cn } from '@/lib/utils'
import { REGIONS } from '@/features/body3d/regions'
import { formatValue, type InstrumentRow } from './model'

type Props = {
  rows: InstrumentRow[]
  mission: Mission
  isDemo: boolean
  selectedRegion: BodyRegion | null
  selectedId: IndicatorId | null
  onSelect: (row: InstrumentRow | null) => void
  onLog: () => void
}

const delta = (pct?: number) => {
  if (pct === undefined || Math.abs(pct) < 3) return 'about your usual'
  return `${pct > 0 ? '↑' : '↓'} ${Math.abs(pct)} % vs your usual`
}

function Row({ row, onSelect }: { row: InstrumentRow; onSelect: () => void }) {
  return (
    <li className="border-t first:border-t-0">
      <button
        type="button"
        onClick={onSelect}
        className="hover:bg-muted/70 -mx-2 flex w-[calc(100%+1rem)] flex-col gap-1.5 rounded-md px-2 py-3 text-left transition-colors duration-150"
      >
        <span className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">{row.def.label}</span>
          <StatusBadge status={row.assessment.status} size="sm" className="text-xs" />
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="font-numeric text-[30px] leading-none font-semibold tabular">{formatValue(row.reading.value)}</span>
          <span className="text-muted-foreground text-sm">{row.def.unit}</span>
          <span className="text-muted-foreground ml-auto text-xs tabular">{delta(row.baselineDeltaPct)}</span>
        </span>
        <time className="text-muted-foreground text-xs tabular" dateTime={row.reading.takenAt}>
          {new Date(row.reading.takenAt).toLocaleString()}
        </time>
        <RangeGauge gauge={row.gauge} value={row.gaugeValue} baseline={row.baseline} />
      </button>
    </li>
  )
}

function CompactRow({ row, onSelect }: { row: InstrumentRow; onSelect: () => void }) {
  const { Icon, text } = STATUS_META[row.assessment.status]
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-label={`${row.def.label}, ${formatValue(row.reading.value)} ${row.def.unit}, ${STATUS_META[row.assessment.status].word}`}
        className="hover:bg-muted/70 -mx-2 flex min-h-11 w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 text-left transition-colors duration-150"
      >
        <Icon size={16} strokeWidth={2.25} className={text} aria-hidden="true" />
        <span className="text-sm">{row.def.label}</span>
        <span className="font-numeric ml-auto text-[15px] font-semibold tabular">
          {formatValue(row.reading.value)} <span className="text-muted-foreground font-normal">{row.def.unit}</span>
        </span>
      </button>
    </li>
  )
}

function Detail({ row, onBack }: { row: InstrumentRow; onBack: () => void }) {
  const status = row.assessment.status
  return (
    <div className="flex flex-col gap-5">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground -ml-2 self-start">
        <ArrowLeft size={15} aria-hidden="true" />
        All readings
      </Button>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{row.def.label}</h2>
          <StatusBadge status={status} />
        </div>
        <p className="flex items-baseline gap-1.5">
          <span className="font-numeric text-5xl font-semibold tabular">{formatValue(row.reading.value)}</span>
          <span className="text-muted-foreground">{row.def.unit}</span>
        </p>
        <p className="text-muted-foreground text-sm tabular">
          {delta(row.baselineDeltaPct)}
          {row.baseline !== undefined ? ` (usual ${row.baseline} ${row.def.unit})` : ''}
        </p>
        <time className="text-muted-foreground text-sm tabular" dateTime={row.reading.takenAt}>
          Recorded {new Date(row.reading.takenAt).toLocaleString()}
        </time>
        <RangeGauge gauge={row.gauge} value={row.gaugeValue} baseline={row.baseline} showScale className="mt-2" />
        {row.gauge.label && <p className="text-muted-foreground text-xs">Gauge shows {row.gauge.label.toLowerCase()} pressure.</p>}
      </div>

      {row.guidance && (
        <section aria-label="What to do" className={cn('rounded-lg p-4', status === 'danger' ? 'bg-status-danger-bg' : 'bg-status-caution-bg')}>
          <h3 className="text-sm font-semibold">Prototype guidance</h3>
          <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5 text-sm">
            {row.guidance.doNow.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Re-check in</dt>
            <dd className="tabular">{row.guidance.recheckIn}</dd>
            <dt className="text-muted-foreground">Escalate if</dt>
            <dd>{row.guidance.escalateIf}</dd>
          </dl>
        </section>
      )}

      <section className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">Why it matters in space</h3>
        <p className="text-muted-foreground text-sm">{row.def.whyInSpace}</p>
      </section>
      <section className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">How to measure</h3>
        <p className="text-muted-foreground text-sm">{row.def.howToMeasure}</p>
        <p className="text-muted-foreground text-sm">Schedule: {row.def.schedule.toLowerCase()}</p>
      </section>
      <a className="text-primary inline-flex items-center gap-1 text-sm underline-offset-2 hover:underline" href={row.def.sourceUrl} target="_blank" rel="noreferrer">
        Source
        <ExternalLink size={13} aria-hidden="true" />
      </a>
    </div>
  )
}

export function Instruments({ rows, mission, isDemo, selectedRegion, selectedId, onSelect, onLog }: Props) {
  const regionRows = selectedRegion ? rows.filter((r) => r.def.region === selectedRegion) : []
  const detail = rows.find((r) => r.id === selectedId) ?? regionRows[0]
  const regionMeta = REGIONS.find((r) => r.id === selectedRegion)

  if (selectedRegion && !detail && regionMeta) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" onClick={() => onSelect(null)} className="text-muted-foreground -ml-2 self-start">
          <ArrowLeft size={15} aria-hidden="true" />
          All readings
        </Button>
        <h2 className="text-lg font-semibold">{regionMeta.label}</h2>
        <p className="text-muted-foreground text-sm">{regionMeta.summary}</p>
        <p className="text-sm">No reading is tracked for this system yet. A vision check is planned for a later version.</p>
      </div>
    )
  }

  if (detail) return <Detail row={detail} onBack={() => onSelect(null)} />

  const attention = rows.filter((r) => r.assessment.status === 'caution' || r.assessment.status === 'danger')
  const fine = rows.filter((r) => !attention.includes(r))

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold">Needs attention</h2>
        <span className="text-muted-foreground text-xs tabular">{attention.length} of {rows.length}</span>
      </div>
      {attention.length === 0 ? (
        <p className="text-muted-foreground py-3 text-sm">
          Everything is within your limits. Next check {isDemo ? `${mission.nextCheck} (demo schedule)` : 'per your mission schedule'}.
        </p>
      ) : (
        <ul className="mt-1">
          {attention.map((row) => (
            <Row key={row.id} row={row} onSelect={() => onSelect(row)} />
          ))}
        </ul>
      )}

      {fine.length > 0 && (
        <>
          <div className="mt-5 flex items-baseline justify-between border-t pt-4">
            <h2 className="text-base font-semibold">Within your limits</h2>
            <span className="text-muted-foreground text-xs tabular">
              Next check {isDemo ? `${mission.nextCheck} (demo schedule)` : 'per your mission schedule'}
            </span>
          </div>
          <ul className="mt-1">
            {fine.map((row) => (
              <CompactRow key={row.id} row={row} onSelect={() => onSelect(row)} />
            ))}
          </ul>
        </>
      )}
      <Button onClick={onLog} className="mt-3 min-h-11">
        <Plus size={16} aria-hidden="true" />
        Log reading
      </Button>
      <p className="text-muted-foreground mt-3 text-xs">
        {isDemo ? `Demo streak: ${mission.streakDays} days` : 'Personal streak tracking is not available'} · supports self-assessment only, it does not diagnose.
      </p>
    </div>
  )
}
