import type { Gauge } from '@/data/indicator-display'
import { cn } from '@/lib/utils'

const ZONE_COLOR = {
  normal: 'var(--status-ok)',
  caution: 'var(--status-caution)',
  danger: 'var(--status-danger)',
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
  The solid marker is today's value; the small notch is the astronaut's usual.
*/
export function RangeGauge({ gauge, value, baseline, showScale, className }: Props) {
  const min = gauge.zones[0].from
  const max = gauge.zones[gauge.zones.length - 1].to
  const pct = (v: number) => `${Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))}%`
  const edges = [...new Set(gauge.zones.slice(1).map((z) => z.from))]

  return (
    <div className={cn('w-full', className)} aria-hidden="true">
      <div className="relative h-2.5 w-full">
        <div className="absolute inset-y-0.5 inset-x-0 flex gap-[2px] overflow-hidden rounded-full">
          {gauge.zones.map((z) => (
            <span
              key={`${z.from}-${z.to}`}
              style={{
                width: `${((z.to - z.from) / (max - min)) * 100}%`,
                background: `color-mix(in oklab, ${ZONE_COLOR[z.status]} ${z.status === 'normal' ? 30 : 24}%, var(--card))`,
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
      {showScale && (
        <div className="text-muted-foreground relative mt-1.5 h-4 text-[11px] tabular">
          {edges.map((e) => (
            <span key={e} className="absolute -translate-x-1/2" style={{ left: pct(e) }}>
              {Math.round(e * 10) / 10}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
