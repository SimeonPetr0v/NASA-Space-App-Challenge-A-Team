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

export const BODY_HEX = {
  day: { skin: '#9fb7c9', bone: '#e8e2d4', brain: '#e7a9b4', heart: '#c8414b', lungs: '#e48b8f', spleen: '#8d3b52', eye: '#f4f4f0' },
  night: { skin: '#8a5a3c', bone: '#c9a77d', brain: '#c98a62', heart: '#b4472f', lungs: '#c46d4f', spleen: '#8c3f2c', eye: '#d9b98a' },
}
