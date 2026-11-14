import { INDICATORS } from '@/data/indicators'
import type { Assessment, Reading, Status } from '@/engine/types'

/*
  Starting point for the Logic team: absolute-range check only.
  To add: staleness, personal baseline, combination rules, mission-mode
  adjustments and guidance text (astro-health-science skill).
*/

const SEVERITY: Record<Status, number> = { normal: 0, 'no-data': 1, stale: 1, caution: 2, danger: 3 }

export function assess(reading: Reading): Assessment {
  const def = INDICATORS[reading.indicatorId]
  const status = def.classify(reading.value)
  return {
    indicatorId: reading.indicatorId,
    status,
    reason: `${def.label} is ${status}`,
    sourceUrl: def.sourceUrl,
  }
}

export function worstStatus(assessments: Assessment[]): Status {
  return assessments.reduce<Status>(
    (worst, a) => (SEVERITY[a.status] > SEVERITY[worst] ? a.status : worst),
    'normal',
  )
}
