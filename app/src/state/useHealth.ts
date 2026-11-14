import { useMemo } from 'react'
import { CREW_ORDER, type CrewId } from '@/data/crew'
import { DEMO_HISTORY_BY_CREW } from '@/data/demo-readings'
import { assess, latestReadings, summarize } from '@/engine/assess'
import type { Reading } from '@/engine/types'
import { assessWellbeing, scoreWellbeing, type WellbeingCheck } from '@/engine/wellbeing'
import { loadSaved, useStore } from './store'

/*
  Latest reading per indicator, its assessment and the overall summary.
  A WHO-5 check-in newer than the last legacy mood reading replaces the mood
  assessment (src/engine/wellbeing.ts).
*/
export function healthOf(history: Reading[], wellbeing: WellbeingCheck[]) {
  const readings = latestReadings(history)
  let assessments = readings.map((r) => assess(r, history))
  const check = wellbeing.at(-1)
  const moodReading = readings.find((r) => r.indicatorId === 'mood')
  let who5: { percent: number; takenAt: string } | undefined
  if (check && (!moodReading || Date.parse(check.takenAt) >= Date.parse(moodReading.takenAt))) {
    who5 = { percent: scoreWellbeing(check.answers).percent, takenAt: check.takenAt }
    const a = assessWellbeing(check)
    assessments = moodReading ? assessments.map((x) => (x.indicatorId === 'mood' ? a : x)) : [...assessments, a]
  }
  return { readings, assessments, summary: summarize(assessments), who5 }
}

export function useHealth() {
  const { history, wellbeing } = useStore()
  return useMemo(() => healthOf(history, wellbeing), [history, wellbeing])
}

/** Health summary for every crew member, for the crew switcher and the flight surgeon roster */
export function useCrewHealth(): Record<CrewId, ReturnType<typeof healthOf>> {
  const { crewId, history, wellbeing } = useStore()
  return useMemo(
    () =>
      Object.fromEntries(
        CREW_ORDER.map((id) => {
          if (id === crewId) return [id, healthOf(history, wellbeing)]
          const saved = loadSaved(id)
          return [id, healthOf([...DEMO_HISTORY_BY_CREW[id], ...saved.readings], saved.checks)]
        }),
      ) as Record<CrewId, ReturnType<typeof healthOf>>,
    [crewId, history, wellbeing],
  )
}
