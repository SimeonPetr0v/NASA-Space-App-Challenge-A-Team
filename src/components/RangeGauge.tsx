import type { Gauge } from '@/data/indicator-display'
import { cn } from '@/lib/utils'

const ZONE_BG = {
  normal: 'bg-status-ok-bg',
  caution: 'bg-status-caution-bg',
  danger: 'bg-status-danger-bg',
}

type Props = {
  gauge: Gauge
  value: number
  baseline?: number
  showScale?: boolean
  className?: string
}

/*
  Where today's value sits within the danger / caution / normal zones.
  The dark marker is today's value; the hollow tick is the astronaut's baseline.
*/
export function RangeGauge({ gauge, value, baseline, showScale, className }: Props) {
  const min = gauge.zones[0].from
  const max = gauge.zones[gauge.zones.length - 1].to
  const pct = (v: number) => `${Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))}%`
  const edges = [...new Set(gauge.zones.slice(1).map((z) => z.from))]

  return (
    <div className={cn('w-full', className)} aria-hidden="true">
      <div className="relative h-2 w-full">
        <div className="absolute inset-0 flex overflow-hidden rounded-full">
          {gauge.zones.map((z) => (
            <span key={`${z.from}-${z.to}`} className={ZONE_BG[z.status]} style={{ width: `${((z.to - z.from) / (max - min)) * 100}%` }} />
          ))}
        </div>
        {baseline !== undefined && (
          <span className="border-muted-foreground absolute top-1/2 h-3.5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-card" style={{ left: pct(baseline) }} />
        )}
        <span className="bg-foreground ring-card absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2" style={{ left: pct(value) }} />
      </div>
      {showScale && (
        <div className="text-muted-foreground relative mt-1.5 h-4 text-[11px] tabular">
          {edges.map((e) => (
            <span key={e} className="absolute -translate-x-1/2" style={{ left: pct(e) }}>
              {e}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
