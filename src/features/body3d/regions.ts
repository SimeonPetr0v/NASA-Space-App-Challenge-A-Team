import type { BodyRegion } from '@/engine/types'

export type Vec3 = [number, number, number]

export type RegionMeta = {
  id: BodyRegion
  label: string
  summary: string
  markerAt: Vec3
  focusTarget: Vec3
  focusDistance: number
}

/*
  Body is ~1.8 units tall, feet at y = 0, facing +z.
  markerAt: where the status marker floats. focusTarget/focusDistance: camera zoom.
*/
export const REGIONS: RegionMeta[] = [
  {
    id: 'brain',
    label: 'Brain · sleep & mood',
    summary: 'Isolation, shift work and ~16 sunrises a day disrupt sleep and mood.',
    markerAt: [0.16, 1.7, 0.05],
    focusTarget: [0, 1.64, 0],
    focusDistance: 0.75,
  },
  {
    id: 'eyes',
    label: 'Eyes · vision (SANS)',
    summary: 'Fluid shifts toward the head can change the eye and optic nerve in long flights.',
    markerAt: [-0.16, 1.6, 0.1],
    focusTarget: [0, 1.61, 0.08],
    focusDistance: 0.55,
  },
  {
    id: 'heart',
    label: 'Heart · pulse & blood pressure',
    summary: 'Weightlessness shifts blood upward and the heart works less, so it deconditions.',
    markerAt: [0.2, 1.27, 0.12],
    focusTarget: [0.03, 1.25, 0.03],
    focusDistance: 0.85,
  },
  {
    id: 'lungs',
    label: 'Lungs · blood oxygen',
    summary: 'Cabin air problems and spacewalk preparation can lower blood oxygen.',
    markerAt: [-0.26, 1.32, 0.05],
    focusTarget: [0, 1.27, 0],
    focusDistance: 1,
  },
  {
    id: 'immune',
    label: 'Immune system · temperature',
    summary: 'Stress and radiation weaken immunity; fever is the first sign of infection.',
    markerAt: [0.26, 1.06, 0.08],
    focusTarget: [0.1, 1.08, 0],
    focusDistance: 0.85,
  },
  {
    id: 'musculoskeletal',
    label: 'Bones & muscles · exercise',
    summary: 'Without gravity, weight-bearing bones lose ~1–1.5 % a month unless crews exercise.',
    markerAt: [0.2, 0.55, 0.06],
    focusTarget: [0, 0.75, 0],
    focusDistance: 1.6,
  },
  {
    id: 'whole-body',
    label: 'Whole body · metabolism',
    summary: 'Limited food, stress and inactivity change blood sugar and body mass.',
    markerAt: [-0.3, 0.95, 0.05],
    focusTarget: [0, 0.95, 0],
    focusDistance: 2.6,
  },
]

export const HOME_VIEW = { position: [0, 1.05, 3.1] as Vec3, target: [0, 0.95, 0] as Vec3 }
