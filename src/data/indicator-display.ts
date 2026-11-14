import type { IndicatorId, ReadingValue, Status } from '@/engine/types'

/*
  Display-only data for the instruments panel: range-gauge zones and the
  status guidance. Thresholds here mirror the classify() rules in indicators.ts
  (the science owner's file) — change both together. Guidance is not medical
  advice; mission medical procedures take precedence.
*/

export type GaugeZone = { from: number; to: number; status: Exclude<Status, 'no-data' | 'stale'> }

export type Gauge = {
  zones: GaugeZone[]
  value: (v: ReadingValue) => number
  label?: string
}

export type Guidance = { doNow: string[]; recheckIn: string; escalateIf: string }

const num = (v: ReadingValue) => (typeof v === 'number' ? v : v.systolic)

export const GAUGES: Record<IndicatorId, Gauge> = {
  hr: {
    value: num,
    zones: [
      { from: 30, to: 40, status: 'danger' },
      { from: 40, to: 60, status: 'caution' },
      { from: 60, to: 100, status: 'normal' },
      { from: 100, to: 130, status: 'caution' },
      { from: 130, to: 160, status: 'danger' },
    ],
  },
  bp: {
    value: num,
    label: 'Systolic',
    zones: [
      { from: 70, to: 90, status: 'caution' },
      { from: 90, to: 120, status: 'normal' },
      { from: 120, to: 140, status: 'caution' },
      { from: 140, to: 200, status: 'danger' },
    ],
  },
  spo2: {
    value: num,
    zones: [
      { from: 80, to: 90.5, status: 'danger' },
      { from: 90.5, to: 95, status: 'caution' },
      { from: 95, to: 100, status: 'normal' },
    ],
  },
  temp: {
    value: num,
    zones: [
      { from: 34.5, to: 35.5, status: 'danger' },
      { from: 35.5, to: 36.1, status: 'caution' },
      { from: 36.1, to: 37.5, status: 'normal' },
      { from: 37.5, to: 38.5, status: 'caution' },
      { from: 38.5, to: 40, status: 'danger' },
    ],
  },
  glu: {
    value: num,
    zones: [
      { from: 40, to: 54, status: 'danger' },
      { from: 54, to: 70, status: 'caution' },
      { from: 70, to: 100, status: 'normal' },
      { from: 100, to: 250, status: 'caution' },
      { from: 250, to: 280, status: 'danger' },
    ],
  },
  sleep: {
    value: num,
    zones: [
      { from: 3, to: 5, status: 'danger' },
      { from: 5, to: 7, status: 'caution' },
      { from: 7, to: 10, status: 'normal' },
    ],
  },
  mood: {
    value: num,
    zones: [
      { from: 1, to: 3.5, status: 'caution' },
      { from: 3.5, to: 5, status: 'normal' },
    ],
  },
  exercise: {
    value: num,
    zones: [
      { from: 0, to: 120, status: 'caution' },
      { from: 120, to: 150, status: 'normal' },
      { from: 150, to: 240, status: 'caution' },
    ],
  },
}

export function guidanceFor(status: 'caution' | 'danger'): Guidance {
  if (status === 'danger') {
    return {
      doNow: [
        'This prototype flag is not a diagnosis. Follow mission-approved medical procedures, especially if symptoms are present.',
      ],
      recheckIn: 'As directed by mission medical procedures',
      escalateIf: 'Follow the mission escalation procedure; do not rely on this app label.',
    }
  }

  return {
    doNow: [
      'This prototype flag is not a diagnosis. Verify the recorded value and follow mission procedures for high or low readings.',
    ],
    recheckIn: 'As directed by mission medical procedures',
    escalateIf:
      'Contact the crew medical officer for symptoms, a repeated out-of-band reading, or when mission procedures direct escalation.',
  }
}
