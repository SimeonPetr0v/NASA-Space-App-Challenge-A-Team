import type { BloodPressure, BodyRegion, Guidance, Hazard, IndicatorId, ReadingValue, Status } from '@/engine/types'

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
  /** Human-readable source name shown next to the link */
  sourceLabel: string
  /** Range text shown in the methodology table */
  ranges: { normal: string; caution: string; danger: string }
  /** Normal band for charts (for blood pressure: systolic) */
  band: { low: number; high: number }
  /** Chart y-axis domain */
  domain: [number, number]
  /** Data-entry spec: plausible input limits, stepper increment, decimals */
  input: { min: number; max: number; step: number; decimals: number }
  /** Guidance for each non-normal state (astro-health-science pattern) */
  guidance: { caution: Guidance; danger: Guidance }
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
    sourceUrl: 'https://www.nasa.gov/hrp/risks/',
    sourceLabel: 'AHA; NASA HRP cardiovascular risk',
    ranges: { normal: '60–100', caution: '41–59 or 101–130', danger: '< 40 or > 130 at rest' },
    band: { low: 60, high: 100 },
    domain: [40, 140],
    input: { min: 25, max: 220, step: 1, decimals: 0 },
    guidance: {
      caution: {
        doNow: ['Sit quietly for 5 minutes and breathe slowly.', 'Drink about 250 ml of water.'],
        recheckIn: '15 min',
        escalateIf: 'Still outside 60–100 bpm after the re-check, or with chest pain, dizziness or fever.',
      },
      danger: {
        doNow: ['Stop activity and sit or lie down.', 'Tell the crew medical officer now.'],
        recheckIn: '5 min',
        escalateIf: 'Notify the flight surgeon immediately and follow the onboard medical checklist.',
      },
    },
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
    sourceUrl: 'https://www.nasa.gov/hrp/risks/',
    sourceLabel: 'AHA/ACC 2017 categories; NASA HRP cardiovascular risk',
    ranges: { normal: '< 120 / < 80', caution: '120–139 or 80–89; or < 90/60', danger: '≥ 140 or ≥ 90; > 180/120 urgent' },
    band: { low: 90, high: 119 },
    domain: [80, 170],
    input: { min: 60, max: 250, step: 1, decimals: 0 },
    guidance: {
      caution: {
        doNow: ['Sit with your back supported for 5 minutes, then re-measure.', 'Limit caffeine and salty food today.'],
        recheckIn: '30 min',
        escalateIf: 'Two readings in a row at or above 140/90, or below 90/60 with dizziness.',
      },
      danger: {
        doNow: ['Rest seated and re-measure on the other arm.', 'Inform the crew medical officer.'],
        recheckIn: '10 min',
        escalateIf: 'Above 180/120, or with headache, vision change or chest pain: notify the flight surgeon now.',
      },
    },
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
    sourceUrl: 'https://www.nasa.gov/hrp/risks/',
    sourceLabel: 'Clinical pulse-oximetry norms; NASA HRP hypoxia risk',
    ranges: { normal: '≥ 95', caution: '91–94', danger: '≤ 90' },
    band: { low: 95, high: 100 },
    domain: [86, 100],
    input: { min: 70, max: 100, step: 1, decimals: 0 },
    guidance: {
      caution: {
        doNow: ['Warm your hand and re-measure while holding still.', 'Check the cabin CO₂ and O₂ display.'],
        recheckIn: '10 min',
        escalateIf: 'Still below 95 %, or with headache or breathlessness.',
      },
      danger: {
        doNow: ['Stop exertion and breathe slowly.', 'Check cabin atmosphere and use an oxygen mask per procedure.'],
        recheckIn: '5 min',
        escalateIf: 'Notify the crew medical officer and the flight surgeon now.',
      },
    },
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
    sourceUrl: 'https://www.nasa.gov/hrp/risks/',
    sourceLabel: 'Clinical norms; Stahn et al., Sci Rep 2017 (core temperature in flight)',
    ranges: { normal: '36.1–37.5', caution: '35.5–36.0 or 37.6–38.4', danger: '≥ 38.5 or < 35.5' },
    band: { low: 36.1, high: 37.5 },
    domain: [35.5, 39],
    input: { min: 33, max: 42, step: 0.1, decimals: 1 },
    guidance: {
      caution: {
        doNow: ['Rest and drink fluids.', 'Note any symptoms such as chills, sore throat or cough.'],
        recheckIn: '4 h',
        escalateIf: 'Rises to 38.5 °C or above, or comes with a raised heart rate.',
      },
      danger: {
        doNow: ['Rest, drink fluids and limit close contact with crewmates.', 'Tell the crew medical officer.'],
        recheckIn: '1 h',
        escalateIf: 'Notify the flight surgeon and follow the onboard medical checklist.',
      },
    },
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
    sourceUrl: 'https://www.nasa.gov/hrp/risks/',
    sourceLabel: 'ADA Standards of Care',
    ranges: { normal: '70–99 fasting', caution: '54–69 or 100–250', danger: '< 54 or > 250' },
    band: { low: 70, high: 99 },
    domain: [50, 160],
    input: { min: 20, max: 500, step: 1, decimals: 0 },
    guidance: {
      caution: {
        doNow: ['Re-test before the next meal.', 'If below 70 mg/dL, take 15 g of fast carbohydrate.'],
        recheckIn: '2 h',
        escalateIf: 'Repeated fasting readings at or above 126 mg/dL, or below 70 mg/dL.',
      },
      danger: {
        doNow: ['If below 54 mg/dL, take 15 g of fast carbohydrate now.', 'Tell the crew medical officer.'],
        recheckIn: '15 min',
        escalateIf: 'No improvement after the re-test: notify the flight surgeon.',
      },
    },
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
    sourceUrl: 'https://www.nasa.gov/hrp/risks/',
    sourceLabel: 'NASA HRP sleep risk; Barger et al., Lancet Neurol 2014',
    ranges: { normal: '≥ 7', caution: '5–6.9', danger: '< 5' },
    band: { low: 7, high: 9 },
    domain: [3, 10],
    input: { min: 0, max: 16, step: 0.1, decimals: 1 },
    guidance: {
      caution: {
        doNow: ['Plan a 20-minute nap if the timeline allows.', 'Dim lights and screens an hour before the next sleep period.'],
        recheckIn: 'Next morning',
        escalateIf: 'Two nights in a row under 7 h.',
      },
      danger: {
        doNow: ['Avoid safety-critical tasks until rested, where possible.', 'Ask the commander to adjust today’s timeline.'],
        recheckIn: 'Next morning',
        escalateIf: 'Three or more nights under 6 h: discuss with the flight surgeon.',
      },
    },
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
    unit: 'of 5',
    region: 'brain',
    hazards: ['I', 'D'],
    howToMeasure: 'Rate how you feel right now from 1 (very low) to 5 (very good).',
    whyInSpace: 'Months of isolation and distance from family raise the risk of stress and depression.',
    schedule: 'Every day',
    sourceUrl: 'https://www.nasa.gov/hrp/risks/',
    sourceLabel: 'NASA HRP behavioral health risk',
    ranges: { normal: '4–5', caution: '1–3 (legacy); WHO-5 below 13 raw', danger: 'not used (screening only)' },
    band: { low: 4, high: 5 },
    domain: [1, 5],
    input: { min: 1, max: 5, step: 1, decimals: 0 },
    guidance: {
      caution: {
        doNow: ['Take a short break and talk with a crewmate.', 'Schedule a call or message home.'],
        recheckIn: 'Tomorrow',
        escalateIf: 'Three days in a row at 3 or lower.',
      },
      danger: {
        doNow: ['Tell a crewmate or the commander how you feel.', 'Request a private conference with the flight psychologist.'],
        recheckIn: 'Today',
        escalateIf: 'Any thoughts of harming yourself: tell the crew medical officer now.',
      },
    },
    classify: (value) => {
      const v = num(value)
      return v <= 3 ? 'caution' : 'normal'
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
    sourceUrl: 'https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/',
    sourceLabel: 'NASA: Astronaut exercise (ISS allocation ~150 min/day)',
    ranges: { normal: '120–150', caution: '< 120 or > 150', danger: 'not used (logging only)' },
    band: { low: 120, high: 150 },
    domain: [0, 160],
    input: { min: 0, max: 300, step: 5, decimals: 0 },
    guidance: {
      caution: {
        doNow: ['Below 120 min: add a treadmill or resistive session today.', 'Above 150 min: check your mission exercise plan, rest and hydrate.'],
        recheckIn: 'End of day',
        escalateIf: 'Outside the plan for three days in a row: tell the flight surgeon.',
      },
      danger: {
        doNow: ['Book an exercise block in today’s timeline.', 'Prioritise resistive exercise for bone and muscle.'],
        recheckIn: 'End of day',
        escalateIf: 'Three or more days below 60 min: tell the flight surgeon.',
      },
    },
    classify: (value) => {
      const v = num(value)
      return v < 120 || v > 150 ? 'caution' : 'normal'
    },
  },
}

