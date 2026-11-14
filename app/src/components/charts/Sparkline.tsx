import { motion } from 'motion/react'
import { INDICATORS } from '@/data/indicators'
import { classify, primaryValue } from '@/engine/assess'
import type { IndicatorId, Reading } from '@/engine/types'
import { STATUS_META } from '../status-meta'

/** 7-point trend with the normal band shaded. Decorative: the table row carries the numbers. */
export function Sparkline({ id, series, width = 112, height = 32 }: { id: IndicatorId; series: Reading[]; width?: number; height?: number }) {
  const def = INDICATORS[id]
  const values = series.map((r) => primaryValue(r.value))
  if (values.length < 2) return <span className="text-subtle-foreground text-xs">-</span>
  const lo0 = Math.min(def.band.low, ...values)
  const hi0 = Math.max(def.band.high, ...values)
  const span = Math.max(hi0 - lo0, 1e-6)
  const lo = lo0 - span * 0.1
  const hi = hi0 + span * 0.1
  const pad = 3
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2)
  const y = (v: number) => pad + (1 - (v - lo) / (hi - lo)) * (height - pad * 2)
  const path = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const last = series[series.length - 1]
  const lastStatus = classify(id, last.value)
  const bandTop = y(Math.min(def.band.high, hi))
  const bandBottom = y(Math.max(def.band.low, lo))
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="block overflow-visible">
      <rect x={0} y={bandTop} width={width} height={Math.max(0, bandBottom - bandTop)} fill="var(--chart-band)" />
      <motion.path
        d={path}
        fill="none"
        stroke="var(--chart-line)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
      />
      <motion.circle
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: 1.1 }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        cx={x(values.length - 1)}
        cy={y(values[values.length - 1])}
        r={3}
        className={STATUS_META[lastStatus].glyph}
        fill="currentColor"
        stroke="var(--card)"
        strokeWidth={1.5}
      />
    </svg>
  )
}
