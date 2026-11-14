import type { Status } from '@/engine/types'

/*
  three.js cannot read CSS oklch tokens directly, so the 3D scene keeps its own
  hex palette here. Keep it in sync with src/styles/tokens.css when the design
  kickoff freezes the colours.
*/
export const STATUS_HEX: Record<'day' | 'night', Record<Status, string>> = {
  day: { normal: '#388d68', caution: '#c97a00', danger: '#d02c2a', 'no-data': '#83868c', stale: '#83868c' },
  night: { normal: '#b8ac68', caution: '#eeb154', danger: '#ec563d', 'no-data': '#99816e', stale: '#99816e' },
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
  'brain:spinal-cord': { day: '#e8d6b0', night: '#c99a68', roughness: 0.45, clearcoat: 0.4 },
  'lungs:airway': { day: '#e6cfc4', night: '#c99070', roughness: 0.5, clearcoat: 0.3 },
  'immune:thymus': { day: '#cf9a8a', night: '#b9785a', roughness: 0.5, clearcoat: 0.4 },
  'immune:lymph': { day: '#9fbf6e', night: '#b8a45a', roughness: 0.45, clearcoat: 0.5 },
  'whole-body:liver': { day: '#7a2a1e', night: '#9a4a2c', roughness: 0.35, clearcoat: 0.7, sheen: '#b5574a' },
  'whole-body:gallbladder': { day: '#4f7a3c', night: '#8a8040', roughness: 0.3, clearcoat: 0.8 },
  'whole-body:pancreas': { day: '#e0b98a', night: '#c99a62', roughness: 0.55, clearcoat: 0.3 },
  'whole-body:intestine': { day: '#d99a8c', night: '#c27a5a', roughness: 0.45, clearcoat: 0.5, sheen: '#f0c0b5' },
  'whole-body:kidney': { day: '#8a2f2a', night: '#a04a30', roughness: 0.35, clearcoat: 0.7 },
  'whole-body:bladder': { day: '#e3c98a', night: '#c9a062', roughness: 0.4, clearcoat: 0.5 },
  'whole-body:stomach': { day: '#d98a80', night: '#c47458', roughness: 0.45, clearcoat: 0.5, sheen: '#f2b8ad' },
}

/** Name shown when hovering a part of the body */
export const TISSUE_LABEL: Record<string, string> = {
  'whole-body:base': 'Skin',
  'brain:base': 'Brain',
  'brain:spinal-cord': 'Spinal cord',
  'eyes:base': 'Eyes',
  'heart:base': 'Heart',
  'heart:artery': 'Coronary arteries',
  'heart:vein': 'Coronary veins',
  'lungs:base': 'Lungs',
  'lungs:airway': 'Trachea and bronchi',
  'immune:base': 'Spleen',
  'immune:thymus': 'Thymus',
  'immune:lymph': 'Lymph nodes',
  'musculoskeletal:base': 'Skeleton',
  'whole-body:liver': 'Liver',
  'whole-body:gallbladder': 'Gallbladder',
  'whole-body:pancreas': 'Pancreas',
  'whole-body:intestine': 'Intestines',
  'whole-body:kidney': 'Kidneys',
  'whole-body:bladder': 'Bladder',
  'whole-body:stomach': 'Stomach',
}

export const FALLBACK_TISSUE: TissueLook = { day: '#bbbbbb', night: '#8b7a66', roughness: 0.5, clearcoat: 0.2 }
