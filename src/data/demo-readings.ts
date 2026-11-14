import type { IndicatorId, Reading, ReadingValue } from '@/engine/types'
import { MISSION_DAY_TODAY } from './missions'

/*
  SYNTHETIC demo data - not real astronaut data. Label it as demo data in the UI.
  Scenario: mission day 47. Thirty days of history ending with today's morning check.
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

export const DEMO_READINGS: Reading[] = [
  { indicatorId: 'hr', value: 108, takenAt: DEMO_TODAY, source: 'device' },
  { indicatorId: 'bp', value: { systolic: 118, diastolic: 76 }, takenAt: DEMO_TODAY, source: 'device' },
  { indicatorId: 'spo2', value: 97, takenAt: DEMO_TODAY, source: 'device' },
  { indicatorId: 'temp', value: 37.9, takenAt: DEMO_TODAY, source: 'manual' },
  { indicatorId: 'glu', value: 92, takenAt: DEMO_TODAY, source: 'manual' },
  { indicatorId: 'sleep', value: 5.6, takenAt: DEMO_TODAY, source: 'manual' },
  { indicatorId: 'mood', value: 4, takenAt: DEMO_TODAY, source: 'manual' },
  { indicatorId: 'exercise', value: 95, takenAt: DEMO_TODAY, source: 'device' },
]

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

type Profile = { base: number; noise: number; drift: number; decimals: number; min?: number; max?: number }

/* base = value at day -29, drift = change across the 30 days (shows a slow trend) */
const PROFILES: Record<Exclude<IndicatorId, 'bp'>, Profile> = {
  hr: { base: 66, noise: 4, drift: 18, decimals: 0 },
  spo2: { base: 98, noise: 0.8, drift: -0.5, decimals: 0, max: 100 },
  temp: { base: 36.8, noise: 0.18, drift: 0.6, decimals: 1 },
  glu: { base: 88, noise: 5, drift: 3, decimals: 0 },
  sleep: { base: 7.2, noise: 0.5, drift: -1.2, decimals: 1 },
  mood: { base: 4.4, noise: 0.5, drift: -0.3, decimals: 0, min: 1, max: 5 },
  exercise: { base: 125, noise: 12, drift: -20, decimals: 0, min: 0 },
}

const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d
const clamp = (v: number, min = -Infinity, max = Infinity) => Math.min(max, Math.max(min, v))

function buildHistory(): Reading[] {
  const rand = mulberry32(47)
  const today = Date.parse(DEMO_TODAY)
  const out: Reading[] = []
  for (let back = 29; back >= 1; back--) {
    const t = 1 - back / 29
    const takenAt = new Date(today - back * DAY_MS + Math.round((rand() - 0.5) * 40) * 60_000).toISOString()
    for (const [id, p] of Object.entries(PROFILES) as [Exclude<IndicatorId, 'bp'>, Profile][]) {
      if (id === 'glu' && back % 7 !== 0) continue // glucose is weekly
      const v = clamp(round(p.base + p.drift * t + (rand() - 0.5) * 2 * p.noise, p.decimals), p.min, p.max)
      out.push({ indicatorId: id, value: v as ReadingValue, takenAt, source: 'device' })
    }
    const sys = Math.round(112 + 4 * t + (rand() - 0.5) * 10)
    const dia = Math.round(72 + 2 * t + (rand() - 0.5) * 8)
    out.push({ indicatorId: 'bp', value: { systolic: sys, diastolic: dia }, takenAt, source: 'device' })
  }
  return [...out, ...DEMO_READINGS]
}

export const DEMO_HISTORY: Reading[] = buildHistory()

/** Mission day for a timestamp, anchored on today's demo check = MISSION_DAY_TODAY */
export function missionDayOf(iso: string, nowIso: string = DEMO_TODAY): number {
  const anchorDay = Math.floor(Date.parse(nowIso) / DAY_MS)
  const day = Math.floor(Date.parse(iso) / DAY_MS)
  return MISSION_DAY_TODAY - (anchorDay - day)
}
