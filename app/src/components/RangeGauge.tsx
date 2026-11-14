import type { IndicatorDefinition } from '@/data/indicators'
import type { Status } from '@/engine/types'
import { cn } from '@/lib/utils'

/*
  Where today's value sits between the danger / caution / normal zones.
  Zones are derived from the indicator's own classify() over its chart domain,
  so the gauge always matches the science owner's thresholds.
  Solid marker = today; small notch = the astronaut's usual (baseline).
*/

type Zone = { from: number; to: number; status: Status }

const ZONE_COLOR: Partial<Record<Status, string>> = {
  normal: 'var(--status-ok)',
  caution: 'var(--status-caution)',
  danger: 'var(--status-danger)',
}

const cache = new Map<string, Zone[]>()

function zonesOf(def: IndicatorDefinition): Zone[] {
  const hit = cache.get(def.id)
  if (hit) return hit
  const [min, max] = def.domain
  const steps = 160
  const classifyAt = (v: number) =>
    def.classify(def.id === 'bp' ? { systolic: v, diastolic: 70 } : v)
  const zones: Zone[] = []
  for (let i = 0; i < steps; i++) {
    const from = min + ((max - min) * i) / steps
    const to = min + ((max - min) * (i + 1)) / steps
    const status = classifyAt((from + to) / 2)
    const last = zones.at(-1)
    if (last && last.status === status) last.to = to
    else zones.push({ from, to, status })
  }
  cache.set(def.id, zones)
  return zones
}

type Props = { def: IndicatorDefinition; value: number; baseline?: number; className?: string }

export function RangeGauge({ def, value, baseline, className }: Props) {
  const zones = zonesOf(def)
  const [min, max] = def.domain
  const pct = (v: number) => `${Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))}%`

  return (
    <div className={cn('relative h-2.5 w-full', className)} aria-hidden="true">
      <div className="absolute inset-x-0 inset-y-0.5 flex gap-[2px] overflow-hidden rounded-full">
        {zones.map((z) => (
          <span
            key={z.from}
            style={{
              width: `${((z.to - z.from) / (max - min)) * 100}%`,
              background: `color-mix(in oklab, ${ZONE_COLOR[z.status] ?? 'var(--status-none)'} ${z.status === 'normal' ? 30 : 24}%, var(--card))`,
            }}
          />
        ))}
      </div>
      {baseline !== undefined && (
        <span className="bg-muted-foreground absolute -top-0.5 h-1.5 w-[2px] -translate-x-1/2 rounded-full" style={{ left: pct(baseline) }} />
      )}
      <span
        className="bg-foreground absolute top-1/2 h-4 w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: pct(value), boxShadow: '0 0 0 2px var(--card)' }}
      />
    </div>
  )
}
