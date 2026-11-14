/*
  Shared data contract between UI and engine (see team-git-workflow skill).
  Agree changes in team chat before editing - every role builds against this file.
*/

export type IndicatorId =
  | 'hr'
  | 'bp'
  | 'spo2'
  | 'temp'
  | 'glu'
  | 'sleep'
  | 'mood'
  | 'exercise'

export type Status = 'normal' | 'caution' | 'danger' | 'no-data' | 'stale'

export type Hazard = 'R' | 'I' | 'D' | 'G' | 'E'

export type MissionMode = 'iss' | 'lunar' | 'mars-transit' | 'mars-surface'

export type BloodPressure = { systolic: number; diastolic: number }

export type ReadingValue = number | BloodPressure

export type Reading = {
  indicatorId: IndicatorId
  value: ReadingValue
  takenAt: string
  source: 'manual' | 'device' | 'camera'
}

export type Guidance = {
  doNow: string[]
  recheckIn: string
  escalateIf: string
}

export type Assessment = {
  indicatorId: IndicatorId
  status: Status
  reason: string
  baselineDelta?: number
  guidance?: Guidance
  sourceUrl: string
}

/** Who should be involved, from least to most. */
export type Escalation = 'none' | 'self-care' | 'crew-medical-officer' | 'flight-surgeon'

/** A rule that fires on a combination of indicators (astro-health-science reference). */
export type CombinationFinding = {
  id: string
  title: string
  detail: string
  indicators: IndicatorId[]
  escalation: Escalation
}

export type BodyRegion = 'brain' | 'eyes' | 'heart' | 'lungs' | 'musculoskeletal' | 'immune' | 'whole-body'

/** Message on the simulated crew <-> Earth link (docs/flight-surgeon-view.md). */
export type LinkMessage = {
  id: string
  direction: 'to-earth' | 'to-crew'
  kind: 'report' | 'reply'
  createdAt: string
  arrivesAt: string
  payload: {
    assessments?: Assessment[]
    readings?: Reading[]
    note?: string
    replyTemplate?: string
    inReplyTo?: string
    /** Sender (report) or addressee (reply); missing on messages saved before crew support = CM-2 */
    crewId?: 'cm1' | 'cm2' | 'cm3'
  }
}
