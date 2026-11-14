import type { Status } from '@/engine/types'
import { cn } from '@/lib/utils'

const STATUS_META: Record<Status, { glyph: string; word: string; className: string }> = {
  normal: { glyph: '●', word: 'Nominal', className: 'text-status-ok' },
  caution: { glyph: '▲', word: 'Caution', className: 'text-status-caution' },
  danger: { glyph: '◆', word: 'Act now', className: 'text-status-danger' },
  'no-data': { glyph: '○', word: 'Measure', className: 'text-status-none' },
  stale: { glyph: '○', word: 'Re-measure', className: 'text-status-none' },
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-medium', meta.className, className)}>
      <span aria-hidden="true">{meta.glyph}</span>
      <span>{meta.word}</span>
    </span>
  )
}
