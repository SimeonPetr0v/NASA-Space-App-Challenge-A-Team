import type { CrewId } from './crew'
import type { MissionMode } from '@/engine/types'

/*
  Radiation (the R in RIDGE). Effective dose rates per environment from
  published measurements; career limit from NASA-STD-3001. Prior career doses
  are SYNTHETIC. Science owner: confirm values and sources before the demo.
*/

export const CAREER_LIMIT_MSV = 600
export const CAREER_LIMIT_SOURCE = {
  label: 'NASA-STD-3001 Vol. 1 §4.8.2: career effective dose below 600 mSv (OCHMO radiation protection technical brief)',
  url: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-020-radiation-protection.pdf',
}

export const DOSE_RATE: Record<MissionMode, { mSvPerDay: number; label: string; url: string }> = {
  iss: { mSvPerDay: 0.6, label: 'ISS: about 80–160 mSv per 6-month expedition (NASA HRP)', url: 'https://www.nasa.gov/hrp/hazards/' },
  lunar: { mSvPerDay: 1.37, label: 'Lunar surface: 1.37 mSv/day measured by Chang’e-4 LND (Zhang et al., Science Advances 2020)', url: 'https://doi.org/10.1126/sciadv.aaz1334' },
  'mars-transit': { mSvPerDay: 1.84, label: 'Mars cruise: 1.84 mSv/day measured by MSL RAD (Zeitlin et al., Science 2013)', url: 'https://doi.org/10.1126/science.1235989' },
  'mars-surface': { mSvPerDay: 0.64, label: 'Mars surface: 0.64 mSv/day measured by Curiosity RAD (Hassler et al., Science 2014)', url: 'https://doi.org/10.1126/science.1244797' },
}

/** Career dose before this mission (synthetic) */
export const PRIOR_CAREER_MSV: Record<CrewId, number> = { cm1: 182, cm2: 96, cm3: 141 }

/** Solar particle event drill: extra dose with and without the storm shelter (illustrative) */
export const SOLAR_EVENT = { shelteredMSv: 4, unshelteredMSv: 45 }

export const SHELTER_STEPS = [
  'Stop work and move to the storm shelter (water and supply walls).',
  'Take the personal dosimeter with you.',
  'Stay until Mission Control or the dosimeter says the event is over.',
]
