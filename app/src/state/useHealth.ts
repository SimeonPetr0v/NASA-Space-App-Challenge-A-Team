import { useMemo } from 'react'
import { assess, latestReadings, summarize } from '@/engine/assess'
import { assessWellbeing, scoreWellbeing } from '@/engine/wellbeing'
import { useStore } from './store'

/*
  Latest reading per indicator, its assessment and the overall summary.
  A WHO-5 check-in newer than the last legacy mood reading replaces the mood
  assessment (src/engine/wellbeing.ts).
*/
export function useHealth() {
  const { history, wellbeing } = useStore()
  return useMemo(() => {
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
  }, [history, wellbeing])
}
