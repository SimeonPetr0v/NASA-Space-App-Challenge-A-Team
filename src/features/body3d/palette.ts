import type { Status } from '@/engine/types'

/*
  three.js cannot read CSS oklch tokens directly, so the 3D scene keeps its own
  hex palette here. Keep it in sync with src/styles/tokens.css when the design
  kickoff freezes the colours.
*/
export const STATUS_HEX: Record<'day' | 'night', Record<Status, string>> = {
  day: { normal: '#2f9e6a', caution: '#e0a526', danger: '#d9452e', 'no-data': '#8a8a8a', stale: '#8a8a8a' },
  night: { normal: '#b9a64a', caution: '#e39a3a', danger: '#d9542f', 'no-data': '#8b7a66', stale: '#8b7a66' },
}

/*
  Tissue looks keyed by `${region}:${part}` (material names in body.glb).
  Colours follow anatomy-atlas conventions: myocardium deep red-brown,
  arteries bright red, veins blue (warm plum in night mode — no blue light).
*/
export type TissueLook = {
  day: string
  night: string
  roughness: number
  clearcoat: number
  sheen?: string
}

export const TISSUE: Record<string, TissueLook> = {
  'whole-body:base': { day: '#a9bccb', night: '#8a5a3c', roughness: 0.3, clearcoat: 0.3 },
  'brain:base': { day: '#d8a7a2', night: '#c98a62', roughness: 0.42, clearcoat: 0.55, sheen: '#f3d1cc' },
  'eyes:base': { day: '#f1efe9', night: '#d9b98a', roughness: 0.15, clearcoat: 1 },
  'heart:base': { day: '#8c2a22', night: '#a8442c', roughness: 0.36, clearcoat: 0.75, sheen: '#d9655a' },
  'heart:artery': { day: '#c0141c', night: '#c8452a', roughness: 0.3, clearcoat: 0.8, sheen: '#ff6a5c' },
  'heart:vein': { day: '#2d3f8c', night: '#6b3445', roughness: 0.3, clearcoat: 0.8, sheen: '#6f84d6' },
  'lungs:base': { day: '#d98f8c', night: '#c46d4f', roughness: 0.55, clearcoat: 0.4, sheen: '#f4c3bf' },
  'immune:base': { day: '#6e2238', night: '#8c3f2c', roughness: 0.4, clearcoat: 0.6, sheen: '#a8506a' },
  'musculoskeletal:base': { day: '#e4dccb', night: '#c9a77d', roughness: 0.7, clearcoat: 0.1 },
}

export const FALLBACK_TISSUE: TissueLook = { day: '#bbbbbb', night: '#8b7a66', roughness: 0.5, clearcoat: 0.2 }
