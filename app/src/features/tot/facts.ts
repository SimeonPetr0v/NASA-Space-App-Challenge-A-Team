import { STATUS_META } from '@/components/status-meta'
import { CREW, type CrewId } from '@/data/crew'
import { DEMO_HISTORY_BY_CREW } from '@/data/demo-readings'
import { INDICATORS } from '@/data/indicators'
import { MISSION_DAY_TODAY, MISSIONS } from '@/data/missions'
import { CAREER_LIMIT_MSV, DOSE_RATE, PRIOR_CAREER_MSV } from '@/data/radiation'
import { formatValue, primaryValue, seriesOf } from '@/engine/assess'
import type { IndicatorId, MissionMode, Reading } from '@/engine/types'
import { trendWarnings } from '@/features/trends/trends'
import type { healthOf } from '@/state/useHealth'

/*
  The structured data sheet TOT is allowed to talk about. Everything here is
  computed by Khonsu's own analytics (assess, summarize, trendWarnings,
  radiation budget). The language model only explains it; it never sets or
  recomputes a threshold. Each line says whether it is measured or
  calculated, and whether the measurement is simulated demo data.
*/

export type Facts = {
  text: string
  topics: string[]
  overall: string
  /** Plain summary written by rules, not by a language model */
  basic: string
}

const RADIATION_EXTRA_KEY = 'ahm:radiation-drill-v1'
const readDrillDose = (crewId: CrewId) => {
  try {
    return (JSON.parse(localStorage.getItem(RADIATION_EXTRA_KEY) ?? '{}') as Partial<Record<CrewId, number>>)[crewId] ?? 0
  } catch {
    return 0
  }
}

const TOPIC_OF: Partial<Record<IndicatorId, string>> = {
  hr: 'cardiovascular',
  bp: 'cardiovascular',
  spo2: 'oxygen',
  temp: 'temperature',
  sleep: 'sleep',
  mood: 'mental-health',
  exercise: 'bone-muscle',
}

const dayAverages = (history: Reading[], id: IndicatorId) => {
  const byDay = new Map<string, number[]>()
  for (const r of seriesOf(history, id)) {
    const d = r.takenAt.slice(0, 10)
    byDay.set(d, [...(byDay.get(d) ?? []), primaryValue(r.value)])
  }
  return [...byDay.values()].map((v) => v.reduce((s, x) => s + x, 0) / v.length)
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : undefined)

export function buildFacts(opts: { crewId: CrewId; mode: MissionMode; history: Reading[]; health: ReturnType<typeof healthOf> }): Facts {
  const { crewId, mode, history, health } = opts
  const demo = new Set(DEMO_HISTORY_BY_CREW[crewId].map((r) => `${r.indicatorId}@${r.takenAt}`))
  const origin = (r: Reading) => (demo.has(`${r.indicatorId}@${r.takenAt}`) ? 'simulated demo data' : r.source === 'camera' ? 'camera estimate' : r.source === 'manual' ? 'entered by hand' : 'device')
  const topics = new Set<string>()
  const lines: string[] = []
  const m = MISSIONS[mode]

  lines.push(`MISSION: ${m.name}, day ${MISSION_DAY_TODAY}. Crew member ${CREW[crewId].callsign} (${CREW[crewId].role}), synthetic person for the demo.`)
  lines.push(`OVERALL STATUS (Khonsu analytics): ${STATUS_META[health.summary.overall].word}. Nominal ${health.summary.counts.normal}, caution ${health.summary.counts.caution}, act now ${health.summary.counts.danger}.`)

  lines.push('MEASURED (latest value per indicator):')
  for (const r of health.readings) {
    const def = INDICATORS[r.indicatorId]
    lines.push(`- ${def.label}: ${formatValue(r.indicatorId, r.value)} ${def.unit} at ${r.takenAt.slice(0, 16).replace('T', ' ')} UTC (${origin(r)})`)
  }
  if (health.who5) lines.push(`- WHO-5 wellbeing: ${health.who5.percent} % at ${health.who5.takenAt.slice(0, 16).replace('T', ' ')} UTC (questionnaire)`)

  lines.push('CALCULATED BY KHONSU ANALYTICS (status against ranges and personal baseline):')
  for (const a of health.assessments) {
    const def = INDICATORS[a.indicatorId]
    lines.push(`- ${def.label}: ${STATUS_META[a.status].word}. ${a.reason}${a.baselineDelta !== undefined ? ` Baseline difference ${a.baselineDelta > 0 ? '+' : ''}${a.baselineDelta.toFixed(1)}.` : ''}`)
    if (a.status !== 'normal' && TOPIC_OF[a.indicatorId]) topics.add(TOPIC_OF[a.indicatorId]!)
    if (a.guidance && a.status !== 'normal') lines.push(`  App guidance: ${a.guidance.doNow.join(' ')} Re-check in ${a.guidance.recheckIn}. Escalate if ${a.guidance.escalateIf}`)
  }

  lines.push('7-DAY AVERAGES (calculated, this week vs the week before):')
  for (const id of ['hr', 'sleep', 'exercise', 'spo2', 'temp'] as IndicatorId[]) {
    const days = dayAverages(history, id)
    const now = avg(days.slice(-7))
    const before = avg(days.slice(-14, -7))
    if (now === undefined) continue
    const d = INDICATORS[id].input.decimals
    lines.push(`- ${INDICATORS[id].label}: ${now.toFixed(d)} ${INDICATORS[id].unit}${before !== undefined ? ` (week before ${before.toFixed(d)})` : ''}`)
  }

  const trends = trendWarnings(history)
  lines.push(trends.length ? 'TREND WARNINGS (calculated):' : 'TREND WARNINGS (calculated): none.')
  for (const t of trends) {
    lines.push(`- ${t.text}`)
    if (TOPIC_OF[t.indicatorId]) topics.add(TOPIC_OF[t.indicatorId]!)
  }

  const rate = DOSE_RATE[mode]
  const mission = rate.mSvPerDay * MISSION_DAY_TODAY + readDrillDose(crewId)
  const career = PRIOR_CAREER_MSV[crewId] + mission
  lines.push(
    `RADIATION (calculated from published dose rates, not a personal dosimeter): this mission about ${Math.round(mission)} mSv at ${rate.mSvPerDay} mSv/day; career dose ${Math.round(career)} of the ${CAREER_LIMIT_MSV} mSv NASA career limit (${Math.round((career / CAREER_LIMIT_MSV) * 100)} %).`,
  )

  const off = health.assessments.filter((a) => a.status !== 'normal')
  const basic = [
    `Overall: ${STATUS_META[health.summary.overall].word}.`,
    ...off.map((a) => `- ${INDICATORS[a.indicatorId].label}: ${STATUS_META[a.status].word}. ${a.reason}`),
    ...trends.map((t) => `- ${t.text}`),
    `Radiation: about ${Math.round(mission)} mSv this mission; career ${Math.round(career)} of ${CAREER_LIMIT_MSV} mSv.`,
  ].join('\n')

  return { text: lines.join('\n'), topics: [...topics], overall: STATUS_META[health.summary.overall].word, basic }
}
