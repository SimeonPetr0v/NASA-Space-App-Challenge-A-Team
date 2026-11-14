import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { missionDayOf } from '@/data/demo-readings'
import { INDICATORS } from '@/data/indicators'
import { classify, formatValue, primaryValue } from '@/engine/assess'
import type { IndicatorId, Reading, Status } from '@/engine/types'
import { STATUS_META } from '../status-meta'

/*
  One message per chart: the indicator over time against its normal band.
  Normal band shaded, personal baseline dashed, off-nominal points marked with
  their status glyph. X axis in mission days. Crosshair tooltip on hover/focus.
*/

type Props = { id: IndicatorId; series: Reading[]; baseline?: number; height?: number }

const M = { top: 16, right: 20, bottom: 32, left: 44 }

function Mark({ x, y, status }: { x: number; y: number; status: Status }) {
  const cls = STATUS_META[status].glyph
  if (status === 'caution')
    return <path d={`M${x},${y - 6} L${x + 6},${y + 4.5} L${x - 6},${y + 4.5}Z`} className={cls} fill="currentColor" stroke="var(--card)" strokeWidth={1.5} />
  if (status === 'danger')
    return <path d={`M${x},${y - 6} L${x + 6},${y} L${x},${y + 6} L${x - 6},${y}Z`} className={cls} fill="currentColor" stroke="var(--card)" strokeWidth={1.5} />
  return <circle cx={x} cy={y} r={2.5} fill="var(--chart-line)" stroke="var(--card)" strokeWidth={1} />
}

function niceTicks(lo: number, hi: number, count = 5) {
  const raw = (hi - lo) / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000)
  return out
}

export function TrendChart({ id, series, baseline, height = 280 }: Props) {
  const def = INDICATORS[id]
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, Math.floor(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pts = series.map((r) => ({ r, day: missionDayOf(r.takenAt), v: primaryValue(r.value), status: classify(id, r.value) }))
  if (pts.length === 0) return <p className="text-muted-foreground text-sm">No readings in this period.</p>

  const values = pts.map((p) => p.v)
  const lo = Math.min(def.domain[0], ...values, baseline ?? Infinity)
  const hi = Math.max(def.domain[1], ...values, baseline ?? -Infinity)
  const dayMin = pts[0].day
  const dayMax = Math.max(pts[pts.length - 1].day, dayMin + 1)
  const iw = width - M.left - M.right
  const ih = height - M.top - M.bottom
  const x = (day: number) => M.left + ((day - dayMin) / (dayMax - dayMin)) * iw
  const y = (v: number) => M.top + (1 - (v - lo) / (hi - lo)) * ih
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.v).toFixed(1)}`).join('')
  const yTicks = niceTicks(lo, hi)
  const dayStep = dayMax - dayMin > 14 ? 5 : 1
  const xTicks: number[] = []
  for (let d = Math.ceil(dayMin / dayStep) * dayStep; d <= dayMax; d += dayStep) xTicks.push(d)
  const bandTop = y(Math.min(def.band.high, hi))
  const bandBottom = y(Math.max(def.band.low, lo))
  const h = hover !== null ? pts[hover] : null

  const pick = (clientX: number) => {
    const rect = wrap.current?.getBoundingClientRect()
    if (!rect) return
    const px = clientX - rect.left
    let best = 0
    pts.forEach((p, i) => {
      if (Math.abs(x(p.day) - px) < Math.abs(x(pts[best].day) - px)) best = i
    })
    setHover(best)
  }

  return (
    <div
      ref={wrap}
      className="relative w-full min-w-0 overflow-hidden touch-pan-y select-none"
      style={{ minHeight: height }}
      onPointerMove={(e) => pick(e.clientX)}
      onPointerLeave={() => setHover(null)}
      tabIndex={0}
      role="img"
      aria-label={`${def.label} over mission days ${dayMin} to ${dayMax}. Normal range ${def.ranges.normal} ${def.unit}. Use left and right arrow keys to read each point.`}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') setHover((i) => Math.min(pts.length - 1, (i ?? -1) + 1))
        if (e.key === 'ArrowLeft') setHover((i) => Math.max(0, (i ?? pts.length) - 1))
        if (e.key === 'Escape') setHover(null)
      }}
      onBlur={() => setHover(null)}
    >
      {width > 0 && (
      <svg width={width} height={height} className="block">
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" />
            <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="num fill-muted-foreground text-[11px]">
              {t}
            </text>
          </g>
        ))}
        <motion.rect
          key={`band-${id}`}
          x={M.left}
          width={iw}
          y={bandTop}
          height={Math.max(0, bandBottom - bandTop)}
          fill="var(--chart-band)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <line x1={M.left} x2={width - M.right} y1={bandTop} y2={bandTop} stroke="var(--chart-band-edge)" />
        <line x1={M.left} x2={width - M.right} y1={bandBottom} y2={bandBottom} stroke="var(--chart-band-edge)" />
        <text x={M.left + 6} y={bandBottom - 6} className="fill-status-ok-ink text-[10px] font-semibold tracking-wider uppercase">
          Normal range
        </text>
        {baseline !== undefined && (
          <g>
            <line x1={M.left} x2={width - M.right} y1={y(baseline)} y2={y(baseline)} stroke="var(--chart-baseline)" strokeDasharray="4 4" />
            <text x={width - M.right - 4} y={y(baseline) - 5} textAnchor="end" className="num fill-muted-foreground text-[10px]">
              Baseline {baseline.toFixed(def.input.decimals)}
            </text>
          </g>
        )}
        {xTicks.map((d) => (
          <text key={d} x={x(d)} y={height - 10} textAnchor="middle" className="num fill-muted-foreground text-[11px]">
            {d}
          </text>
        ))}
        <text x={M.left} y={height - 10} dx={-36} className="fill-muted-foreground text-[11px]">
          Day
        </text>
        <motion.path
          key={`${id}-${pts.length}-${dayMin}`}
          d={line}
          fill="none"
          stroke="var(--chart-line)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
        />
        {h && <line x1={x(h.day)} x2={x(h.day)} y1={M.top} y2={M.top + ih} stroke="var(--border-strong)" />}
        {pts.map((p, i) => (
          <motion.g
            key={`${id}-${dayMin}-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 + (i / pts.length) * 0.9 }}
          >
            <Mark x={x(p.day)} y={y(p.v)} status={p.status} />
          </motion.g>
        ))}
        {h && <circle cx={x(h.day)} cy={y(h.v)} r={5} fill="none" stroke="var(--foreground)" strokeWidth={1.5} />}
      </svg>
      )}
      {h && width > 0 && (
        <div
          className="panel pointer-events-none absolute z-10 min-w-36 px-3 py-2 text-xs shadow-[var(--shadow-pop)]"
          style={{
            left: Math.min(Math.max(x(h.day) - 72, 0), width - 150),
            top: Math.max(0, y(h.v) - 78),
          }}
          aria-live="polite"
        >
          <p className="text-muted-foreground">Mission day {h.day}</p>
          <p className="num mt-0.5 text-base font-semibold">
            {formatValue(id, h.r.value)} <span className="text-muted-foreground text-xs font-normal">{def.unit}</span>
          </p>
          <p className={`mt-1 font-semibold uppercase tracking-wider ${STATUS_META[h.status].ink}`}>{STATUS_META[h.status].word}</p>
        </div>
      )}
    </div>
  )
}
