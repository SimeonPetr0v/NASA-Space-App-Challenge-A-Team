import type { Status } from '@/engine/types'

/*
  Status = colour + shape + word (never colour alone). Shapes follow
  alarm-priority conventions used in high-performance HMI (ISA-101):
  normal  - small filled circle, quiet
  caution - triangle
  danger  - diamond
  no data - hollow ring
*/
export type Shape = 'circle' | 'triangle' | 'diamond' | 'ring'

export const STATUS_META: Record<Status, { word: string; shape: Shape; glyph: string; ink: string; soft: string; rule: string }> = {
  normal: { word: 'Nominal', shape: 'circle', glyph: 'text-status-ok', ink: 'text-status-ok-ink', soft: 'bg-status-ok-soft', rule: 'bg-status-ok' },
  caution: { word: 'Caution', shape: 'triangle', glyph: 'text-status-caution', ink: 'text-status-caution-ink', soft: 'bg-status-caution-soft', rule: 'bg-status-caution' },
  danger: { word: 'Act now', shape: 'diamond', glyph: 'text-status-danger', ink: 'text-status-danger-ink', soft: 'bg-status-danger-soft', rule: 'bg-status-danger' },
  'no-data': { word: 'Measure', shape: 'ring', glyph: 'text-status-none', ink: 'text-status-none-ink', soft: 'bg-status-none-soft', rule: 'bg-status-none' },
  stale: { word: 'Re-measure', shape: 'ring', glyph: 'text-status-none', ink: 'text-status-none-ink', soft: 'bg-status-none-soft', rule: 'bg-status-none' },
}
