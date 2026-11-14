import type { Reading } from '@/engine/types'

/*
  Daily measurement schedule in mission time (UTC). Demo values; a real
  mission would take these from the crew timeline.
*/
export const CHECKS = [
  { id: 'morning', label: 'Morning check', at: { h: 7, m: 30 }, what: 'heart rate, blood pressure, SpO₂, temperature, sleep' },
  { id: 'evening', label: 'Evening log', at: { h: 20, m: 30 }, what: 'exercise minutes and mood' },
] as const

const DAY = 86_400_000
const MIN = 60_000

export type Due = { label: string; what: string; inMin: number; state: 'soon' | 'later' | 'overdue' }

/** The next scheduled check from `now`; "overdue" when its time passed today and nothing was logged since */
export function nextCheck(now: number, history: Reading[]): Due {
  const dayStart = Math.floor(now / DAY) * DAY
  const lastLogged = history.reduce((t, r) => Math.max(t, Date.parse(r.takenAt)), 0)
  for (const c of CHECKS) {
    const t = dayStart + (c.at.h * 60 + c.at.m) * MIN
    if (t <= now && lastLogged < t && now - t < 3 * 60 * MIN) return { label: c.label, what: c.what, inMin: Math.round((now - t) / MIN), state: 'overdue' }
    if (t > now) {
      const inMin = Math.round((t - now) / MIN)
      return { label: c.label, what: c.what, inMin, state: inMin <= 60 ? 'soon' : 'later' }
    }
  }
  const c = CHECKS[0]
  const inMin = Math.round((dayStart + DAY + (c.at.h * 60 + c.at.m) * MIN - now) / MIN)
  return { label: c.label, what: c.what, inMin, state: inMin <= 60 ? 'soon' : 'later' }
}

/** Consecutive days, ending today or yesterday, with at least one logged reading */
export function streakDays(now: number, history: Reading[]): number {
  const days = new Set(history.map((r) => Math.floor(Date.parse(r.takenAt) / DAY)))
  let d = Math.floor(now / DAY)
  if (!days.has(d)) d -= 1
  let n = 0
  while (days.has(d)) {
    n++
    d--
  }
  return n
}

export const inWords = (min: number) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60 ? `${min % 60} min` : ''}`.trim())
