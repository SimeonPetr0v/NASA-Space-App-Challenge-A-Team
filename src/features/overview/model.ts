import { GAUGES, guidanceFor, type Gauge, type Guidance } from '@/data/indicator-display'
import { INDICATORS, type IndicatorDefinition } from '@/data/indicators'
import { assess, worstStatus } from '@/engine/assess'
import type { Assessment, BloodPressure, BodyRegion, IndicatorId, Reading, ReadingValue, Status } from '@/engine/types'

export type InstrumentRow = {
  id: IndicatorId
  def: IndicatorDefinition
  reading: Reading
  assessment: Assessment
  gauge: Gauge
  gaugeValue: number
  baseline?: number
  baselineDeltaPct?: number
  guidance?: Guidance
}

const SEVERITY: Record<Status, number> = { normal: 0, 'no-data': 1, stale: 1, caution: 2, danger: 3 }

export const formatValue = (value: ReadingValue) =>
  typeof value === 'number' ? String(value) : `${(value as BloodPressure).systolic}/${(value as BloodPressure).diastolic}`

export function buildRows(readings: Reading[], baseline: Partial<Record<IndicatorId, number>>): InstrumentRow[] {
  return readings.map((reading) => {
    const id = reading.indicatorId
    const assessment = assess(reading)
    const gauge = GAUGES[id]
    const gaugeValue = gauge.value(reading.value)
    const base = baseline[id]
    const status = assessment.status
    return {
      id,
      def: INDICATORS[id],
      reading,
      assessment,
      gauge,
      gaugeValue,
      baseline: base,
      baselineDeltaPct: base ? Math.round(((gaugeValue - base) / base) * 100) : undefined,
      guidance: status === 'caution' || status === 'danger' ? guidanceFor(status) : undefined,
    }
  })
}

export function summarize(rows: InstrumentRow[]) {
  const overall = worstStatus(rows.map((r) => r.assessment))
  const attention = rows.filter((r) => r.assessment.status === 'caution' || r.assessment.status === 'danger')
  const top = [...attention].sort((a, b) => SEVERITY[b.assessment.status] - SEVERITY[a.assessment.status])[0]
  return { overall, attentionCount: attention.length, top }
}

export function statusByRegion(rows: InstrumentRow[], regions: BodyRegion[]) {
  const result = Object.fromEntries(regions.map((r) => [r, 'no-data'])) as Record<BodyRegion, Status>
  for (const row of rows) {
    const region = row.def.region
    if (result[region] === 'no-data' || SEVERITY[row.assessment.status] > SEVERITY[result[region]]) result[region] = row.assessment.status
  }
  return result
}
