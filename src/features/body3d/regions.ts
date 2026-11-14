import type { BodyRegion } from '@/engine/types'

export type Vec3 = [number, number, number]

export type RegionMeta = {
  id: BodyRegion
  label: string
  short: string
  summary: string
  markerSide: 1 | -1
}

/*
  Region ids match the material names in public/models/body.glb
  (built by scripts/build-body-model.mjs). Marker and zoom positions are
  computed from each region's mesh bounds at runtime (useBodyModel).
*/
export const REGIONS: RegionMeta[] = [
  {
    id: 'brain',
    short: 'Brain',
    label: 'Brain · sleep & mood',
    summary: 'Isolation, shift work and ~16 sunrises a day disrupt sleep and mood.',
    markerSide: 1,
  },
  {
    id: 'eyes',
    short: 'Eyes',
    label: 'Eyes · vision (SANS)',
    summary: 'Fluid shifts toward the head can change the eye and optic nerve in long flights.',
    markerSide: -1,
  },
  {
    id: 'heart',
    short: 'Heart',
    label: 'Heart · pulse & blood pressure',
    summary: 'Weightlessness shifts blood upward and the heart works less, so it deconditions.',
    markerSide: 1,
  },
  {
    id: 'lungs',
    short: 'Lungs',
    label: 'Lungs · blood oxygen',
    summary: 'Cabin air problems and spacewalk preparation can lower blood oxygen.',
    markerSide: -1,
  },
  {
    id: 'immune',
    short: 'Immune',
    label: 'Immune system · temperature',
    summary: 'Stress and radiation weaken immunity; fever is the first sign of infection.',
    markerSide: 1,
  },
  {
    id: 'musculoskeletal',
    short: 'Bone · muscle',
    label: 'Bones & muscles · exercise',
    summary: 'Without gravity, weight-bearing bones lose ~1–1.5 % a month unless crews exercise.',
    markerSide: 1,
  },
  {
    id: 'whole-body',
    short: 'Metabolism',
    label: 'Whole body · metabolism',
    summary: 'Limited food, stress and inactivity change blood sugar and body mass.',
    markerSide: -1,
  },
]

export const HOME_VIEW = { position: [0, 1.05, 3.4] as Vec3, target: [0, 0.95, 0] as Vec3 }

export const MODEL_URL = `${import.meta.env.BASE_URL}models/body.glb`
