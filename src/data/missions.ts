import type { MissionMode } from '@/engine/types'

/*
  Mission profiles for the mission-mode switcher. One-way light-time delay
  drives the simulated Earth link (docs/flight-surgeon-view.md).
  Science owner: confirm values and sources before the demo.
*/

export type MissionProfile = {
  id: MissionMode
  short: string
  name: string
  gravity: string
  /** One-way signal delay in seconds (default for the demo) */
  delaySec: number
  /** Selectable range in minutes, when the delay depends on orbital geometry */
  delayRangeMin?: [number, number]
  context: string
  sourceUrl: string
}

export const MISSIONS: Record<MissionMode, MissionProfile> = {
  iss: {
    id: 'iss',
    short: 'ISS',
    name: 'Low Earth orbit station',
    gravity: '0 g',
    delaySec: 0.5,
    context: 'Ground support is seconds away. Flight surgeons can join a private medical conference live.',
    sourceUrl: 'https://www.nasa.gov/hrp/hazards/',
  },
  lunar: {
    id: 'lunar',
    short: 'Moon',
    name: 'Lunar surface',
    gravity: '0.16 g',
    delaySec: 1.3,
    context: 'About 1.3 s one way. Conversation with Earth is still possible, with a short lag.',
    sourceUrl: 'https://www.nasa.gov/hrp/hazards/',
  },
  'mars-transit': {
    id: 'mars-transit',
    short: 'Mars transit',
    name: 'Mars transit',
    gravity: '0 g',
    delaySec: 14 * 60,
    delayRangeMin: [4, 22],
    context: 'Messages take minutes each way. The crew must act on guidance before Earth can answer.',
    sourceUrl: 'https://www.nasa.gov/hrp/hazards/',
  },
  'mars-surface': {
    id: 'mars-surface',
    short: 'Mars surface',
    name: 'Mars surface',
    gravity: '0.38 g',
    delaySec: 14 * 60,
    delayRangeMin: [4, 22],
    context: 'Partial gravity and long delay. Watch for dizziness on standing after months in 0 g.',
    sourceUrl: 'https://www.nasa.gov/hrp/hazards/',
  },
}

export const MISSION_ORDER: MissionMode[] = ['iss', 'lunar', 'mars-transit', 'mars-surface']

/** Synthetic scenario: mission day 47 */
export const MISSION_DAY_TODAY = 47
