import { DEMO_TODAY } from '@/data/demo-readings'
import { MISSION_DAY_TODAY } from '@/data/missions'
import type { MissionMode } from '@/engine/types'

/* Mission elapsed time: day 1 started at 00:00 UTC, MISSION_DAY_TODAY - 1 days before the demo morning check */
export const LAUNCH = (() => {
  const d = new Date(DEMO_TODAY)
  d.setUTCHours(0, 0, 0, 0)
  return d.getTime() - (MISSION_DAY_TODAY - 1) * 86_400_000
})()

/** Mission elapsed time split into days, hours, minutes, seconds */
export function met(now: number) {
  const t = Math.max(0, now - LAUNCH)
  return { d: Math.floor(t / 86_400_000), h: (t % 86_400_000) / 3_600_000, m: (t % 3_600_000) / 60_000, s: (t % 60_000) / 1000 }
}

/** Planned mission length in days, as on the mission track */
export const LENGTH_DAYS: Record<MissionMode, number> = { iss: 180, lunar: 30, 'mars-transit': 210, 'mars-surface': 500 }
