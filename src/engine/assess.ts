import { COMBINATION_RULES, INDICATOR_ORDER, INDICATORS, STALE_AFTER_HOURS } from '@/data/indicators'
import { readingError } from '@/engine/validate'
import type { Assessment, BloodPressure, CombinationFinding, Escalation, IndicatorId, Reading, ReadingValue, Status } from '@/engine/types'

/*
  Assessment engine: absolute range -> staleness -> personal baseline delta ->
  combination rules -> overall status and escalation. Thresholds and guidance
  text come only from src/data/indicators.ts.
*/

export const SEVERITY: Record<Status, number> = { normal: 0, 'no-data': 1, stale: 1, caution: 2, danger: 3 }

const HOUR = 3_600_000

/** Primary number for a reading (systolic for blood pressure) */
export const primaryValue = (v: ReadingValue): number => (typeof v === 'number' ? v : (v as BloodPressure).systolic)

export function formatValue(id: IndicatorId, v: ReadingValue): string {
  if (typeof v !== 'number') return `${v.systolic}/${v.diastolic}`
  return v.toFixed(INDICATORS[id].input.decimals)
}

export function classify(id: IndicatorId, value: ReadingValue): Status {
  return INDICATORS[id].classify(value)
}

/** Readings for one indicator, oldest first */
export function seriesOf(history: Reading[], id: IndicatorId): Reading[] {
  return history.filter((r) => r.indicatorId === id).sort((a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt))
}

/** Personal baseline = median of the first 7 readings (first week of the record) */
export function baselineOf(history: Reading[], id: IndicatorId): number | undefined {
  const first = seriesOf(history, id).slice(0, 7).map((r) => primaryValue(r.value))
  if (first.length < 3) return undefined
  const s = [...first].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export function assess(reading: Reading, history: Reading[] = [], now = Date.now()): Assessment {
  const def = INDICATORS[reading.indicatorId]
  /* Invalid input is never confused with danger (engine/validate.ts) */
  const error = readingError(reading)
  if (error) return { indicatorId: reading.indicatorId, status: 'no-data', reason: error, sourceUrl: def.sourceUrl }
  let status = def.classify(reading.value)
  const ageH = (now - Date.parse(reading.takenAt)) / HOUR
  if (ageH > STALE_AFTER_HOURS[reading.indicatorId] && status === 'normal') status = 'stale'
  const baseline = baselineOf(history, reading.indicatorId)
  const baselineDelta = baseline ? ((primaryValue(reading.value) - baseline) / baseline) * 100 : undefined
  const guidance = status === 'caution' || status === 'danger' ? def.guidance[status] : undefined
  const reason =
    status === 'normal'
      ? `${def.label} is within the usual range.`
      : status === 'stale'
        ? `${def.label} was last measured more than ${Math.round(STALE_AFTER_HOURS[reading.indicatorId] / 24)} days ago.`
        : status === 'no-data'
          ? `${def.label} has not been measured.`
          : `${def.label} is outside the usual range (${def.ranges.normal} ${def.unit}).`
  return { indicatorId: reading.indicatorId, status, reason, baselineDelta, guidance, sourceUrl: def.sourceUrl }
}

/** Latest reading per indicator, in display order */
export function latestReadings(history: Reading[]): Reading[] {
  const latest = new Map<IndicatorId, Reading>()
  for (const r of history) {
    const cur = latest.get(r.indicatorId)
    if (!cur || Date.parse(r.takenAt) >= Date.parse(cur.takenAt)) latest.set(r.indicatorId, r)
  }
  return INDICATOR_ORDER.flatMap((id) => (latest.has(id) ? [latest.get(id)!] : []))
}

export function worstStatus(assessments: Assessment[]): Status {
  if (!assessments.length) return 'no-data'
  return assessments.reduce<Status>((worst, a) => (SEVERITY[a.status] > SEVERITY[worst] ? a.status : worst), 'normal')
}

export function findCombinations(assessments: Assessment[]): CombinationFinding[] {
  const off = new Set(assessments.filter((a) => SEVERITY[a.status] >= 2).map((a) => a.indicatorId))
  return COMBINATION_RULES.filter((rule) => rule.indicators.every((id) => off.has(id)))
}

export type Summary = {
  overall: Status
  counts: Record<'normal' | 'caution' | 'danger' | 'other', number>
  /** Off-nominal assessments, most urgent first */
  priority: Assessment[]
  combinations: CombinationFinding[]
  escalation: Escalation
}

const ESCALATION_RANK: Record<Escalation, number> = { none: 0, 'self-care': 1, 'crew-medical-officer': 2, 'flight-surgeon': 3 }

export function summarize(assessments: Assessment[]): Summary {
  const overall = worstStatus(assessments)
  const counts = { normal: 0, caution: 0, danger: 0, other: 0 }
  for (const a of assessments) {
    if (a.status === 'normal' || a.status === 'caution' || a.status === 'danger') counts[a.status]++
    else counts.other++
  }
  const priority = assessments
    .filter((a) => a.status === 'caution' || a.status === 'danger')
    .sort((a, b) => SEVERITY[b.status] - SEVERITY[a.status] || INDICATOR_ORDER.indexOf(a.indicatorId) - INDICATOR_ORDER.indexOf(b.indicatorId))
  const combinations = findCombinations(assessments)
  let escalation: Escalation = counts.danger ? 'flight-surgeon' : counts.caution ? 'self-care' : 'none'
  for (const c of combinations) if (ESCALATION_RANK[c.escalation] > ESCALATION_RANK[escalation]) escalation = c.escalation
  return { overall, counts, priority, combinations, escalation }
}

export const ESCALATION_TEXT: Record<Escalation, { title: string; detail: string }> = {
  none: { title: 'No action needed', detail: 'Keep your measurement routine.' },
  'self-care': { title: 'Self-care and re-check', detail: 'Follow the steps below and re-measure on time.' },
  'crew-medical-officer': { title: 'Tell the crew medical officer', detail: 'A combination of readings needs a second pair of eyes on board.' },
  'flight-surgeon': { title: 'Notify the flight surgeon', detail: 'Act on the guidance now; the report travels to Earth in parallel.' },
}
