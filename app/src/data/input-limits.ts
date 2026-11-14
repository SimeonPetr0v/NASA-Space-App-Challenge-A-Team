import type { IndicatorId } from '../engine/types'

export type InputLimit = { min: number; max: number; step: number; note: string; sourceUrl: string }

// These are data-entry envelopes, not physiological limits or safe ranges.
export const INPUT_LIMITS: Record<Exclude<IndicatorId, 'bp'>, InputLimit> = {
  hr: { min: 1, max: 650, step: 1, note: 'Entry ceiling includes a buffer above a published ~600 bpm arrhythmia case. Extreme values need immediate medical review.', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/22368381/' },
  spo2: { min: 0, max: 100, step: 1, note: 'A percentage cannot exceed 100. Very low pulse-oximeter estimates may be unreliable; recheck and seek medical support.', sourceUrl: 'https://www.fda.gov/consumers/consumer-updates/pulse-oximeter-basics' },
  temp: { min: 34, max: 42.2, step: 0.1, note: 'Example clinical thermometer display envelope, not a human survival range. Confirm the actual onboard instrument and measurement site.', sourceUrl: 'https://www.braunhealthcare.com/wp-content/uploads/sites/4/irt6020_6030_6500_6510_om_a007471r1_r4_20jun22_manual.pdf' },
  glu: { min: 10, max: 600, step: 1, note: 'Example Accu-Chek numeric meter envelope. HI/LO is an out-of-range result, not a number to guess.', sourceUrl: 'https://www.accu-chek.com.ph/node/41/support' },
  sleep: { min: 0, max: 24, step: 0.1, note: 'Total sleep during the last 24 hours, including naps; not time in bed.', sourceUrl: 'https://www.nasa.gov/reference/7-0-habit-ability-functions-vol-2/' },
  mood: { min: 1, max: 5, step: 1, note: 'Legacy mood data only. New entries use the separate WHO-5 check-in.', sourceUrl: 'https://www.who.int/publications/m/item/who-ucn-msd-mhe-2024.01' },
  exercise: { min: 0, max: 300, step: 1, note: 'Total active exercise minutes today, not another session to add. 300 is a demo logging ceiling (twice the ISS 150-minute allocation), not a medical maximum. Follow your prescribed mission plan.', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4971634/' },
}

export const BP_LIMITS = {
  systolic: { min: 60, max: 260, step: 1 },
  diastolic: { min: 40, max: 215, step: 1 },
  note: 'Example cuff measurement envelope, not a safe range. Confirm the actual onboard instrument.',
  sourceUrl: 'https://www.omron-healthcare.com/storage/im1_2_web_hem-7196t1-fleo-en-02-11-2024.pdf',
}

export const OUT_OF_RANGE_ACTION =
  'Check the units and device. If this is a genuine reading or the device shows HI/LO, contact the crew medical officer; do not change the value just to save it.'
