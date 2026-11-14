import type { IndicatorId, MissionMode } from '@/engine/types'

/* SYNTHETIC demo mission — label as demo data in the UI. */

export type Mission = {
  day: number
  mode: MissionMode
  modeLabel: string
  oneWayDelayMinutes: number
  nextCheck: string
  streakDays: number
}

export const DEMO_MISSION: Mission = {
  day: 47,
  mode: 'mars-transit',
  modeLabel: 'Mars transit',
  oneWayDelayMinutes: 14,
  nextCheck: '07:30',
  streakDays: 12,
}

/* The astronaut's own usual values (pre-flight / first-week median). */
export const DEMO_BASELINE: Partial<Record<IndicatorId, number>> = {
  hr: 72,
  bp: 116,
  spo2: 98,
  temp: 37.1,
  glu: 90,
  sleep: 7.4,
  mood: 4,
  exercise: 120,
}
