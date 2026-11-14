import type { IndicatorId, Reading, ReadingValue } from '@/engine/types'
import { CREW_ORDER, DEFAULT_CREW, type CrewId } from './crew'
import { MISSION_DAY_TODAY } from './missions'

/*
  SYNTHETIC demo data - not real astronaut data. Label it as demo data in the UI.
  Scenario: mission day 47. Thirty days of history per crew member ending with
  today's morning check:
  - CM-1 (commander, CMO): all nominal, but sleep has fallen 4 nights in a row
    while every night is still above 7 h (shows the trend warning).
  - CM-2 (flight engineer): rising temperature and heart rate - caution.
  - CM-3 (mission specialist): falling oxygen saturation and very short sleep - act now.
*/

const DAY_MS = 86_400_000

/* The demo timeline is relative: today's morning check is always "today" (07:30 UTC). */
function morningCheck(): string {
  const d = new Date()
  d.setUTCHours(7, 30, 0, 0)
  if (d.getTime() > Date.now()) d.setTime(d.getTime() - DAY_MS)
  return d.toISOString()
}
export const DEMO_TODAY = morningCheck()

type Today = Record<Exclude<IndicatorId, 'bp'>, number> & { bp: [number, number] }
type Profile = { base: number; noise: number; drift: number; decimals: number; min?: number; max?: number }
type Profiles = Record<Exclude<IndicatorId, 'bp'>, Profile>
/* tail: exact values for the last days before today, oldest first (to script a story such as a slow sleep drop) */
type Scenario = { seed: number; today: Today; profiles: Profiles; bp: { sys: number; dia: number; drift: number }; tail?: Partial<Record<Exclude<IndicatorId, 'bp'>, number[]>> }

const BASE: Profiles = {
  hr: { base: 66, noise: 4, drift: 18, decimals: 0 },
  spo2: { base: 98, noise: 0.8, drift: -0.5, decimals: 0, max: 100 },
  temp: { base: 36.8, noise: 0.18, drift: 0.6, decimals: 1 },
  glu: { base: 88, noise: 5, drift: 3, decimals: 0 },
  sleep: { base: 7.2, noise: 0.5, drift: -1.2, decimals: 1 },
  mood: { base: 4.4, noise: 0.5, drift: -0.3, decimals: 0, min: 1, max: 5 },
  exercise: { base: 125, noise: 12, drift: -20, decimals: 0, min: 0 },
}

const with_ = (over: Partial<Record<keyof Profiles, Partial<Profile>>>): Profiles =>
  Object.fromEntries(Object.entries(BASE).map(([k, p]) => [k, { ...p, ...over[k as keyof Profiles] }])) as Profiles

const SCENARIOS: Record<CrewId, Scenario> = {
  cm1: {
    seed: 11,
    today: { hr: 63, bp: [114, 74], spo2: 98, temp: 36.7, glu: 86, sleep: 7.1, mood: 5, exercise: 134 },
    tail: { sleep: [7.9, 7.7, 7.5, 7.3] },
    profiles: with_({
      hr: { base: 62, drift: 1 },
      temp: { base: 36.7, drift: 0 },
      sleep: { base: 7.4, drift: 0 },
      mood: { base: 4.6, drift: 0 },
      exercise: { base: 132, drift: 2 },
      spo2: { drift: 0 },
      glu: { base: 86, drift: 0 },
    }),
    bp: { sys: 113, dia: 73, drift: 1 },
  },
  cm2: {
    seed: 47,
    today: { hr: 108, bp: [118, 76], spo2: 97, temp: 37.9, glu: 92, sleep: 5.6, mood: 4, exercise: 95 },
    profiles: BASE,
    bp: { sys: 112, dia: 72, drift: 4 },
  },
  cm3: {
    seed: 83,
    today: { hr: 96, bp: [128, 82], spo2: 90, temp: 36.9, glu: 94, sleep: 4.6, mood: 3, exercise: 108 },
    profiles: with_({
      hr: { base: 70, drift: 22 },
      spo2: { base: 98, drift: -6.5, noise: 0.6 },
      temp: { base: 36.8, drift: 0.1 },
      sleep: { base: 7, drift: -2.3 },
      mood: { base: 4.5, drift: -1.3 },
      exercise: { base: 128, drift: -16 },
      glu: { base: 88, drift: 5 },
    }),
    bp: { sys: 116, dia: 74, drift: 11 },
  },
}

/* Deterministic pseudo-random generator so every visitor sees the same demo */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d
const clamp = (v: number, min = -Infinity, max = Infinity) => Math.min(max, Math.max(min, v))

const MANUAL: IndicatorId[] = ['temp', 'glu', 'sleep', 'mood']

function todayReadings(t: Today): Reading[] {
  return (['hr', 'bp', 'spo2', 'temp', 'glu', 'sleep', 'mood', 'exercise'] as IndicatorId[]).map((id) => ({
    indicatorId: id,
    value: (id === 'bp' ? { systolic: t.bp[0], diastolic: t.bp[1] } : t[id as Exclude<IndicatorId, 'bp'>]) as ReadingValue,
    takenAt: DEMO_TODAY,
    source: MANUAL.includes(id) ? 'manual' : 'device',
  }))
}

function buildHistory(s: Scenario): Reading[] {
  const rand = mulberry32(s.seed)
  const today = Date.parse(DEMO_TODAY)
  const out: Reading[] = []
  for (let back = 29; back >= 1; back--) {
    const t = 1 - back / 29
    const takenAt = new Date(today - back * DAY_MS + Math.round((rand() - 0.5) * 40) * 60_000).toISOString()
    for (const [id, p] of Object.entries(s.profiles) as [Exclude<IndicatorId, 'bp'>, Profile][]) {
      if (id === 'glu' && back % 7 !== 0) continue // glucose is weekly
      const tail = s.tail?.[id]
      const scripted = tail && back <= tail.length ? tail[tail.length - back] : undefined
      const v = scripted ?? clamp(round(p.base + p.drift * t + (rand() - 0.5) * 2 * p.noise, p.decimals), p.min, p.max)
      out.push({ indicatorId: id, value: v as ReadingValue, takenAt, source: 'device' })
    }
    const sys = Math.round(s.bp.sys + s.bp.drift * t + (rand() - 0.5) * 10)
    const dia = Math.round(s.bp.dia + (s.bp.drift / 2) * t + (rand() - 0.5) * 8)
    out.push({ indicatorId: 'bp', value: { systolic: sys, diastolic: dia }, takenAt, source: 'device' })
  }
  return [...out, ...todayReadings(s.today)]
}

export const DEMO_HISTORY_BY_CREW: Record<CrewId, Reading[]> = Object.fromEntries(
  CREW_ORDER.map((id) => [id, buildHistory(SCENARIOS[id])]),
) as Record<CrewId, Reading[]>

export const DEMO_HISTORY: Reading[] = DEMO_HISTORY_BY_CREW[DEFAULT_CREW]
export const DEMO_READINGS: Reading[] = todayReadings(SCENARIOS[DEFAULT_CREW].today)

/** Mission day for a timestamp, anchored on today's demo check = MISSION_DAY_TODAY */
export function missionDayOf(iso: string, nowIso: string = DEMO_TODAY): number {
  const anchorDay = Math.floor(Date.parse(nowIso) / DAY_MS)
  const day = Math.floor(Date.parse(iso) / DAY_MS)
  return MISSION_DAY_TODAY - (anchorDay - day)
}
