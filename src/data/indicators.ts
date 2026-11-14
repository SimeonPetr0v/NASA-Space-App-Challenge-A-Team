import type { BloodPressure, BodyRegion, Hazard, IndicatorId, ReadingValue, Status } from '@/engine/types'

/*
  Single source of truth for thresholds and guidance (astro-health-science skill).
  Values are self-assessment defaults, NOT medical criteria — the science owner
  must verify every row and its sourceUrl before the demo.
*/

export type IndicatorDefinition = {
  id: IndicatorId
  label: string
  unit: string
  region: BodyRegion
  hazards: Hazard[]
  howToMeasure: string
  whyInSpace: string
  schedule: string
  sourceUrl: string
  classify: (value: ReadingValue) => Status
}

const num = (v: ReadingValue): number => (typeof v === 'number' ? v : Number.NaN)

const inRange = (v: number, min: number, max: number) => v >= min && v <= max

export const INDICATORS: Record<IndicatorId, IndicatorDefinition> = {
  hr: {
    id: 'hr',
    label: 'Resting heart rate',
    unit: 'bpm',
    region: 'heart',
    hazards: ['G', 'I', 'R'],
    howToMeasure: 'Pulse oximeter or watch, seated and at rest for 5 minutes.',
    whyInSpace: 'Weightlessness deconditions the heart; stress and fatigue raise resting rate.',
    schedule: 'Every morning and after exercise',
    sourceUrl: 'https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates',
    classify: (value) => {
      const v = num(value)
      if (v < 40 || v > 130) return 'danger'
      if (inRange(v, 60, 100)) return 'normal'
      return 'caution'
    },
  },
  bp: {
    id: 'bp',
    label: 'Blood pressure',
    unit: 'mmHg',
    region: 'heart',
    hazards: ['G'],
    howToMeasure: 'Cuff on the upper arm, seated, arm at heart level.',
    whyInSpace: 'Fluids shift toward the head in microgravity and the cardiovascular system adapts.',
    schedule: 'Every morning',
    sourceUrl: 'https://www.heart.org/bplevels',
    classify: (value) => {
      if (typeof value === 'number') return 'no-data'
      const { systolic: s, diastolic: d } = value as BloodPressure
      if (s > 180 || d > 120 || s >= 140 || d >= 90) return 'danger'
      if (s < 90 || d < 60 || s >= 120 || d >= 80) return 'caution'
      return 'normal'
    },
  },
  spo2: {
    id: 'spo2',
    label: 'Oxygen saturation',
    unit: '%',
    region: 'lungs',
    hazards: ['E'],
    howToMeasure: 'Pulse oximeter on a warm finger, hold still for 30 seconds.',
    whyInSpace: 'Cabin air problems or hypoxia during spacewalk preparation lower blood oxygen.',
    schedule: 'Every morning and on symptoms',
    sourceUrl: 'https://www.fda.gov/consumers/consumer-updates/pulse-oximeter-basics',
    classify: (value) => {
      const v = num(value)
      if (v <= 90) return 'danger'
      if (v < 95) return 'caution'
      return 'normal'
    },
  },
  temp: {
    id: 'temp',
    label: 'Body temperature',
    unit: '°C',
    region: 'immune',
    hazards: ['E'],
    howToMeasure: 'Thermometer under the tongue, mouth closed, no drinking for 15 minutes before.',
    whyInSpace: 'The immune system weakens in flight; core temperature also runs about 1 °C higher.',
    schedule: 'Every morning',
    sourceUrl: 'https://medlineplus.gov/ency/article/001982.htm',
    classify: (value) => {
      const v = num(value)
      if (v >= 38.5 || v < 35.5) return 'danger'
      if (inRange(v, 36.1, 37.5)) return 'normal'
      return 'caution'
    },
  },
  glu: {
    id: 'glu',
    label: 'Blood glucose (fasting)',
    unit: 'mg/dL',
    region: 'whole-body',
    hazards: ['E'],
    howToMeasure: 'Glucometer finger-prick before breakfast.',
    whyInSpace: 'Limited food variety, stress and inactivity change metabolism.',
    schedule: 'Weekly or on symptoms',
    sourceUrl: 'https://diabetes.org/about-diabetes/diagnosis',
    classify: (value) => {
      const v = num(value)
      if (v < 54 || v > 250) return 'danger'
      if (inRange(v, 70, 99)) return 'normal'
      return 'caution'
    },
  },
  sleep: {
    id: 'sleep',
    label: 'Sleep',
    unit: 'h',
    region: 'brain',
    hazards: ['I'],
    howToMeasure: 'Log when you fell asleep and woke up, or read it from your watch.',
    whyInSpace: 'Around 16 sunrises a day and shift work disrupt the body clock; crews average about 6 h.',
    schedule: 'Every morning',
    sourceUrl: 'https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/',
    classify: (value) => {
      const v = num(value)
      if (v < 5) return 'danger'
      if (v < 7) return 'caution'
      return 'normal'
    },
  },
  mood: {
    id: 'mood',
    label: 'Mood',
    unit: '1–5',
    region: 'brain',
    hazards: ['I', 'D'],
    howToMeasure: 'Rate how you feel right now from 1 (very low) to 5 (very good).',
    whyInSpace: 'Months of isolation and distance from family raise the risk of stress and depression.',
    schedule: 'Every day',
    sourceUrl: 'https://www.nasa.gov/hrp/risks/',
    classify: (value) => {
      const v = num(value)
      if (v <= 2) return 'danger'
      if (v === 3) return 'caution'
      return 'normal'
    },
  },
  exercise: {
    id: 'exercise',
    label: 'Exercise',
    unit: 'min',
    region: 'musculoskeletal',
    hazards: ['G'],
    howToMeasure: 'Minutes logged on the treadmill, cycle and resistive device today.',
    whyInSpace: 'Without gravity bones lose about 1–1.5 % density a month; ISS crews train about 2 h a day.',
    schedule: 'Every day',
    sourceUrl: 'https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/',
    classify: (value) => {
      const v = num(value)
      if (v < 60) return 'danger'
      if (v < 120) return 'caution'
      return 'normal'
    },
  },
}
