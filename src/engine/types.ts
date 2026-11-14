/*
  Shared data contract between UI and engine (see team-git-workflow skill).
  Agree changes in team chat before editing — every role builds against this file.
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

export type BodyRegion = 'brain' | 'eyes' | 'heart' | 'lungs' | 'musculoskeletal' | 'immune' | 'whole-body'