export const INDICATOR_ORDER: IndicatorId[] = ['hr', 'bp', 'spo2', 'temp', 'glu', 'sleep', 'mood', 'exercise']

/** Body-system grouping used by the data-entry form */
export const INDICATOR_GROUPS: { title: string; ids: IndicatorId[] }[] = [
  { title: 'Cardiovascular', ids: ['hr', 'bp'] },
  { title: 'Respiratory and thermal', ids: ['spo2', 'temp'] },
  { title: 'Metabolic', ids: ['glu'] },
  { title: 'Sleep', ids: ['sleep'] },
  { title: 'Countermeasures', ids: ['exercise'] },
]

/** NASA HRP five hazards of human spaceflight (https://www.nasa.gov/hrp/hazards/) */
export const HAZARDS: Record<Hazard, { name: string; effect: string }> = {
  R: { name: 'Radiation', effect: 'Higher dose outside Earth’s magnetic field: cancer risk, central nervous system and cardiovascular effects.' },
  I: { name: 'Isolation and confinement', effect: 'Months in a small space with the same people: stress, low mood, poor sleep, crew conflict.' },
  D: { name: 'Distance from Earth', effect: 'Help is far away. At Mars a message takes up to about 20 minutes one way and evacuation is not possible.' },
  G: { name: 'Gravity fields', effect: 'Weightlessness and partial gravity: bone and muscle loss, fluid shift to the head, cardiovascular deconditioning.' },
  E: { name: 'Hostile closed environment', effect: 'Recycled air, CO₂, noise, microbes and limited food and water: immune and nutrition changes.' },
}
export const HAZARD_SOURCE_URL = 'https://www.nasa.gov/hrp/hazards/'

/**
  Combination rules (astro-health-science reference): escalate even when each
  single value is only "caution".
*/
export const COMBINATION_RULES: {
  id: string
  indicators: IndicatorId[]
  title: string
  detail: string
  escalation: 'crew-medical-officer' | 'flight-surgeon'
}[] = [
  {
    id: 'fever-tachycardia',
    indicators: ['temp', 'hr'],
    title: 'Raised temperature with raised heart rate',
    detail: 'Together these can be an early sign of infection. Tell the crew medical officer and re-measure both in 1 hour.',
    escalation: 'crew-medical-officer',
  },
  {
    id: 'sleep-mood',
    indicators: ['sleep', 'mood'],
    title: 'Short sleep with low mood',
    detail: 'Sleep loss and low mood reinforce each other. Consider a private conference with the flight psychologist.',
    escalation: 'crew-medical-officer',
  },
]

/** A reading older than this is shown as "Re-measure" (stale). Glucose is weekly. */
export const STALE_AFTER_HOURS: Record<IndicatorId, number> = {
  hr: 36, bp: 36, spo2: 36, temp: 36, glu: 8 * 24, sleep: 36, mood: 36, exercise: 36,
}
