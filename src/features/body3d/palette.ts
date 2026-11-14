import type { Status } from '@/engine/types'

/*
  three.js cannot read CSS oklch tokens directly, so the 3D scene keeps its own
  hex palette here. Keep it in sync with src/styles/tokens.css when the design
  kickoff freezes the colours.
*/
export const STATUS_HEX: Record<'day' | 'night', Record<Status, string>> = {
  day: { normal: '#17784A', caution: '#8F5A00', danger: '#B83227', 'no-data': '#5C6F83', stale: '#5C6F83' },
  night: { normal: '#A9B97A', caution: '#E0A84E', danger: '#E07A5F', 'no-data': '#8C7D6C', stale: '#8C7D6C' },
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
  'whole-body:base': { day: '#a9bccb', night: '#6B5A4C', roughness: 0.3, clearcoat: 0.3 },
  'brain:base': { day: '#d8a7a2', night: '#B08A80', roughness: 0.42, clearcoat: 0.55, sheen: '#f3d1cc' },
  'eyes:base': { day: '#f1efe9', night: '#CFC2B0', roughness: 0.15, clearcoat: 1 },
  'heart:base': { day: '#8c2a22', night: '#8E4A3E', roughness: 0.36, clearcoat: 0.75, sheen: '#d9655a' },
  'heart:artery': { day: '#c0141c', night: '#A84A3A', roughness: 0.3, clearcoat: 0.8, sheen: '#ff6a5c' },
  'heart:vein': { day: '#2d3f8c', night: '#5E4048', roughness: 0.3, clearcoat: 0.8, sheen: '#6f84d6' },
  'lungs:base': { day: '#d98f8c', night: '#A27466', roughness: 0.55, clearcoat: 0.4, sheen: '#f4c3bf' },
  'immune:base': { day: '#6e2238', night: '#6E3D3A', roughness: 0.4, clearcoat: 0.6, sheen: '#a8506a' },
  'musculoskeletal:base': { day: '#e4dccb', night: '#B9A893', roughness: 0.7, clearcoat: 0.1 },
}

export const FALLBACK_TISSUE: TissueLook = { day: '#bbbbbb', night: '#8b7a66', roughness: 0.5, clearcoat: 0.2 }
