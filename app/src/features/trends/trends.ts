import { INDICATOR_ORDER, INDICATORS } from '@/data/indicators'
import { TREND_RULES, TREND_STREAK_DAYS, TREND_WINDOW_DAYS } from '@/data/trend-rules'
import { baselineOf, primaryValue, seriesOf } from '@/engine/assess'
import type { IndicatorId, Reading } from '@/engine/types'

/*
  Slow-change detection: catches a trend before any single value crosses a
  threshold. Two checks per indicator, on one value per day:
  - streak: the last TREND_STREAK_DAYS days each moved the wrong way;
  - drift: the last TREND_WINDOW_DAYS days average moved past driftPct from
    the personal baseline in the wrong direction.
*/

export type TrendWarning = {
  indicatorId: IndicatorId
  kind: 'streak' | 'drift'
  /** Values oldest -> newest that the warning is about */
  values: number[]
  baseline?: number
  pct?: number
  text: string
}

const dailyValues = (history: Reading[], id: IndicatorId) => {
  const byDay = new Map<string, number>()
  for (const r of seriesOf(history, id)) byDay.set(r.takenAt.slice(0, 10), primaryValue(r.value))
  return [...byDay.values()]
}

const fmt = (id: IndicatorId, v: number) => v.toFixed(INDICATORS[id].input.decimals)

export function trendWarnings(history: Reading[]): TrendWarning[] {
  const out: TrendWarning[] = []
  for (const id of INDICATOR_ORDER) {
    const rule = TREND_RULES[id]
    if (!rule) continue
    const def = INDICATORS[id]
    const worse = (a: number, b: number) => (rule.direction === 'down' ? b < a : b > a)
    const days = dailyValues(history, id)
    const label = def.label.charAt(0).toUpperCase() + def.label.slice(1)
    const noun = id === 'sleep' ? 'nights' : 'days'

    const last = days.slice(-(TREND_STREAK_DAYS + 1))
    if (last.length === TREND_STREAK_DAYS + 1 && last.every((v, i) => i === 0 || worse(last[i - 1], v))) {
      out.push({
        indicatorId: id,
        kind: 'streak',
        values: last,
        text: `${label} has ${rule.direction === 'down' ? 'dropped' : 'risen'} ${TREND_STREAK_DAYS} ${noun} in a row: ${fmt(id, last[0])} → ${fmt(id, last.at(-1)!)} ${def.unit}.`,
      })
      continue
    }

    const baseline = baselineOf(history, id)
    const window = days.slice(-TREND_WINDOW_DAYS)
    if (baseline === undefined || window.length < TREND_WINDOW_DAYS || days.length < TREND_WINDOW_DAYS + 7) continue
    const avg = window.reduce((s, v) => s + v, 0) / window.length
    const pct = ((avg - baseline) / baseline) * 100
    if ((rule.direction === 'down' ? -pct : pct) >= rule.driftPct) {
      out.push({
        indicatorId: id,
        kind: 'drift',
        values: window,
        baseline,
        pct,
        text: `${label} is ${Math.abs(pct).toFixed(0)} % ${pct < 0 ? 'below' : 'above'} your usual over the last ${TREND_WINDOW_DAYS} days (${fmt(id, baseline)} → ${fmt(id, avg)} ${def.unit} on average).`,
      })
    }
  }
  return out
}
