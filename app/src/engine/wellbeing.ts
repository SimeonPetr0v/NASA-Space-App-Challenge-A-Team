import { WHO5_FOLLOWUP, WHO5_FOLLOWUP_RAW_CUTOFF, WHO5_SOURCE } from '../data/wellbeing'
import type { Assessment } from './types'

export type WellbeingCheck = {
  instrument: 'WHO-5'
  answers: number[]
  takenAt: string
}

export function wellbeingError(answers: unknown): string | null {
  return !Array.isArray(answers) ||
    answers.length !== 5 ||
    !answers.every((value) => Number.isInteger(value) && value >= 0 && value <= 5)
    ? 'Answer all five statements using a frequency from the list.'
    : null
}

export function scoreWellbeing(answers: number[]) {
  const error = wellbeingError(answers)
  if (error) throw new Error(error)
  const raw = answers.reduce((total, value) => total + value, 0)
  return { raw, percent: raw * 4, needsFollowup: raw < WHO5_FOLLOWUP_RAW_CUTOFF }
}

export function assessWellbeing(check: WellbeingCheck): Assessment {
  const score = scoreWellbeing(check.answers)
  return {
    indicatorId: 'mood',
    status: score.needsFollowup ? 'caution' : 'normal',
    reason: `WHO-5 well-being score ${score.percent}/100 over the last two weeks; ${score.needsFollowup ? 'further assessment suggested' : 'screening cutoff not met; this does not rule out distress'}.`,
    sourceUrl: WHO5_SOURCE,
    guidance: score.needsFollowup
      ? {
          doNow: [WHO5_FOLLOWUP],
          recheckIn: 'Use the same two-week recall period for the next check-in.',
          escalateIf:
            'Seek crew medical support now if you feel unsafe or cannot carry out essential tasks safely, regardless of this score.',
        }
      : undefined,
  }
}
