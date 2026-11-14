import type { Reading } from '@/engine/types'

/*
  SYNTHETIC demo data — not real astronaut data. Label it as demo data in the UI.
  Scenario: mission day 47, Mars transit.
*/

const at = '2026-11-14T07:30:00Z'

export const DEMO_READINGS: Reading[] = [
  { indicatorId: 'hr', value: 108, takenAt: at, source: 'device' },
  { indicatorId: 'bp', value: { systolic: 118, diastolic: 76 }, takenAt: at, source: 'device' },
  { indicatorId: 'spo2', value: 97, takenAt: at, source: 'device' },
  { indicatorId: 'temp', value: 37.9, takenAt: at, source: 'manual' },
  { indicatorId: 'glu', value: 92, takenAt: at, source: 'manual' },
  { indicatorId: 'sleep', value: 5.6, takenAt: at, source: 'manual' },
  { indicatorId: 'mood', value: 4, takenAt: at, source: 'manual' },
  { indicatorId: 'exercise', value: 95, takenAt: at, source: 'device' },
]
